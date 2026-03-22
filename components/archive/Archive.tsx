'use client'

import { useEffect, useState } from 'react'
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
  scrollbar-gutter: stable; 
  position: relative;
  width: 100%;
  height: 100dvh;
  background: #0a0a14;
  overflow-y: auto;
`;

export function Archive() {
  const { images, setImages, setSession } = useArchiveStore()
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)

    // Auth Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Fetch Images
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .order('created_at', { ascending: false })

        if (data && !error) setImages(data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchImages()

    return () => {
      mql.removeEventListener('change', handler)
      subscription.unsubscribe()
    }
  }, [setImages, setSession])

  if (!isMounted) {
    return <Container style={{ background: '#0a0a14' }} />
  }

  return (
    <Container>
      <CustomCursor />
      <Header />
      <BentoGallery isLoading={isLoading} />

      <ScrollShaderOverlay />
      {images.length === 0 && !isLoading && <EmptyState />}
      <UploadZone />
      <ImageModal />
      <LoginModal />
    </Container>
  )
}