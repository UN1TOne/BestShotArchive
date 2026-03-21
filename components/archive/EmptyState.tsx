'use client'

import styled, { keyframes } from 'styled-components'
import { ImagePlus, Sparkles } from 'lucide-react'

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(2deg);
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
`

const Container = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 2rem;
  text-align: center;
`

const IconContainer = styled.div`
  position: relative;
  margin-bottom: 2rem;
  animation: ${float} 6s ease-in-out infinite;
`

const MainIcon = styled.div`
  width: 120px;
  height: 120px;
  background: rgba(255, 215, 0, 0.1);
  border: 2px dashed rgba(255, 215, 0, 0.3);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd700;
`

const SparkleIcon = styled.div<{ $delay: number; $position: string }>`
  position: absolute;
  ${(props) => props.$position}
  color: #ffd700;
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;
`

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`

const Description = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.5);
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`

const Hint = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
`

const HintKey = styled.span`
  padding: 0.25rem 0.5rem;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.75rem;
`

export function EmptyState() {
  return (
    <Container>
      <IconContainer>
        <SparkleIcon $delay={0} $position="top: -10px; right: -20px;">
          <Sparkles size={20} />
        </SparkleIcon>
        <SparkleIcon $delay={0.5} $position="bottom: 0; left: -25px;">
          <Sparkles size={16} />
        </SparkleIcon>
        <SparkleIcon $delay={1} $position="top: 20px; left: -15px;">
          <Sparkles size={12} />
        </SparkleIcon>
        <MainIcon>
          <ImagePlus size={48} />
        </MainIcon>
      </IconContainer>

      <Title>Your Archive Awaits</Title>
      <Description>
        Drop your images into the void and watch them come to life in an
        immersive 3D space. Each photo finds its perfect place.
      </Description>

      <Hint>
        <span>Click the</span>
        <HintKey>+</HintKey>
        <span>button or drag & drop to begin</span>
      </Hint>
    </Container>
  )
}
