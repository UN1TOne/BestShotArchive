'use client'

import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useArchiveStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

const UploadContainer = styled.div<{ $isDragging: boolean; $isOpen: boolean }>`
  position: fixed;
  bottom: 0; 
  right: 0;
  left: 0;   
  height: 50vh;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 2rem;
  gap: 1rem;

  pointer-events: none;
`

const UploadButton = styled.button<{ $isOpen: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(20, 20, 30, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  pointer-events: auto;

  &:hover {
    transform: scale(1.1);
    background: rgba(30, 30, 45, 0.9);
    border-color: rgba(255, 215, 0, 0.3);
  }

  svg {
    transition: transform 0.3s ease;
    transform: rotate(${(props) => (props.$isOpen ? '45deg' : '0deg')});
  }
`

const DropZone = styled.div<{ $isDragging: boolean; $isVisible: boolean }>`
  background: rgba(20, 20, 30, 0.9);
  backdrop-filter: blur(30px);
  border: 2px dashed
    ${(props) =>
    props.$isDragging ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.15)'};
  border-radius: 20px;
  padding: 2.5rem;
  min-width: 300px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  transform: ${(props) =>
    props.$isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'};
  pointer-events: ${(props) => (props.$isVisible ? 'auto' : 'none')};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  pointer-events: ${(props) => (props.$isVisible ? 'auto' : 'none')};
  
  ${(props) =>
    props.$isDragging &&
    `
    background: rgba(30, 30, 50, 0.95);
    transform: scale(1.02);
  `}
`

const DropZoneTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  color: white;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
`

const DropZoneText = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1.5rem;
`

const FileInput = styled.input`
  display: none;
`

const BrowseButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 50px;
  color: #ffd700;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
  }
`

const UploadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { addImage, isUploading, setIsUploading } = useArchiveStore()

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setIsUploading(true)

    try {
      // 1. 로그인 상태 확인 (인증이 안 되어 있으면 업로드 중단)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("로그인이 필요합니다.")
        setIsUploading(false)
        return
      }

      // 2. 이미지 가로/세로 사이즈 추출을 위한 임시 로딩
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      await new Promise((resolve) => {
        img.onload = resolve
        img.src = objectUrl
      })

      const aspectRatio = img.width / img.height
      URL.revokeObjectURL(objectUrl)

      // 3. Supabase Storage에 실제 파일 업로드
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `public/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('archive-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 4. 업로드된 파일의 Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('archive-images')
        .getPublicUrl(filePath)

      // 5. 3D 배치를 위한 랜덤 초기 좌표 생성 (DB에 저장하기 위함)
      const randomPos = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 6,
        z: (Math.random() * -3)
      }

      // 6. Supabase Database (images 테이블)에 데이터 INSERT
      const newImageData = {
        user_id: session.user.id,
        url: publicUrl,
        aspect_ratio: aspectRatio,
        width: img.width,
        height: img.height,
        title: file.name.replace(/\.[^/.]+$/, ''),
        position_x: randomPos.x,
        position_y: randomPos.y,
        position_z: randomPos.z,
      }

      const { data: dbData, error: dbError } = await supabase
        .from('images')
        .insert(newImageData)
        .select() // 방금 넣은 데이터를 다시 받아옴 (DB에서 생성된 uuid 확보)
        .single()

      if (dbError) throw dbError

      // 7. Zustand 스토어 업데이트 (UI 반영)
      addImage({
        id: dbData.id,
        url: dbData.url,
        aspectRatio: dbData.aspect_ratio,
        width: dbData.width,
        height: dbData.height,
        title: dbData.title,
        position: { x: dbData.position_x, y: dbData.position_y, z: dbData.position_z }
      })

      setIsOpen(false)
    } catch (error) {
      console.error('업로드 실패:', error)
      alert("이미지 업로드 중 오류가 발생했습니다.")
    } finally {
      setIsUploading(false)
    }
  }, [addImage, setIsUploading])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setIsOpen(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      files.forEach(processFile)
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      files.forEach(processFile)
    },
    [processFile]
  )

  return (
    <>
      <UploadContainer $isDragging={isDragging} $isOpen={isOpen}>
        <DropZone
          $isDragging={isDragging}
          $isVisible={isOpen}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ImageIcon
            size={40}
            style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#ffd700' }}
          />
          <DropZoneTitle>Drop your images here</DropZoneTitle>
          <DropZoneText>or click to browse</DropZoneText>
          <BrowseButton htmlFor="file-upload">
            <Upload size={16} />
            Browse Files
          </BrowseButton>
          <FileInput
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </DropZone>

        <UploadButton $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Upload size={24} />}
        </UploadButton>
      </UploadContainer>

      {isUploading && (
        <UploadingOverlay>
          <LoadingSpinner />
        </UploadingOverlay>
      )}
    </>
  )
}
