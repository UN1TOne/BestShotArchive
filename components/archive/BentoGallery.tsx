'use client'

import React, { useRef, useEffect, useState, useMemo, memo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { useShallow } from 'zustand/react/shallow'
import { EmptyState } from './EmptyState'

const pulse = keyframes`
  0% { background: rgba(255,255,255,0.03); }
  50% { background: rgba(255,255,255,0.08); }
  100% { background: rgba(255,255,255,0.03); }
`;

const ScrollContainer = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  z-index: 10;
  padding: 0 2rem;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
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
  @media (max-width: 768px) { gap: 0.5rem; }
`

const ImageWrapper = styled.div<{ $ratio: number }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${props => props.$ratio || '3/4'};
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  
  &:active { transform: scale(0.98); }
`

const SkeletonInner = styled.div`
  width: 100%;
  height: 100%;
  animation: ${pulse} 1.5s infinite;
`

const StyledImage = styled.img<{ $loaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.$loaded ? 1 : 0};
  transition: opacity 0.4s ease;
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
                loading="lazy"
            />
            {!isLoaded && <SkeletonInner />}
        </ImageWrapper>
    );
});

export function BentoGallery({ isVisible }: { isVisible: boolean }) {
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
        if (!scrollRef.current || !isVisible) return
        const el = scrollRef.current
        const setHeight = el.scrollHeight / 3
        if (el.scrollTop >= setHeight * 2) el.scrollTop -= setHeight
        else if (el.scrollTop <= 0) el.scrollTop += setHeight
    }

    useEffect(() => {
        if (scrollRef.current && images.length > 0) {
            const el = scrollRef.current;
            if (el.scrollTop === 0) {
                el.scrollTop = el.scrollHeight / 3;
            }
        }
    }, [images.length, isVisible])

    if (images.length === 0 && isVisible) return <EmptyState />

    return (
        <ScrollContainer ref={scrollRef} onScroll={handleScroll} $isVisible={isVisible}>
            <MasonryGrid>
                {columns.map((col, colIdx) => (
                    <Column key={`col-${colIdx}`}>
                        {col.map((img, imgIdx) => (
                            <ImageItem
                                key={`${colIdx}-${imgIdx}-${img.id}`}
                                img={img}
                                onClick={(id) => {
                                    setSelectedImage(id);
                                }}
                            />
                        ))}
                    </Column>
                ))}
            </MasonryGrid>
        </ScrollContainer>
    )
}