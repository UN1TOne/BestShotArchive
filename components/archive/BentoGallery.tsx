'use client'

import { useRef, useEffect, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'

const pulse = keyframes`
  0% { background-color: rgba(255, 255, 255, 0.03); }
  50% { background-color: rgba(255, 255, 255, 0.08); }
  100% { background-color: rgba(255, 255, 255, 0.03); }
`;

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

// Skeleton 전용 박스 (Props 필수 전달 해결)
const SkeletonBox = styled.div<{ $ratio: number }>`
  width: 100%;
  aspect-ratio: ${props => props.$ratio}; 
  background-color: rgba(255, 255, 255, 0.05);
  animation: ${pulse} 1.5s infinite ease-in-out;
  border-radius: 12px;
`;

const ImageWrapper = styled.div<{ $ratio?: number }>`
  break-inside: avoid;
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;
  aspect-ratio: ${props => props.$ratio || 'auto'}; 

  @media (max-width: 768px) { margin-bottom: 0.5rem; }
`;

const DummyImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;

  &.loaded {
    opacity: 1;
  }
`;

interface BentoGalleryProps {
    isLoading: boolean;
}

export function BentoGallery({ isLoading }: BentoGalleryProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { images, setSelectedImage } = useArchiveStore()

    // 매 렌더링마다 랜덤값이 바뀌어 깜빡이는 것을 방지하기 위해 useMemo 사용
    const skeletonRatios = useMemo(() =>
        Array.from({ length: 12 }).map(() => 0.7 + Math.random() * 0.8),
        []);

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
            {/* 1. 스켈레톤 레이어 */}
            <div style={{
                opacity: isLoading ? 1 : 0,
                transition: 'opacity 0.5s ease',
                pointerEvents: isLoading ? 'auto' : 'none',
                position: isLoading ? 'relative' : 'absolute',
                width: '100%'
            }}>
                <GridContainer>
                    {skeletonRatios.map((ratio, i) => (
                        <ImageWrapper key={`skeleton-${i}`} $ratio={ratio}>
                            <SkeletonBox $ratio={ratio} />
                        </ImageWrapper>
                    ))}
                </GridContainer>
            </div>

            {/* 2. 실제 이미지 레이어 */}
            {!isLoading && (
                <div style={{ opacity: 1, transition: 'opacity 0.8s ease' }}>
                    {Array.from({ length: 3 }).map((_, setIndex) => (
                        <GridContainer key={setIndex}>
                            {images.map((img) => (
                                <ImageWrapper
                                    key={`${setIndex}-${img.id}`}
                                    $ratio={img.width / img.height}
                                    onClick={() => setSelectedImage(img.id)}
                                >
                                    <DummyImage
                                        src={img.url}
                                        alt={img.title || 'Archive Image'}
                                        onLoad={(e) => e.currentTarget.classList.add('loaded')}
                                    />
                                </ImageWrapper>
                            ))}
                        </GridContainer>
                    ))}
                </div>
            )}
        </ScrollContainer>
    );
}