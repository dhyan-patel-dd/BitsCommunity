import { useState, useEffect } from 'react'
import { BookOpen, Search } from 'lucide-react'

export default function Navbar({ currentPage, navigate }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isHome = currentPage === 'home'
  const showBg = !isHome || scrolled

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        showBg
          ? 'border-b border-white/[0.07] bg-[#0A0812]/90 backdrop-blur-md shadow-navGlow'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => navigate({ page: 'home' })}
            className="flex items-center gap-2.5 group"
          >
            <img
              src="/logo.png"
              alt="Bits Library"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-white text-[15px] tracking-tight">
              Bits Library
            </span>
            <span className="hidden sm:inline text-[11px] font-medium text-[#65637A] uppercase tracking-widest ml-0.5">
              beta
            </span>
          </button>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink active={currentPage === 'home'} onClick={() => navigate({ page: 'home' })}>
              Home
            </NavLink>
            <NavLink active={currentPage === 'browse'} onClick={() => navigate({ page: 'browse' })}>
              Browse
            </NavLink>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ page: 'browse' })}
              className="p-2 rounded-lg text-[#A0A0B8] hover:text-white hover:bg-white/[0.06] transition-all"
              title="Search"
            >
              <Search size={17} />
            </button>
            <a
              href="https://docs.datadoghq.com/bits_ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#A0A0B8] hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <BookOpen size={14} />
              Docs
            </a>
            <button
              onClick={() => navigate({ page: 'submit' })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#774AA4] text-white hover:bg-[#8B5ABE] transition-all shadow-[0_0_14px_rgba(139,0,255,0.35)] hover:shadow-[0_0_20px_rgba(139,0,255,0.5)]"
            >
              Submit Template
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'text-white bg-white/[0.08]'
          : 'text-[#A0A0B8] hover:text-white hover:bg-white/[0.05]'
      }`}
    >
      {children}
    </button>
  )
}
