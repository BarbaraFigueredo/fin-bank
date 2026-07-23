import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-cloud">
      <div className="mx-auto min-h-svh w-full max-w-md bg-cloud pb-24">{children}</div>
      <BottomNav />
    </div>
  )
}
