'use client'

import { useRef, useEffect } from 'react'
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

const SkeletonBox = styled.div<{ $ratio: number }>`
  width: 100%;
  /* 너비 대비 높이 비율을 예약하여 레이아웃 시프트를 방지함 */
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
  
  /* 이미지가 로드되기 전에도 이 영역의 높이를 미리 확보 */
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
    const randomRatios = [0.7, 1.2, 0.8, 1.5, 0.9, 1.3, 0.6, 1.1];

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

    const SkeletonBox = styled.div<{ $height: string }>`
      width: 100%;
      height: ${props => props.$height};
      background-color: rgba(255, 255, 255, 0.05);
      animation: ${pulse} 1.5s infinite ease-in-out;
      border-radius: 12px;
    `;

    return (
        <ScrollContainer>
            {isLoading ? (
                <GridContainer>
                    {randomRatios.map((ratio, i) => (
                        <ImageWrapper key={i} $ratio={ratio}>
                            <SkeletonBox $ratio={ratio} />
                        </ImageWrapper>
                    ))}
                </GridContainer>
            ) : (
                Array.from({ length: 3 }).map((_, setIndex) => (
                    <GridContainer key={setIndex}>
                        {images.map((img) => (
                            <ImageWrapper
                                key={`${setIndex}-${img.id}`}
                                onClick={() => setSelectedImage(img.id)}
                                // 핵심: 실제 이미지 비율 적용 (이미지 데이터에 width, height가 있다는 가정)
                                $ratio={img.width / img.height}
                            >
                                <DummyImage
                                    src={img.url}
                                    decoding="async"
                                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                    style={{ opacity: 0, transition: 'opacity 0.4s ease-in-out' }}
                                />
                            </ImageWrapper>
                        ))}
                    </GridContainer>
                ))
            )}
        </ScrollContainer>
    );
}