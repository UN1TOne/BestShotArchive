'use client'

import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Header } from './Header'
import { UploadZone } from './UploadZone'
import { CustomCursor } from './CustomCursor'
import { ImageModal } from './ImageModal'
import { useArchiveStore } from '@/lib/store'
import { LoginModal } from './LoginModal'
import { supabase } from '@/lib/supabase'
import { BentoGallery } from './BentoGallery'
import ScrollShaderOverlay from './ScrollShaderOverlay'

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100dvh;
  background: #0a0a14; 
  overflow: hidden;
  cursor: none;
  contain: strict; 

  @media (max-width: 768px) {
    cursor: auto;
  }
`

export function Archive() {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const setImages = useArchiveStore(state => state.setImages)
  const setSession = useArchiveStore(state => state.setSession)

  useEffect(() => {
    setIsMounted(true)

    const bootstrap = async () => {
      try {
        const [{ data: { session } }, { data: images }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.from('images').select('*').order('created_at', { ascending: false })
        ])

        setSession(session)
        if (images) setImages(images)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setImages, setSession])

  if (!isMounted) return null

  return (
    <Container>
      <CustomCursor />
      <Header />

      <BentoGallery isLoading={isLoading} />

      <ScrollShaderOverlay />

      <UploadZone />
      <ImageModal />
      <LoginModal />
    </Container>
  )
}