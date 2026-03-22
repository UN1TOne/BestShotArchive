// Archive.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import styled, { createGlobalStyle } from 'styled-components'
import { useShallow } from 'zustand/react/shallow'
import { Header } from './Header'
import { BentoGallery } from './BentoGallery'
import { useArchiveStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { UploadZone } from './UploadZone'
import { ImageModal } from './ImageModal'
import { LoginModal } from './LoginModal'

const ScrollShaderOverlay = dynamic(() => import('./ScrollShaderOverlay'), { ssr: false })
const CustomCursor = dynamic(() => import('./CustomCursor').then(mod => mod.CustomCursor), { ssr: false })

const GlobalStyle = createGlobalStyle`
  canvas, .cursor-container {
    pointer-events: none !important;
  }
  body {
    background: #0a0a14;
    overscroll-behavior: none;
    margin: 0;
    padding: 0;
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100dvh;
  background: #0a0a14;
  overflow: hidden;
`;

export function Archive() {
  const { setImages, setSession } = useArchiveStore(useShallow(state => ({
    setImages: state.setImages,
    setSession: state.setSession
  })))

  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)

    const bootstrap = async () => {
      const [sessionRes, imagesRes] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('images').select('*').order('created_at', { ascending: false })
      ])
      if (sessionRes.data.session) setSession(sessionRes.data.session)
      if (imagesRes.data) setImages(imagesRes.data)
    }
    bootstrap()
  }, [setImages, setSession])

  if (!isMounted) return null

  return (
    <>
      <GlobalStyle />
      <Container>
        {!isMobile && <CustomCursor />}
        <Header />
        <BentoGallery />
        {!isMobile && <ScrollShaderOverlay />}
        <UploadZone />
        <ImageModal />
        <LoginModal />
      </Container>
    </>
  )
}