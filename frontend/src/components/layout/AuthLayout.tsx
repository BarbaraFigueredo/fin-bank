import type { ReactNode } from 'react'
import { Logo } from '../ui/Logo'

const FEATURES = [
  'Transferências Pix instantâneas',
  'Extrato completo, com busca por nome',
  'Contas para pessoa física e para empresa',
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="flex items-center justify-center bg-gradient-to-br from-ink to-ink-soft px-6 py-8 md:hidden">
        <Logo tone="onDark" />
      </div>

      <div className="hidden bg-gradient-to-br from-ink to-ink-soft px-12 py-12 md:flex md:w-1/2 md:flex-col md:justify-between lg:w-[45%]">
        <Logo size="lg" tone="onDark" />

        <div>
          <h2 className="text-3xl font-semibold leading-tight text-paper lg:text-4xl">
            Sua conta digital,
            <br />
            do jeito que devia ser.
          </h2>
          <ul className="mt-8 flex flex-col gap-4 text-paper/80">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-paper/40">© {new Date().getFullYear()} Fin Bank</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-cloud px-4 py-10 md:bg-paper md:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
