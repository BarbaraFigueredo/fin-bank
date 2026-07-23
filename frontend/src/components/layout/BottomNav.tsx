import { NavLink } from 'react-router-dom'
import { HomeIcon, ListIcon, LogoutIcon, PixIcon } from '../ui/icons'
import { useAuth } from '../../context/AuthContext'

const linkBase = 'flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors'

export function BottomNav() {
  const { logout } = useAuth()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${linkBase} ${isActive ? 'text-gold-deep' : 'text-ink-soft/60'}`}
        >
          <HomeIcon width={20} height={20} />
          Início
        </NavLink>

        <NavLink
          to="/extrato"
          className={({ isActive }) => `${linkBase} ${isActive ? 'text-gold-deep' : 'text-ink-soft/60'}`}
        >
          <ListIcon width={20} height={20} />
          Extrato
        </NavLink>

        <NavLink to="/pix" className="-mt-6 flex flex-col items-center gap-1 text-[11px] font-medium text-ink-soft/60">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-paper bg-ink text-gold shadow-lg shadow-ink/30">
            <PixIcon width={22} height={22} />
          </span>
          Pix
        </NavLink>

        <button
          type="button"
          onClick={() => logout()}
          className={`${linkBase} text-ink-soft/60`}
        >
          <LogoutIcon width={20} height={20} />
          Sair
        </button>
      </div>
    </nav>
  )
}
