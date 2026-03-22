'use client'

import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useArchiveStore } from '@/lib/store'

const ScrollContainer = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  z-index: 10;
  padding: 0 2rem;
  
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (max-width: 768px) { padding: 0 1rem; }
`

const GridContainer = styled.div`
  column-count: 3;
  column-gap: 1rem;
  padding-bottom: 1rem;

  @media (max-width: 768px) {
    column-count: 2;
    column-gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
`

const ImageWrapper = styled.div`
  break-inside: avoid;
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease;
  
  &:hover {
    transform: scale(1.02) translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) { 
    margin-bottom: 0.5rem; 
    &:hover {
      transform: none;
    }
  }
`

const DummyImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

export function BentoGallery() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { images, setSelectedImage } = useArchiveStore()

    // 무한 스크롤 루프 핸들러 (3세트 기준 위아래 순간이동)
    const handleScroll = () => {
        if (!scrollRef.current) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3

        if (el.scrollTop >= setHeight * 2) {
            el.scrollTop -= setHeight
        } else if (el.scrollTop <= 0) {
            el.scrollTop += setHeight
        }
    }

    useEffect(() => {
        if (scrollRef.current && images.length > 0) {
            const timeoutId = setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight / 3
                }
            }, 50)
            return () => clearTimeout(timeoutId)
        }
    }, [images])

    return (
        <ScrollContainer ref={scrollRef} onScroll={handleScroll}>
            {Array.from({ length: 3 }).map((_, setIndex) => (
                <GridContainer key={setIndex}>
                    {images.map((img) => (
                        <ImageWrapper
                            key={`${setIndex}-${img.id}`}
                            onClick={() => setSelectedImage(img.id)}
                        >
                            <DummyImage
                                src={img.url}
                                alt={img.title || 'Archive Image'}
                                loading="lazy"
                            />
                        </ImageWrapper>
                    ))}
                </GridContainer>
            ))}
        </ScrollContainer>
    )
}