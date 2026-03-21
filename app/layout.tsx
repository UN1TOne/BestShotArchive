import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { StyledComponentsRegistry } from '@/lib/styled-registry'
import './globals.css'
import Script from 'next/script'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'UNIT의 인생샷',
  description: 'UNIT의 인생샷',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="lenis">
      <body className="font-sans antialiased">
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
        <Analytics />
        {/* <Script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js" strategy="beforeInteractive" />
        <Script id="vconsole-init" strategy="afterInteractive">
          {`if (typeof window !== 'undefined') { new window.VConsole(); }`}
        </Script> */}
      </body>
    </html>
  )
}
