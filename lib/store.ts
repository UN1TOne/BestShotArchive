import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'

export interface ImageData {
  id: string
  url: string
  aspectRatio: number
  width: number
  height: number
  position: {
    x: number
    y: number
    z: number
  }
  rotation: {
    x: number
    y: number
    z: number
  }
  scale: number
  title?: string
  isNew?: boolean
}

// DB 업로드 시 id와 position을 선택적으로 받을 수 있도록 타입 정의
export type NewImageData = Omit<ImageData, 'id' | 'position' | 'rotation' | 'scale'> & {
  id?: string
  position?: { x: number; y: number; z: number }
}

export interface ArchiveStore {
  images: ImageData[]
  hoveredImage: string | null
  selectedImage: string | null
  scrollVelocity: number
  isUploading: boolean

  // Supabase Auth 상태
  session: Session | null
  isLoginModalOpen: boolean

  // 액션
  addImage: (image: NewImageData) => void
  removeImage: (id: string) => void
  setHoveredImage: (id: string | null) => void
  setSelectedImage: (id: string | null) => void
  setScrollVelocity: (velocity: number) => void
  setIsUploading: (isUploading: boolean) => void
  markImageAsOld: (id: string) => void

  // Auth 액션
  setSession: (session: Session | null) => void
  setLoginModalOpen: (isOpen: boolean) => void
}

// Custom bin-packing-like algorithm for organic placement
const calculatePosition = (
  existingImages: ImageData[],
  aspectRatio: number,
  index: number
): { x: number; y: number; z: number } => {
  const gridCols = 4
  const spacingX = 3.5
  const spacingY = 3
  const baseZ = -2

  const col = index % gridCols
  const row = Math.floor(index / gridCols)

  // Base position with organic offsets
  const randomOffsetX = (Math.random() - 0.5) * 1.2
  const randomOffsetY = (Math.random() - 0.5) * 0.8
  const randomOffsetZ = Math.random() * 2 - 1

  // Create asymmetric wave pattern
  const waveOffset = Math.sin(index * 0.7) * 0.5

  return {
    x: (col - gridCols / 2 + 0.5) * spacingX + randomOffsetX + waveOffset,
    y: -row * spacingY + randomOffsetY + 3,
    z: baseZ + randomOffsetZ,
  }
}

const calculateRotation = (): { x: number; y: number; z: number } => {
  const maxRotation = 5 * (Math.PI / 180) // 5 degrees in radians
  return {
    x: (Math.random() - 0.5) * maxRotation * 0.5,
    y: (Math.random() - 0.5) * maxRotation * 0.5,
    z: (Math.random() - 0.5) * maxRotation,
  }
}

export const useArchiveStore = create<ArchiveStore>((set, get) => ({
  images: [],
  hoveredImage: null,
  selectedImage: null,
  scrollVelocity: 0,
  isUploading: false,

  // Auth 초기값
  session: null,
  isLoginModalOpen: false,

  addImage: (imageData) => {
    const { images } = get()

    // DB에서 넘어온 id가 있으면 그걸 쓰고, 없으면 로컬에서 생성
    const id = imageData.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // DB에서 넘어온 position이 있으면 그걸 쓰고, 없으면 기존 함수로 계산
    const position = imageData.position || calculatePosition(images, imageData.aspectRatio, images.length)

    const rotation = calculateRotation()
    const scale = 0.8 + Math.random() * 0.4 // Random scale between 0.8 and 1.2

    const newImage: ImageData = {
      ...imageData,
      id,
      position,
      rotation,
      scale,
      isNew: true,
    }

    console.log('[v0] Store addImage:', newImage.id, newImage.url)
    set({ images: [...images, newImage] })
  },

  removeImage: (id) => {
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    }))
  },

  setHoveredImage: (id) => set({ hoveredImage: id }),
  setSelectedImage: (id) => set({ selectedImage: id }),
  setScrollVelocity: (velocity) => set({ scrollVelocity: velocity }),
  setIsUploading: (isUploading) => set({ isUploading }),

  markImageAsOld: (id) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, isNew: false } : img
      ),
    }))
  },

  // Auth 함수 구현
  setSession: (session) => set({ session }),
  setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),
}))