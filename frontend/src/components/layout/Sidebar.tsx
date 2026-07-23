import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../ui/Logo'
import { HomeIcon, ListIcon, LogoutIcon, PixIcon } from '../ui/icons'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/extrato', label: 'Extrato', icon: ListIcon, end: false },
  { to: '/pix', label: 'Pix', icon: PixIcon, end: false },
]

export function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="hidden shrink-0 flex-col justify-between border-r border-ink-soft/20 bg-ink px-5 py-6 md:fixed md:inset-y-0 md:left-0 md:flex md:w-64">
      <div>
        <div className="px-2 pb-8">
          <Logo tone="onDark" />
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-paper/10 text-gold'
                    : 'text-paper/70 hover:bg-paper/5 hover:text-paper'
                }`
              }
            >
              <Icon width={19} height={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => logout()}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-paper/60 transition-colors hover:bg-paper/5 hover:text-paper"
      >
        <LogoutIcon width={19} height={19} />
        Sair
      </button>
    </aside>
  )
}
