'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import styled, { createGlobalStyle } from 'styled-components'
import { useShallow } from 'zustand/react/shallow'
import { Header } from './Header'
import { BentoGallery } from './BentoGallery'
import { useArchiveStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

const ScrollShaderOverlay = dynamic(() => import('./ScrollShaderOverlay'), {
  ssr: false
})

const CustomCursor = dynamic(() => import('./CustomCursor').then(mod => mod.CustomCursor), {
  ssr: false
})

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
  contain: strict; 
`;

export function Archive() {
  const { setImages, setSession } = useArchiveStore(
    useShallow((state) => ({
      setImages: state.setImages,
      setSession: state.setSession,
    }))
  )

  const [isPageReady, setIsPageReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)

    const init = async () => {
      const [sessionRes, imagesRes] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('images').select('*').order('created_at', { ascending: false })
      ])

      if (sessionRes.data.session) setSession(sessionRes.data.session)
      if (imagesRes.data) setImages(imagesRes.data)

      // 하이드레이션 완료 후 브라우저가 안정화될 시간을 줌
      requestAnimationFrame(() => {
        setTimeout(() => setIsPageReady(true), 200)
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
        {!isMobile && <CustomCursor />}

        <Header />

        <BentoGallery isLoading={!isPageReady} />

        {!isMobile && <ScrollShaderOverlay />}

      </PageWrapper>
    </>
  )
}