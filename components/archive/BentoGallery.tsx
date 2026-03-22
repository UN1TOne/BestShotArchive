'use client'

import { useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'

const pulse = keyframes`
  0% { background-color: rgba(255, 255, 255, 0.05); }
  50% { background-color: rgba(255, 255, 255, 0.1); }
  100% { background-color: rgba(255, 255, 255, 0.05); }
`

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
  background: rgba(255, 255, 255, 0.05); /* 로딩 전 배경색 */
  
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease;
  
  &:hover {
    transform: scale(1.02) translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) { 
    margin-bottom: 0.5rem; 
    &:hover { transform: none; }
  }
`

const SkeletonBox = styled.div<{ height: string }>`
  width: 100%;
  height: ${props => props.height};
  animation: ${pulse} 1.5s infinite ease-in-out;
`

const DummyImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* 이미지가 로드될 때 부드럽게 나타나도록 애니메이션 추가 */
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

interface BentoGalleryProps {
    isLoading: boolean;
}

export function BentoGallery({ isLoading }: BentoGalleryProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { images, setSelectedImage } = useArchiveStore()

    const handleScroll = () => {
        if (!scrollRef.current || isLoading) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3

        if (el.scrollTop >= setHeight * 2) {
            el.scrollTop -= setHeight
        } else if (el.scrollTop <= 0) {
            el.scrollTop += setHeight
        }
    }

    useEffect(() => {
        if (scrollRef.current && images.length > 0 && !isLoading) {
            const timeoutId = setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight / 3
                }
            }, 50)
            return () => clearTimeout(timeoutId)
        }
    }, [images, isLoading])

    return (
        <ScrollContainer ref={scrollRef} onScroll={handleScroll}>
            {/* 1. 로딩 중일 때 스켈레톤 그리드 표시 */}
            {isLoading ? (
                <GridContainer>
                    {[250, 320, 180, 400, 300, 220, 350, 280, 200].map((h, i) => (
                        <ImageWrapper key={`skeleton-${i}`}>
                            <SkeletonBox height={`${h}px`} />
                        </ImageWrapper>
                    ))}
                </GridContainer>
            ) : (
                /* 2. 로딩 완료 후 실제 이미지 그리드 (3세트 무한루프) */
                Array.from({ length: 3 }).map((_, setIndex) => (
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
                ))
            )}
        </ScrollContainer>
    )
}