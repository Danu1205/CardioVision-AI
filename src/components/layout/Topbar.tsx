import { Search, Bell, CalendarDays, LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'CV'

  return (
    <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div>
        <p className="text-[11px] font-medium text-slate-400">
          CARDIOVISION AI / WORKSPACE
        </p>
        <h2 className="mt-1 text-sm font-bold text-slate-800 sm:text-base">
          Medical Imaging Workspace
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>

        <button
          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <button
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
        </button>

        <div className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
            {initials}
          </div>

          <div className="hidden text-left sm:block">
            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">
              {user?.email || 'User'}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {user?.role || 'Workspace member'}
            </p>
          </div>

          <ChevronDown size={14} className="hidden text-slate-400 sm:block" />

          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="ml-1 rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  )
}
