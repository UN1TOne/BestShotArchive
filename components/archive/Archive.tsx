'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
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

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100dvh;
  background: #0a0a14;
  overflow: hidden;
  cursor: none;

  @media (max-width: 768px) {
    cursor: auto;
  }
`

export function Archive() {
  const { images, setImages, setSession } = useArchiveStore()
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
      if (data && !error) setImages(data)
    }
    fetchImages()
  }, [setImages])

  if (!isMounted) {
    return <Container style={{ background: '#0a0a14' }} />
  }

  return (
    <Container>
      <CustomCursor />
      <Header />
      <BentoGallery />

      {!isMobile && <ScrollShaderOverlay />}

      {images.length === 0 && <EmptyState />}
      <UploadZone />
      <ImageModal />
      <LoginModal />
    </Container>
  )
}