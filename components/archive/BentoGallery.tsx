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

const ImageWrapper = styled.div<{ $ratio?: number }>`
  break-inside: avoid;
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e; /* 이미지 로드 전 어두운 배경 유지 */
  
  /* 핵심: 레이아웃 시프트 방지 */
  aspect-ratio: ${props => props.$ratio || '3 / 4'}; 
  contain: paint; /* 브라우저가 개별 요소의 변화를 독립적으로 계산하게 함 */

  @media (max-width: 768px) { margin-bottom: 0.5rem; }
`;

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
        <ScrollContainer ref={scrollRef} onScroll={handleScroll}>
            {isLoading ? (
                <GridContainer>
                    {/* 실제 데이터가 오기 전, 임의의 높이들로 그리드를 미리 채워둠 */}
                    {[300, 450, 200, 350, 400, 250].map((h, i) => (
                        <ImageWrapper key={`skeleton-${i}`}>
                            <SkeletonBox $height={`${h}px`} />
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
                            // 핵심: 이미지 비율이 있다면 여기서 aspect-ratio를 강제하세요.
                            // 스타일 컴포넌트에 $ratio props를 넘겨 처리하면 더 완벽합니다.
                            >
                                <DummyImage
                                    src={img.url}
                                    alt={img.title}
                                    loading="lazy"
                                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                    style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                                />
                            </ImageWrapper>
                        ))}
                    </GridContainer>
                ))
            )}
        </ScrollContainer>
    );
}