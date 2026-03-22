'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useArchiveStore } from '@/lib/store'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MasonryGrid = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    padding: 0 1rem;
  }
`;

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  contain: layout style; 

  @media (max-width: 768px) { gap: 0.5rem; }
`;

const ImageWrapper = styled.div<{ $ratio: number }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${props => props.$ratio};
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a2e;
  cursor: pointer;
  transform: translateZ(0);
  will-change: transform, opacity;
  contain: paint;

  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  &:hover { transform: scale(1.02); }
`;

const StyledImage = styled.img<{ $isLoaded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: ${props => props.$isLoaded ? 1 : 0};
  transition: opacity 0.4s ease-in-out;
`;

const ImageItem = ({ img, onClick }: { img: any, onClick: () => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ratio = img.width / img.height || 0.75;

    useEffect(() => {
        const i = new Image();
        i.src = img.url;
        i.decode()
            .then(() => setIsLoaded(true))
            .catch(() => setIsLoaded(true));
    }, [img.url]);

    return (
        <ImageWrapper $ratio={ratio} onClick={onClick}>
            <StyledImage
                src={img.url}
                $isLoaded={isLoaded}
                alt=""
                loading="lazy"
            />
        </ImageWrapper>
    );
};

export function BentoGallery({ isLoading }: { isLoading: boolean }) {
    const { images, setSelectedImage } = useArchiveStore();

    const columns = useMemo(() => {
        if (isLoading || !images.length) return [[], [], []];

        const tripledImages = [...images, ...images, ...images];
        const colCount = typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 3;
        const result: any[][] = Array.from({ length: colCount }, () => []);

        tripledImages.forEach((img, i) => {
            result[i % colCount].push(img);
        });
        return result;
    }, [images, isLoading]);

    return (
        <MasonryGrid>
            {columns.map((col, colIdx) => (
                <Column key={`col-${colIdx}`}>
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <ImageWrapper key={i} $ratio={0.6 + Math.random() * 0.8} />
                        ))
                    ) : (
                        col.map((img, imgIdx) => (
                            <ImageItem
                                key={`${colIdx}-${imgIdx}-${img.id}`}
                                img={img}
                                onClick={() => setSelectedImage(img.id)}
                            />
                        ))
                    )}
                </Column>
            ))}
        </MasonryGrid>
    );
}