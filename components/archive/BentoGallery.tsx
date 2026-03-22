// BentoGallery.tsx
'use client'

import React, { useRef, useEffect, useState, useMemo, memo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { useShallow } from 'zustand/react/shallow'
import { EmptyState } from './EmptyState'

const pulse = keyframes`
  0% { background: rgba(255, 255, 255, 0.03); }
  50% { background: rgba(255, 255, 255, 0.08); }
  100% { background: rgba(255, 255, 255, 0.03); }
`;

const ScrollContainer = styled.div<{ $ready: boolean }>`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  z-index: 10;
  padding: 0 2rem;
  opacity: ${props => props.$ready ? 1 : 0};
  visibility: ${props => props.$ready ? 'visible' : 'hidden'};
  transition: opacity 0.4s ease-in-out;
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
`

const SkeletonInner = styled.div`
  width: 100%;
  height: 100%;
  animation: ${pulse} 1.5s infinite ease-in-out;
`

const StyledImage = styled.img<{ $loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.$loaded ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
`

const ImageItem = memo(({ img, onClick }: { img: any, onClick: (id: string) => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ratio = useMemo(() => img.width / img.height || 0.75, [img.width, img.height]);

    return (
        <ImageWrapper $ratio={ratio} onClick={() => onClick(img.id)}>
            <StyledImage
                src={img.url}
                $loaded={isLoaded}
                onLoad={() => setIsLoaded(true)}
                decoding="async"
            />
            {!isLoaded && <SkeletonInner />}
        </ImageWrapper>
    );
});

export function BentoGallery() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isReady, setIsReady] = useState(false)
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

    useEffect(() => {
        if (scrollRef.current && images.length > 0) {
            const el = scrollRef.current;
            el.scrollTop = el.scrollHeight / 3;
            const timeout = setTimeout(() => setIsReady(true), 50);
            return () => clearTimeout(timeout);
        }
    }, [images.length]);

    const handleScroll = () => {
        if (!scrollRef.current || !isReady) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3
        if (el.scrollTop >= setHeight * 2) {
            el.scrollTop -= setHeight
        } else if (el.scrollTop <= 0) {
            el.scrollTop += setHeight
        }
    }

    if (images.length === 0 && isReady) return <EmptyState />

    return (
        <ScrollContainer ref={scrollRef} onScroll={handleScroll} $ready={isReady}>
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