'use client'

import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { useArchiveStore } from '@/lib/store'

const CursorOuter = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 215, 0, 0.8);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  will-change: transform, opacity, border-color; /* GPU 가속 힌트 */

  @media (max-width: 768px) {
    display: none;
  }
`

const CursorInner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  will-change: transform, opacity;

  @media (max-width: 768px) {
    display: none;
  }
`

const CursorText = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  padding: 0.5rem 1rem;
  background: rgba(255, 215, 0, 0.9);
  color: #0a0a14;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 50px;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transform: scale(0.8);
  will-change: transform, opacity;

  @media (max-width: 768px) {
    display: none;
  }
`

export function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  // [핵심] mousePosition을 스토어에서 빼고 hoveredImage만 구독합니다.
  const { hoveredImage } = useArchiveStore()

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    const text = textRef.current

    if (!outer || !inner || !text) return

    // [성능 최적화] 매번 애니메이션을 생성하지 않고 파이프라인만 열어둡니다.
    const xMoveOuter = gsap.quickTo(outer, "x", { duration: 0.5, ease: "power3.out" })
    const yMoveOuter = gsap.quickTo(outer, "y", { duration: 0.5, ease: "power3.out" })

    const xMoveInner = gsap.quickTo(inner, "x", { duration: 0.1, ease: "power1.out" })
    const yMoveInner = gsap.quickTo(inner, "y", { duration: 0.1, ease: "power1.out" })

    const xMoveText = gsap.quickTo(text, "x", { duration: 0.3, ease: "power2.out" })
    const yMoveText = gsap.quickTo(text, "y", { duration: 0.3, ease: "power2.out" })

    // React 상태를 거치지 않고 DOM 이벤트를 직접 핸들링
    const handleMouseMove = (e: MouseEvent) => {
      if (outer.style.opacity === '0') {
        gsap.to([outer, inner], { opacity: 1, duration: 0.3 })
      }

      xMoveOuter(e.clientX - 20)
      yMoveOuter(e.clientY - 20)

      xMoveInner(e.clientX - 4)
      yMoveInner(e.clientY - 4)

      xMoveText(e.clientX + 25)
      yMoveText(e.clientY - 10)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const outer = outerRef.current
    const text = textRef.current

    if (!outer || !text) return

    if (hoveredImage) {
      gsap.to(outer, {
        scale: 1.5,
        borderColor: 'rgba(255, 215, 0, 1)',
        duration: 0.3,
        overwrite: 'auto'
      })
      gsap.to(text, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        overwrite: 'auto'
      })
    } else {
      gsap.to(outer, {
        scale: 1,
        borderColor: 'rgba(255, 215, 0, 0.8)',
        duration: 0.3,
        overwrite: 'auto'
      })
      gsap.to(text, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        overwrite: 'auto'
      })
    }
  }, [hoveredImage])

  return (
    <>
      <CursorOuter ref={outerRef} style={{ opacity: 0 }} />
      <CursorInner ref={innerRef} style={{ opacity: 0 }} />
      <CursorText ref={textRef}>View</CursorText>
    </>
  )
}