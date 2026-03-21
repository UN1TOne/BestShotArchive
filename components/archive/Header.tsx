'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useArchiveStore } from '@/lib/store'
import { LogIn, LogOut, Menu as MenuIcon, X, Image as ImageIcon, LayoutGrid, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1.25rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 20, 0.95) 0%,
    rgba(10, 10, 20, 0) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  z-index: 1100;
  white-space: nowrap; /* 로고 글자 줄바꿈 방지 */
`

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
`

const LogoText = styled.span`
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;
`

/* [수정] 데스크탑 네비게이션: 모바일(768px) 이하에서 !important로 확실히 제거 */
const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 768px) {
    display: none !important; 
  }
`

const NavLink = styled.a`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  cursor: pointer;
  &:hover { color: #ffd700; }
`

const ImageCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
`

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.4rem;
  background: #ffd700;
  color: #0a0a14;
  font-weight: 700;
  font-size: 0.7rem;
  border-radius: 50px;
`

const AuthButton = styled.button<{ $isMobile?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: ${(props) => (props.$isMobile ? '#ffd700' : 'transparent')};
  border: 1px solid ${(props) => (props.$isMobile ? '#ffd700' : 'rgba(255, 255, 255, 0.2)')};
  border-radius: 50px;
  color: ${(props) => (props.$isMobile ? '#0a0a14' : 'rgba(255, 255, 255, 0.8)')};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
`

/* [수정] 햄버거 버튼: 데스크탑(769px) 이상에서는 확실히 제거 */
const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  z-index: 1100;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    
    height: 100vh;
    height: 100dvh; 
    overflow-y: auto; 
    
    background: rgba(10, 10, 20, 0.98);
    z-index: 1050;
    flex-direction: column;
    padding: 7rem 2rem 3rem; 
    gap: 2.5rem;
    
    opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
    visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
    transform: ${({ $isOpen }) => ($isOpen ? 'translateY(0)' : 'translateY(-20px)')};
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

const MobileMenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  svg { color: #ffd700; }
`

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { images, session, setLoginModalOpen, setSession } = useArchiveStore()

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
  }, [isMenuOpen])

  // 화면 크기가 커지면 메뉴 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsMenuOpen(false)
  }

  return (
    <HeaderContainer>
      <Logo onClick={() => window.location.reload()}>
        <LogoIcon>📷</LogoIcon>
        <LogoText>UNIT의 인생샷</LogoText>
      </Logo>

      <DesktopNav>
        <NavLink>Gallery</NavLink>
        <NavLink>Collections</NavLink>
        <ImageCount>
          <span>Images</span>
          <CountBadge>{images.length}</CountBadge>
        </ImageCount>
        {session ? (
          <AuthButton onClick={handleLogout}><LogOut size={14} /> Logout</AuthButton>
        ) : (
          <AuthButton onClick={() => setLoginModalOpen(true)}><LogIn size={14} /> Admin Login</AuthButton>
        )}
      </DesktopNav>

      <HamburgerButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
      </HamburgerButton>

      <MobileOverlay $isOpen={isMenuOpen}>
        <MobileMenuItem onClick={() => setIsMenuOpen(false)}><LayoutGrid size={24} /> Gallery</MobileMenuItem>
        <MobileMenuItem onClick={() => setIsMenuOpen(false)}><Layers size={24} /> Collections</MobileMenuItem>
        <MobileMenuItem>
          <ImageIcon size={24} />
          <span>Total Archives</span>
          <CountBadge style={{ fontSize: '1rem', height: '28px', minWidth: '28px' }}>{images.length}</CountBadge>
        </MobileMenuItem>

        <div style={{ marginTop: 'auto', paddingBottom: '2rem' }}>
          {session ? (
            <AuthButton $isMobile onClick={handleLogout} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              <LogOut size={18} /> Logout
            </AuthButton>
          ) : (
            <AuthButton $isMobile onClick={() => { setLoginModalOpen(true); setIsMenuOpen(false); }} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              <LogIn size={18} /> Admin Login
            </AuthButton>
          )}
        </div>
      </MobileOverlay>
    </HeaderContainer>
  )
}