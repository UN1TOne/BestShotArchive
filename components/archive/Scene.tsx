'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useArchiveStore } from '@/lib/store'

interface SceneProps {
  scrollContainer: React.RefObject<HTMLDivElement | null>
}

export function Scene({ scrollContainer }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0))
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const frameIdRef = useRef<number>(0)

  const scrollOffset = useRef(0)
  const targetOffset = useRef(0)
  const isDragging = useRef(false)
  const lastPointerY = useRef(0)
  const gridHeightRef = useRef(0)
  const dragDistance = useRef(0)

  const {
    images,
    setHoveredImage,
    setSelectedImage,
    hoveredImage,
    selectedImage,
  } = useArchiveStore()

  // 1. 초기화 (기존 유지)
  useEffect(() => {
    if (!containerRef.current) return
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 10
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    scene.add(new THREE.AmbientLight(0xffffff, 1))

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameIdRef.current)
    }
  }, [])

  // 2. 가상 복제 배치 로직 (무한 루프 끊김 방지)
  useEffect(() => {
    if (!sceneRef.current || images.length === 0) return
    const scene = sceneRef.current

    const isMobile = window.innerWidth < 768
    const COLUMNS = isMobile ? 2 : 3
    // [수정] 너비를 더 키워 여백을 줄이고 해상도 차이를 메꿈
    const COLUMN_WIDTH = isMobile ? (window.innerWidth / 130) : (window.innerWidth / 240)
    const GAP = 0.15
    const columnHeights = Array(COLUMNS).fill(0)

    // [핵심] 이미지 개수가 10개 미만이면 3번, 그 이상이면 2번 복제하여 충분한 높이 확보
    const duplicationCount = images.length < 10 ? 3 : 2
    const duplicatedImages = Array.from({ length: duplicationCount }, () => images).flat()

    duplicatedImages.forEach((image, index) => {
      const minHeight = Math.min(...columnHeights)
      const colIndex = columnHeights.indexOf(minHeight)

      const ratio = image.aspectRatio || 1
      const width = COLUMN_WIDTH
      const height = width / ratio

      // [수정] x축 간격도 COLUMN_WIDTH에 딱 맞춰서 벌어지지 않게 고정
      const x = (colIndex - (COLUMNS - 1) / 2) * (COLUMN_WIDTH + GAP)

      // [수정] 이미지의 '중심'이 아닌 '상단'을 기준으로 높이를 계산하여 틈새를 없앰
      const baseY = -minHeight - (height / 2)
      columnHeights[colIndex] += height + GAP

      const meshKey = `${image.id}-${index}`

      if (!meshesRef.current.has(meshKey)) {
        const geometry = new THREE.PlaneGeometry(width, height)
        const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        const mesh = new THREE.Mesh(geometry, material)

        mesh.position.set(x, baseY, 0)
        mesh.userData = { id: image.id, index, baseY, height }

        scene.add(mesh)
        meshesRef.current.set(meshKey, mesh)

        const imgElement = new window.Image()
        if (!image.url.startsWith('data:')) imgElement.crossOrigin = 'anonymous'
        imgElement.src = image.url
        imgElement.onload = () => {
          const texture = new THREE.Texture(imgElement)
          texture.colorSpace = THREE.SRGBColorSpace
          texture.needsUpdate = true
          material.map = texture
          material.needsUpdate = true
          gsap.to(material, { opacity: 1, duration: 0.8 })
        }
      } else {
        const mesh = meshesRef.current.get(meshKey)!
        mesh.position.set(x, baseY, 0)
        mesh.userData.baseY = baseY
      }
    })

    // [중요] 한 세트의 실제 높이를 정확히 계산하여 루프 단위로 설정
    gridHeightRef.current = Math.max(...columnHeights) / duplicationCount
  }, [images])

  // 3. 입력 이벤트 (기존 방향 유지)
  useEffect(() => {
    const canvas = rendererRef.current?.domElement
    if (!canvas) return

    const onPointerDown = (e: PointerEvent) => {
      if (selectedImage) return
      isDragging.current = true
      lastPointerY.current = e.clientY
      dragDistance.current = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      if (!isDragging.current) return
      const deltaY = e.clientY - lastPointerY.current
      lastPointerY.current = e.clientY
      dragDistance.current += Math.abs(deltaY)
      targetOffset.current += deltaY * 0.02
    }

    const onPointerUp = () => (isDragging.current = false)
    const onWheel = (e: WheelEvent) => {
      if (selectedImage) return
      targetOffset.current += e.deltaY * 0.005
    }

    const handleClick = () => {
      if (selectedImage || dragDistance.current > 10) return
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!)
      const intersects = raycasterRef.current.intersectObjects(Array.from(meshesRef.current.values()))
      if (intersects.length > 0) {
        setSelectedImage((intersects[0].object as THREE.Mesh).userData.id)
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('click', handleClick)
    }
  }, [selectedImage, setSelectedImage])

  // 4. 애니메이션 루프 (개선된 무한 루핑 수식)
  useEffect(() => {
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

      scrollOffset.current = THREE.MathUtils.lerp(scrollOffset.current, targetOffset.current, 0.1)

      const loopH = gridHeightRef.current
      const totalH = loopH * (images.length < 10 ? 3 : 2) // 복제본을 포함한 전체 높이
      const elapsed = clockRef.current.getElapsedTime()

      meshesRef.current.forEach((mesh) => {
        // baseY를 기준으로 현재 스크롤 위치 적용
        let y = mesh.userData.baseY + scrollOffset.current

        // [순환 알고리즘] 
        // y가 totalH/2를 넘어가면 아래로, -totalH/2보다 작아지면 위로 순간이동
        const threshold = totalH / 2
        while (y > threshold) y -= totalH
        while (y < -threshold) y += totalH

        mesh.position.y = y + Math.sin(elapsed + mesh.userData.index) * 0.03
      })

      if (!selectedImage) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        const intersects = raycasterRef.current.intersectObjects(Array.from(meshesRef.current.values()))
        let newHoveredId: string | null = null
        meshesRef.current.forEach((mesh) => {
          const isHovered = intersects.length > 0 && intersects[0].object === mesh
          if (isHovered) {
            newHoveredId = mesh.userData.id
            mesh.scale.lerp(new THREE.Vector3(1.03, 1.03, 1.03), 0.1)
          } else {
            mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
          }
        })
        if (newHoveredId !== hoveredImage) setHoveredImage(newHoveredId)
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
    animate()
    return () => cancelAnimationFrame(frameIdRef.current)
  }, [hoveredImage, setHoveredImage, selectedImage])

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0, touchAction: 'none' }} />
}