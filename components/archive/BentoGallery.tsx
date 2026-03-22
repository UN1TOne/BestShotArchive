'use client'

import React, { useRef, useEffect, useState, useMemo, memo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { useShallow } from 'zustand/react/shallow'

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
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  @media (max-width: 768px) { padding: 0 1rem; }
`

const MasonryGrid = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  padding-bottom: 5rem;
  @media (max-width: 768px) { gap: 0.5rem; }
`

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  contain: layout style; // 개별 컬럼의 레이아웃 변화 격리
  @media (max-width: 768px) { gap: 0.5rem; }
`

const ImageWrapper = styled.div<{ $ratio: number }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${props => props.$ratio};
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;
  cursor: pointer;
  transform: translateZ(0); // GPU 레이어 분리
  contain: paint;
  transition: transform 0.3s ease-out;
  &:active { transform: scale(0.98); }
`

const SkeletonBox = styled.div`
  width: 100%;
  height: 100%;
  animation: ${pulse} 1.5s infinite ease-in-out;
`

const StyledImage = styled.img<{ $isLoaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${props => props.$isLoaded ? 1 : 0};
  transition: opacity 0.4s ease-in-out;
  /* 폰을 껐다 켤 때 리페인팅 최적화 */
  will-change: opacity; 
`

// [핵심] 개별 이미지 아이템의 렌더링 권한을 브라우저 유휴 시간으로 위임
const ImageItem = memo(({ img, onClick }: { img: any, onClick: (id: string) => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ratio = useMemo(() => img.width / img.height || 0.75, [img.width, img.height]);

    useEffect(() => {
        let isCancelled = false;

        // 브라우저가 바쁘지 않을 때 이미지를 디코딩하도록 예약 (requestIdleCallback)
        const handle = (window as any).requestIdleCallback(() => {
            const i = new Image();
            i.src = img.url;
            i.decode()
                .then(() => {
                    if (!isCancelled) setIsLoaded(true);
                })
                .catch(() => {
                    if (!isCancelled) setIsLoaded(true);
                });
        });

        return () => {
            isCancelled = true;
            (window as any).cancelIdleCallback(handle);
        };
    }, [img.url]);

    return (
        <ImageWrapper $ratio={ratio} onClick={() => onClick(img.id)}>
            <StyledImage src={img.url} $isLoaded={isLoaded} alt="" />
            {!isLoaded && <SkeletonBox />}
        </ImageWrapper>
    );
});

export function BentoGallery({ isPageReady }: { isPageReady: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { images, setSelectedImage } = useArchiveStore(useShallow(state => ({
        images: state.images,
        setSelectedImage: state.setSelectedImage
    })))

    // 무한 루프 데이터 분배
    const columns = useMemo(() => {
        const colCount = typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 3;
        const result: any[][] = Array.from({ length: colCount }, () => []);

        if (images.length > 0) {
            const tripled = [...images, ...images, ...images];
            tripled.forEach((img, i) => result[i % colCount].push(img));
        }
        return result;
    }, [images]);

    const handleScroll = () => {
        if (!scrollRef.current || !isPageReady) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3
        if (el.scrollTop >= setHeight * 2) el.scrollTop -= setHeight
        else if (el.scrollTop <= 0) el.scrollTop += setHeight
    }

    useEffect(() => {
        if (scrollRef.current && images.length > 0 && isPageReady) {
            const el = scrollRef.current;
            el.scrollTop = el.scrollHeight / 3;
        }
    }, [isPageReady, images.length])

    return (
        <ScrollContainer ref={scrollRef} onScroll={handleScroll}>
            <MasonryGrid>
                {columns.map((col, colIdx) => (
                    <Column key={`col-${colIdx}`}>
                        {col.map((img, imgIdx) => (
                            <ImageItem
                                key={`${colIdx}-${imgIdx}-${img.id}`}
                                img={img}
                                onClick={setSelectedImage}
                            />
                        ))}
                    </Column>
                ))}
            </MasonryGrid>
        </ScrollContainer>
    )
}