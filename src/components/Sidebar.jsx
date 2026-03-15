import { NavLink } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Eye,
  TrendingUp,
  ShoppingCartIcon,
  PlayCircle,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: Activity, label: 'Live Visitors' },
  { to: '/dashboard', icon: BarChart3, label: 'Analytics' },
  { to: '/sessions', icon: PlayCircle, label: 'Sessions' },
  { to: '/funnels', icon: TrendingUp, label: 'Funnel Economics' },
  { to: '/abandonment', icon: ShoppingCartIcon, label: 'Abandonment' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-bg-secondary flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary tracking-tight">
          KeraClear
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">Analytics</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-bg-tertiary text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
          <span className="text-xs text-text-secondary">Connected</span>
        </div>
      </div>
    </aside>
  )
}
