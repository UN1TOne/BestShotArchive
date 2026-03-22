'use client'

import { useRef, useEffect, useState, useMemo, memo } from 'react'
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
  padding-bottom: 2rem;
  @media (max-width: 768px) { gap: 0.5rem; }
`

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  contain: layout style;
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
  transform: translateZ(0); // GPU 가속
  contain: paint;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover { transform: scale(1.02); }
`

const SkeletonBox = styled.div<{ $ratio: number }>`
  width: 100%;
  aspect-ratio: ${props => props.$ratio};
  background-color: rgba(255, 255, 255, 0.05);
  animation: ${pulse} 1.5s infinite ease-in-out;
`

const StyledImage = styled.img<{ $isLoaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${props => props.$isLoaded ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
`

// 개별 이미지 아이템 최적화
const ImageItem = memo(({ img, onClick }: { img: any, onClick: (id: string) => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ratio = useMemo(() => img.width / img.height || 0.75, [img.width, img.height]);

    useEffect(() => {
        const i = new Image();
        i.src = img.url;
        i.decode()
            .then(() => setIsLoaded(true))
            .catch(() => setIsLoaded(true));
    }, [img.url]);

    return (
        <ImageWrapper $ratio={ratio} onClick={() => onClick(img.id)}>
            <StyledImage src={img.url} $isLoaded={isLoaded} alt="" loading="lazy" />
            {!isLoaded && <SkeletonBox $ratio={ratio} />}
        </ImageWrapper>
    );
});

export function BentoGallery({ isLoading }: { isLoading: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { images, setSelectedImage } = useArchiveStore(
        useShallow((state) => ({
            images: state.images,
            setSelectedImage: state.setSelectedImage,
        }))
    )

    // 컬럼 데이터 분배 (리렌더링 방지)
    const columns = useMemo(() => {
        const colCount = typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 3;
        const result: any[][] = Array.from({ length: colCount }, () => []);

        if (!isLoading && images.length > 0) {
            const tripled = [...images, ...images, ...images]; // 3세트 무한루프용
            tripled.forEach((img, i) => result[i % colCount].push(img));
        }
        return result;
    }, [images, isLoading]);

    // 무한 스크롤 루프 핸들러
    const handleScroll = () => {
        if (!scrollRef.current || isLoading) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3
        if (el.scrollTop >= setHeight * 2) el.scrollTop -= setHeight
        else if (el.scrollTop <= 0) el.scrollTop += setHeight
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
    }, [images.length, isLoading])

    return (
        <ScrollContainer ref={scrollRef} onScroll={handleScroll}>
            <MasonryGrid style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.4s' }}>
                {columns.map((col, colIdx) => (
                    <Column key={`col-${colIdx}`}>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonBox key={`sk-${i}`} $ratio={0.7 + Math.random() * 0.6} />
                            ))
                        ) : (
                            col.map((img, imgIdx) => (
                                <ImageItem
                                    key={`${colIdx}-${imgIdx}-${img.id}`}
                                    img={img}
                                    onClick={setSelectedImage}
                                />
                            ))
                        )}
                    </Column>
                ))}
            </MasonryGrid>
        </ScrollContainer>
    )
}