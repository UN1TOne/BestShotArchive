'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { X, Trash2, Loader2 } from 'lucide-react'
import { useArchiveStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.$isOpen ? 'auto' : 'none')};
  transition: opacity 0.4s ease;
  transform: translateZ(0);
  will-change: opacity;
`

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`

const ImageContainer = styled.div<{ $aspectRatio: number }>`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
  aspect-ratio: ${(props) => props.$aspectRatio};
  max-width: 80vw;
  max-height: 70vh;
  width: 100%;
  background: #1a1a2e;
  display: flex;
  justify-content: center;
  align-items: center;
`

const ModalImage = styled.img<{ $loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  opacity: ${(props) => (props.$loaded ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
`

const ImageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
`

const InfoItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Actions = styled.div`
  display: flex;
  gap: 1rem;
`

const ActionButton = styled.button<{ $variant?: 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: ${(props) =>
    props.$variant === 'danger'
      ? 'rgba(255, 100, 100, 0.1)'
      : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid
    ${(props) =>
    props.$variant === 'danger'
      ? 'rgba(255, 100, 100, 0.3)'
      : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 50px;
  color: ${(props) =>
    props.$variant === 'danger' ? '#ff6464' : 'rgba(255, 255, 255, 0.8)'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: ${(props) =>
    props.$variant === 'danger'
      ? 'rgba(255, 100, 100, 0.2)'
      : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
`

export function ImageModal() {
  const { selectedImage, images, setSelectedImage, removeImage, session } = useArchiveStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const image = images.find((img) => img.id === selectedImage)

  useEffect(() => {
    if (selectedImage && contentRef.current) {
      setIsImageLoaded(false)
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      )
    }
  }, [selectedImage])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setSelectedImage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedImage, isDeleting])

  const handleDelete = async () => {
    if (!image || !session) return
    if (!window.confirm('정말 이 이미지를 아카이브에서 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      const { error: dbError } = await supabase.from('images').delete().eq('id', image.id)
      if (dbError) throw dbError

      const fileName = image.url.split('/').pop()
      if (fileName) {
        await supabase.storage.from('archive-images').remove([`public/${fileName}`])
      }

      removeImage(image.id)
      setSelectedImage(null)
    } catch (error) {
      console.error(error)
      alert('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!image) return null

  const aspectRatio = image.width && image.height ? image.width / image.height : 1

  return (
    <Overlay $isOpen={!!selectedImage} onClick={() => !isDeleting && setSelectedImage(null)}>
      <CloseButton onClick={() => !isDeleting && setSelectedImage(null)}>
        <X size={24} />
      </CloseButton>

      <ModalContent ref={contentRef} onClick={(e) => e.stopPropagation()}>
        <ImageContainer $aspectRatio={aspectRatio}>
          <ModalImage
            src={image.url}
            alt={image.title || 'Image'}
            $loaded={isImageLoaded}
            onLoad={() => setIsImageLoaded(true)}
            style={{ opacity: isDeleting ? 0.5 : (isImageLoaded ? 1 : 0) }}
          />
        </ImageContainer>

        <ImageInfo>
          {image.title && <InfoItem>{image.title}</InfoItem>}
          <InfoItem>
            {image.width} × {image.height}
          </InfoItem>
        </ImageInfo>

        <Actions>
          {session && (
            <ActionButton $variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </ActionButton>
          )}
        </Actions>
      </ModalContent>
    </Overlay>
  )
}