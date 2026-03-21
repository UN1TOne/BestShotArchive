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
  const frameIdRef = useRef<number>(0)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())

  const {
    images,
    setHoveredImage,
    setSelectedImage,
    hoveredImage,
    selectedImage,
    markImageAsOld,
  } = useArchiveStore()

  useEffect(() => {
    if (!containerRef.current) return

    // [핵심 수정 1] 기존에 남아있는 캔버스가 있다면 강제로 모두 지웁니다 (Strict Mode, HMR 대비)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }

    const scene = new THREE.Scene()
    scene.background = null // 초기화 시점부터 투명하게 설정
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 10
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0) // WebGL 렌더러 자체를 투명하게

    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

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

      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
      if (sceneRef.current) {
        sceneRef.current.clear()
      }

      // [핵심 수정 2] Strict Mode로 인해 재마운트 될 때 기존 이미지 데이터 참조를 초기화하여
      // 다음 렌더링 시 새 캔버스에 이미지가 정상적으로 다시 그려지도록 유도합니다.
      meshesRef.current.clear()

      // 안전한 DOM 노드 제거
      if (containerRef.current && rendererRef.current) {
        if (containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const handleClick = () => {
      if (!cameraRef.current || !sceneRef.current) return
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const meshArray = Array.from(meshesRef.current.values())
      const intersects = raycasterRef.current.intersectObjects(meshArray)

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh
        const imageId = mesh.userData.id
        setSelectedImage(imageId)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [setSelectedImage])

  // 이미지 텍스처 로딩 및 렌더링
  useEffect(() => {
    if (!sceneRef.current) return
    const scene = sceneRef.current

    images.forEach((image, index) => {
      if (!meshesRef.current.has(image.id)) {
        const baseSize = 3
        const width = image.aspectRatio >= 1 ? baseSize : baseSize * image.aspectRatio
        const height = image.aspectRatio >= 1 ? baseSize / image.aspectRatio : baseSize

        const geometry = new THREE.PlaneGeometry(width, height, 16, 16)
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          color: 0xffffff
        })

        const mesh = new THREE.Mesh(geometry, material)

        const targetX = image.position?.x ?? (Math.random() - 0.5) * 10
        const targetY = image.position?.y ?? (Math.random() - 0.5) * 6
        const targetZ = image.position?.z ?? (Math.random() * -3)

        mesh.position.set(targetX, targetY + 2, targetZ)
        mesh.rotation.z = (Math.random() - 0.5) * 0.2
        mesh.userData = { id: image.id, index, initialY: targetY }

        scene.add(mesh)
        meshesRef.current.set(image.id, mesh)

        const imgElement = new window.Image()

        // [핵심 해결 포인트] Base64(업로드된 파일)일 경우 CORS 설정을 하지 않음
        if (!image.url.startsWith('data:')) {
          imgElement.crossOrigin = 'anonymous'
        }

        imgElement.src = image.url

        imgElement.onload = () => {
          const texture = new THREE.Texture(imgElement)
          texture.colorSpace = THREE.SRGBColorSpace
          texture.needsUpdate = true

          material.map = texture
          material.needsUpdate = true

          // 로딩 성공 시 캔버스 내부에 사진이 나타남
          gsap.to(mesh.position, { y: targetY, duration: 1.5, ease: 'expo.out' })
          gsap.to(material, { opacity: 1, duration: 1 })

          if (image.isNew && markImageAsOld) {
            markImageAsOld(image.id)
          }
        }

        imgElement.onerror = (err) => {
          console.error('이미지 로드 실패:', err, image.url);
        }
      }
    })

    const currentIds = new Set(images.map((img) => img.id))
    meshesRef.current.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh)
        mesh.geometry.dispose()

        const material = mesh.material as THREE.MeshBasicMaterial
        if (material.map) {
          material.map.dispose()
        }
        material.dispose()

        meshesRef.current.delete(id)
      }
    })
  }, [images, markImageAsOld])

  useEffect(() => {
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

      const elapsed = clockRef.current.getElapsedTime()

      // [최적화 핵심] View 모드(모달이 열린 상태)일 때는 무거운 연산을 스킵합니다.
      if (selectedImage) {
        // 둥둥 떠다니는 애니메이션(Floating)만 가볍게 돌리고, 
        // 무거운 Raycaster(Hover 감지)와 카메라 이동은 멈춥니다.
        meshesRef.current.forEach((mesh) => {
          mesh.position.y = mesh.userData.initialY + Math.sin(elapsed + mesh.userData.index) * 0.1
        })
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        return // 여기서 함수를 종료하여 아래의 무거운 로직을 실행하지 않음
      }

      // --- 아래는 모달이 닫혀있을 때만 실행되는 로직 ---

      // Mouse Lerp for Camera
      cameraRef.current.position.x += (mouseRef.current.x * 2 - cameraRef.current.position.x) * 0.05
      cameraRef.current.position.y += (mouseRef.current.y * 2 - cameraRef.current.position.y) * 0.05
      cameraRef.current.lookAt(0, 0, 0)

      // Raycaster for Hover interactions
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const meshArray = Array.from(meshesRef.current.values())
      const intersects = raycasterRef.current.intersectObjects(meshArray)

      let newHoveredId: string | null = null

      meshesRef.current.forEach((mesh, id) => {
        const isHovered = intersects.length > 0 && intersects[0].object === mesh
        const targetY = mesh.userData.initialY

        if (isHovered) {
          newHoveredId = id
          mesh.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1)
        } else {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
        }

        mesh.position.y = targetY + Math.sin(elapsed + mesh.userData.index) * 0.1
      })

      if (newHoveredId !== hoveredImage) {
        setHoveredImage(newHoveredId)
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }

    animate()
    return () => cancelAnimationFrame(frameIdRef.current)
  }, [hoveredImage, setHoveredImage, selectedImage])

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
}