'use client'

import { useEffect, useRef } from 'react'
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

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background: #0a0a14; /* 캔버스 배경이 투명해지면서 이 색상이 기본 배경이 됩니다 */
  overflow: hidden;
  cursor: none; /* CustomCursor를 위해 기본 커서 숨김 */

  @media (max-width: 768px) {
    cursor: auto;
  }
`

export function Archive() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { images, setSession } = useArchiveStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  return (
    <Container>
      <CustomCursor />
      <Header />
      <Scene scrollContainer={scrollContainerRef} />
      {images.length === 0 && <EmptyState />}
      <UploadZone />
      <ImageModal />
      <LoginModal />
    </Container>
  )
}