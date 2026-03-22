'use client'

import React, { useRef, useEffect, useState, useMemo, memo } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { useShallow } from 'zustand/react/shallow'
import { EmptyState } from './EmptyState'

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
  pointer-events: auto; 
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
  pointer-events: auto;
  transform: translateZ(0);
  contain: paint;
  transition: transform 0.2s ease-out;

  &:active { transform: scale(0.97); }
`

const SkeletonInner = styled.div`
  width: 100%;
  height: 100%;
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

const StyledImage = styled.img<{ $isLoaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${props => props.$isLoaded ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
  pointer-events: none;
`

const ImageItem = memo(({ img, onClick }: { img: any, onClick: (id: string) => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ratio = useMemo(() => img.width / img.height || 0.75, [img.width, img.height]);

    useEffect(() => {
        let isCancelled = false;
        const handle = (window as any).requestIdleCallback(() => {
            const i = new Image();
            i.src = img.url;
            i.decode().then(() => { if (!isCancelled) setIsLoaded(true); });
        });
        return () => { isCancelled = true; (window as any).cancelIdleCallback(handle); };
    }, [img.url]);

    return (
        <ImageWrapper $ratio={ratio} onClick={() => onClick(img.id)}>
            <StyledImage src={img.url} $isLoaded={isLoaded} alt="" />
            {!isLoaded && <SkeletonInner />}
        </ImageWrapper>
    );
});

export function BentoGallery({ isPageReady }: { isPageReady: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { images, setSelectedImage } = useArchiveStore(useShallow(state => ({
        images: state.images,
        setSelectedImage: state.setSelectedImage
    })))

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
        if (scrollRef.current && images.length > 0) {
            const el = scrollRef.current;
            el.scrollTop = el.scrollHeight / 3;
        }
    }, [images.length])

    if (images.length === 0 && isPageReady) return <EmptyState />

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