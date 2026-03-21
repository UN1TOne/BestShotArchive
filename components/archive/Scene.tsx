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

  useEffect(() => {
    if (!containerRef.current) return
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // [모바일 대응] FOV를 살짝 키워 더 넓은 영역을 보이게 함
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 12
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    scene.add(new THREE.AmbientLight(0xffffff, 1.2))

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

  useEffect(() => {
    if (!sceneRef.current || images.length === 0) return
    const scene = sceneRef.current

    const isMobile = window.innerWidth < 768
    const COLUMNS = isMobile ? 2 : 3
    // [레이아웃 수정] 모바일에서 짤리지 않도록 너비 계산 방식을 고정 수치 기반으로 변경
    const COLUMN_WIDTH = isMobile ? 4.2 : 4.5
    const GAP = 0.15
    const columnHeights = Array(COLUMNS).fill(0)

    // 모바일에서는 빈 공간 방지를 위해 최소 4세트 이상 복제
    const duplicationCount = images.length < 10 ? 4 : 2
    const duplicatedImages = Array.from({ length: duplicationCount }, () => images).flat()

    duplicatedImages.forEach((image, index) => {
      const minHeight = Math.min(...columnHeights)
      const colIndex = columnHeights.indexOf(minHeight)

      const ratio = image.aspectRatio || 1
      const width = COLUMN_WIDTH
      const height = width / ratio

      const x = (colIndex - (COLUMNS - 1) / 2) * (COLUMN_WIDTH + GAP)
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

    gridHeightRef.current = Math.max(...columnHeights) / duplicationCount
  }, [images])

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

      // [모바일 대응] 터치 감도를 데스크탑보다 더 민감하게 설정
      const sensitivity = window.innerWidth < 768 ? 0.04 : 0.02
      targetOffset.current += deltaY * sensitivity
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

  useEffect(() => {
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

      // Lerp 수치를 조절하여 더 쫀득한 반응성 부여
      scrollOffset.current = THREE.MathUtils.lerp(scrollOffset.current, targetOffset.current, 0.15)

      const loopH = gridHeightRef.current
      const duplicationCount = images.length < 10 ? 4 : 2
      const totalH = loopH * duplicationCount
      const elapsed = clockRef.current.getElapsedTime()

      meshesRef.current.forEach((mesh) => {
        let y = mesh.userData.baseY + scrollOffset.current
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
  }, [hoveredImage, images.length, selectedImage])

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0, touchAction: 'none' }} />
}