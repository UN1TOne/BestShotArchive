'use client'

import styled from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { LogIn, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 20, 0.9) 0%,
    rgba(10, 10, 20, 0) 100%
  );
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
  color: #0a0a14;
`

const LogoText = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: white;
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2.5rem;

  @media (max-width: 768px) {
    display: none;
  }
`

const NavLink = styled.a`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  letter-spacing: 0.02em;
  transition: color 0.3s ease;
  cursor: pointer;

  &:hover {
    color: white;
  }
`

const ImageCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
`

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background: #ffd700;
  color: #0a0a14;
  font-weight: 600;
  font-size: 0.75rem;
  border-radius: 50px;
`
const AuthButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
  }
`

export function Header() {
  const { images, session, setLoginModalOpen, setSession } = useArchiveStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <HeaderContainer>
      <Logo>
        <LogoIcon>📷</LogoIcon>
        <LogoText>UNIT의 인생샷</LogoText>
      </Logo>

      <Nav>
        <NavLink>Gallery</NavLink>
        <NavLink>Collections</NavLink>
        <ImageCount>
          <span>Images</span>
          <CountBadge>{images.length}</CountBadge>
        </ImageCount>

        {session ? (
          <AuthButton onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </AuthButton>
        ) : (
          <AuthButton onClick={() => setLoginModalOpen(true)}>
            <LogIn size={14} /> Admin Login
          </AuthButton>
        )}
      </Nav>
    </HeaderContainer>
  )
}
