'use client'

import { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
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

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100dvh;
  background: #0a0a14; 
  overflow: hidden;
  cursor: none;
  scrollbar-gutter: stable;

  @media (max-width: 768px) {
    cursor: auto;
  }
`

export function Archive() {
  // Selector 최적화: 필요한 상태와 액션만 얕은 비교로 가져옴
  const { images, setImages, setSession } = useArchiveStore(
    useShallow((state) => ({
      images: state.images,
      setImages: state.setImages,
      setSession: state.setSession,
    }))
  )

  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 초기 마운트 및 리사이즈 핸들러
  useEffect(() => {
    setIsMounted(true)
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Auth 로직 분리
  useEffect(() => {
    if (!isMounted) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [isMounted, setSession])

  // 데이터 페칭 로직
  useEffect(() => {
    if (!isMounted) return

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
  }, [isMounted, setImages])

  if (!isMounted) return <Container style={{ background: '#0a0a14' }} />

  return (
    <Container>
      <CustomCursor />
      <Header />

      {/* 데이터가 로드 중이거나 이미지가 존재할 때 갤러리 유지 */}
      {(isLoading || images.length > 0) ? (
        <BentoGallery isLoading={isLoading} />
      ) : (
        <EmptyState />
      )}

      {/* 모바일이 아닐 때만 쉐이더 실행 (CSS 가시성 병행 권장) */}
      {!isMobile && <ScrollShaderOverlay />}

      <UploadZone />
      <ImageModal />
      <LoginModal />
    </Container>
  )
}