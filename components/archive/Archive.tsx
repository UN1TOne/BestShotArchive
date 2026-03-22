'use client'

import { useEffect, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { useShallow } from 'zustand/react/shallow'
import { Header } from './Header'
import { UploadZone } from './UploadZone'
import { CustomCursor } from './CustomCursor'
import { EmptyState } from './EmptyState'
import { ImageModal } from './ImageModal'
import { useArchiveStore } from '@/lib/store'
import { LoginModal } from './LoginModal'
import { supabase } from '@/lib/supabase'
import { BentoGallery } from './BentoGallery'
import ScrollShaderOverlay from './ScrollShaderOverlay'

// [CSS-First 방어] JS가 실행되기 전에도 모바일에서 Three.js 캔버스를 즉시 숨김
const GlobalFlickerFix = createGlobalStyle`
  canvas {
    @media (max-width: 768px) {
      display: none !important;
    }
  }
`;

const PageWrapper = styled.div<{ $isVisible: boolean }>`
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: #0a0a14;
  width: 100%;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  /* 브라우저가 이 안의 레이아웃 변화를 밖으로 전파하지 않게 격리 */
  contain: layout paint; 
`;

export function Archive() {
  const { images, setImages, setSession } = useArchiveStore(
    useShallow((state) => ({
      images: state.images,
      setImages: state.setImages,
      setSession: state.setSession,
    }))
  )

  const [isPageReady, setIsPageReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 1. 초기 마운트 시 환경 설정
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)

    const init = async () => {
      // 2. Auth & Data 동시 처리
      const [sessionRes, imagesRes] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('images').select('*').order('created_at', { ascending: false })
      ])

      if (sessionRes.data.session) setSession(sessionRes.data.session)
      if (imagesRes.data) setImages(imagesRes.data)

      // 3. 브라우저가 레이아웃을 완전히 잡을 시간을 준 뒤 커튼을 걷음
      requestAnimationFrame(() => {
        setTimeout(() => setIsPageReady(true), 150)
      })
    }

    init()

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [setImages, setSession])

  return (
    <>
      <GlobalFlickerFix />
      <PageWrapper $isVisible={isPageReady}>
        <CustomCursor />
        <Header />

        {/* 모바일에서는 Three.js 자체를 인스턴스화하지 않음 */}
        {!isMobile && <ScrollShaderOverlay />}

        {images.length > 0 ? (
          <BentoGallery isPageReady={isPageReady} />
        ) : (
          isPageReady && <EmptyState />
        )}

        <UploadZone />
        <ImageModal />
        <LoginModal />
      </PageWrapper>
    </>
  )
}