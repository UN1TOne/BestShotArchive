'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import styled, { createGlobalStyle } from 'styled-components'
import { useShallow } from 'zustand/react/shallow'
import { Header } from './Header'
import { BentoGallery } from './BentoGallery'
import { useArchiveStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { ImageModal } from './ImageModal'
import { LoginModal } from './LoginModal'
import { UploadZone } from './UploadZone'

const ScrollShaderOverlay = dynamic(() => import('./ScrollShaderOverlay'), { ssr: false })
const CustomCursor = dynamic(() => import('./CustomCursor').then(mod => mod.CustomCursor), { ssr: false })

const GlobalFlickerFix = createGlobalStyle`
  canvas, .cursor-container {
    pointer-events: none !important;
    user-select: none !important;
  }
`;

const PageWrapper = styled.div<{ $isVisible: boolean }>`
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  background: #0a0a14;
  width: 100%;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  contain: layout paint; 
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

      requestAnimationFrame(() => {
        setTimeout(() => setIsPageReady(true), 300)
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

        <BentoGallery isPageReady={isPageReady} />

        {!isMobile && <ScrollShaderOverlay />}

        <UploadZone />
        <ImageModal />
        <LoginModal />
      </PageWrapper>
    </>
  )
}