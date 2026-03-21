'use client'

// Dynamic import for Archive with SSR disabled
import dynamic from 'next/dynamic'

const Archive = dynamic(
  () => import('@/components/archive/Archive').then((mod) => mod.Archive),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Loading Archive
          </p>
        </div>
      </div>
    ),
  }
)

export default function Page() {
  return <Archive />
}
