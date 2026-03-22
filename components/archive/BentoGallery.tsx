'use client'

import React, { useRef, useEffect, useMemo, memo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { useShallow } from 'zustand/react/shallow'
import { EmptyState } from './EmptyState' // EmptyState 임포트

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
  transform: translateZ(0); 
  contain: paint;
`

const SkeletonBox = styled.div<{ $ratio: number }>`
  width: 100%;
  aspect-ratio: ${props => props.$ratio};
  background-color: rgba(255, 255, 255, 0.05);
  animation: ${pulse} 1.5s infinite ease-in-out;
  border-radius: 12px;
`

const StyledImage = styled.img<{ $isLoaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${props => props.$isLoaded ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
`

const ImageItem = memo(({ img, onClick }: { img: any, onClick: (id: string) => void }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const ratio = useMemo(() => img.width / img.height || 0.75, [img.width, img.height]);

    React.useEffect(() => {
        const i = new Image();
        i.src = img.url;
        i.decode().then(() => setIsLoaded(true)).catch(() => setIsLoaded(true));
    }, [img.url]);

    return (
        <ImageWrapper $ratio={ratio} onClick={() => onClick(img.id)}>
            <StyledImage src={img.url} $isLoaded={isLoaded} alt="" />
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
        if (!scrollRef.current || isLoading) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3
        if (el.scrollTop >= setHeight * 2) el.scrollTop -= setHeight
        else if (el.scrollTop <= 0) el.scrollTop += setHeight
    }

    useEffect(() => {
        if (scrollRef.current && images.length > 0 && !isLoading) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight / 3
        }
    }, [isLoading, images.length])

    if (isLoading && images.length === 0) {
        return (
            <ScrollContainer>
                <MasonryGrid>
                    {[0, 1, 2].map(i => (
                        <Column key={`sk-col-${i}`}>
                            {[1.2, 0.8, 1.5, 0.9].map((r, j) => (
                                <ImageWrapper key={`sk-item-${j}`} $ratio={r}>
                                    <SkeletonBox $ratio={r} />
                                </ImageWrapper>
                            ))}
                        </Column>
                    ))}
                </MasonryGrid>
            </ScrollContainer>
        )
    }

    if (!isLoading && images.length === 0) {
        return <EmptyState />
    }

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