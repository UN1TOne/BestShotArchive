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

  // 1. 초기화 및 리사이즈 (모바일 뷰포트 대응)
  useEffect(() => {
    if (!containerRef.current) return
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 카메라 시야각 조정
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 12
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    // [수정] 모바일 브라우저의 주소창 변화에 대응하기 위해 window.innerHeight를 직접 참조
    const updateSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height)
      if (cameraRef.current) {
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
      }
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    updateSize()
    scene.add(new THREE.AmbientLight(0xffffff, 1.2))

    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
      cancelAnimationFrame(frameIdRef.current)
    }
  }, [])

  // 2. 배치 로직 (이전과 동일하되 여백 및 컬럼 너비 최적화)
  useEffect(() => {
    if (!sceneRef.current || images.length === 0) return
    const isMobile = window.innerWidth < 768
    const COLUMNS = isMobile ? 2 : 3
    const COLUMN_WIDTH = isMobile ? 4.2 : 4.5
    const GAP = 0.15
    const columnHeights = Array(COLUMNS).fill(0)

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
        sceneRef.current?.add(mesh)
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

  // 3. [핵심] 스크롤 방향 및 터치 영역 수정
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
      // 레이캐스터 좌표 업데이트
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1

      if (!isDragging.current) return

      const deltaY = e.clientY - lastPointerY.current
      lastPointerY.current = e.clientY
      dragDistance.current += Math.abs(deltaY)

      // [수정] 방향 반전: -= 로 변경하여 손가락 방향을 따라가도록 설정
      const sensitivity = window.innerWidth < 768 ? 0.04 : 0.02
      targetOffset.current -= deltaY * sensitivity // += 에서 -= 로 변경
    }

    const onPointerUp = () => (isDragging.current = false)

    const onWheel = (e: WheelEvent) => {
      if (selectedImage) return
      // [수정] 휠 방향도 자연스럽게 조정
      targetOffset.current += e.deltaY * 0.005
    }

    const handleClick = (e: MouseEvent) => {
      if (selectedImage || dragDistance.current > 5) return // 드래그 시 클릭 방지 감도 강화
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!)
      const intersects = raycasterRef.current.intersectObjects(Array.from(meshesRef.current.values()))
      if (intersects.length > 0) {
        setSelectedImage((intersects[0].object as THREE.Mesh).userData.id)
      }
    }

    // 이벤트를 window가 아닌 canvas와 전역에 적절히 분배
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('click', handleClick)
    }
  }, [selectedImage, setSelectedImage])

  // 4. 애니메이션 루프 (기존 유지)
  useEffect(() => {
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
      scrollOffset.current = THREE.MathUtils.lerp(scrollOffset.current, targetOffset.current, 0.15)

      const loopH = gridHeightRef.current
      const totalH = loopH * (images.length < 10 ? 4 : 2)
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

  // [수정] 하단 터치 차단 방지를 위해 z-index와 pointer-events 최적화
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh', // 최신 브라우저용 동적 높이
        zIndex: 0,
        touchAction: 'none',
        overflow: 'hidden'
      }}
    />
  )
}