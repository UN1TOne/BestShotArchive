'use client'

import { useState } from 'react'
import styled from 'styled-components'
import { X, Loader2 } from 'lucide-react'
import { useArchiveStore } from '@/lib/store'
import { supabase } from '@/lib/supabase' // 이전에 만든 supabase 클라이언트

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.$isOpen ? 'auto' : 'none')};
  transition: opacity 0.3s ease;
  transform: translateZ(0);
`

const ModalBox = styled.div`
  position: relative;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`

const Title = styled.h2`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Input = styled.input`
  background: rgba(10, 10, 20, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.875rem 1rem;
  color: white;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #ffd700;
  }
`

const SubmitButton = styled.button`
  background: #ffd700;
  color: #0a0a14;
  border: none;
  border-radius: 10px;
  padding: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: white;
  }
`

export function LoginModal() {
    const { isLoginModalOpen, setLoginModalOpen, setSession } = useArchiveStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert('로그인 실패: 이메일이나 비밀번호를 확인해주세요.')
        } else {
            setSession(data.session)
            setLoginModalOpen(false)
            setEmail('')
            setPassword('')
        }
        setLoading(false)
    }

    return (
        <Overlay $isOpen={isLoginModalOpen} onClick={() => setLoginModalOpen(false)}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={() => setLoginModalOpen(false)}>
                    <X size={20} />
                </CloseButton>
                <Title>Admin Login</Title>
                <Form onSubmit={handleLogin}>
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <SubmitButton type="submit" disabled={loading}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
                    </SubmitButton>
                </Form>
            </ModalBox>
        </Overlay>
    )
}