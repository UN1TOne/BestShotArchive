'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Scene } from './Scene'
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
  height: 100vh;
  background: #0a0a14; 
  overflow: hidden;
  cursor: none;

  @media (max-width: 768px) {
    cursor: auto;
  }
`

export function Archive() {
  // const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { images, setImages, setSession } = useArchiveStore()
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mql = window.matchMedia('(max-width: 768px)');

    setIsMobile(mql.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  if (!isMounted) {
    return <Container style={{ background: '#0a0a14' }} />;
  }

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
        .order('created_at', { ascending: false });

      if (data && !error) {
        setImages(data);
      }
    };
    fetchImages();
  }, [setImages]);

  return (
    <Container>
      <CustomCursor />
      <Header />
      {/* <Scene scrollContainer={scrollContainerRef} /> */}
      <BentoGallery />
      {!isMobile && <ScrollShaderOverlay />}
      {images.length === 0 && <EmptyState />}
      <UploadZone />
      <ImageModal />
      <LoginModal />
    </Container>
  )
}