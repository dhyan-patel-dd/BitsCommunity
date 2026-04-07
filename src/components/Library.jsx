import { useState, useMemo } from 'react'
import { Search, Clock, AlertTriangle, ArrowRight, Zap, X } from 'lucide-react'
import { investigations, investigationCategories, categoryColors, categoryIcons } from '../data/investigations.js'

export default function Library({ navigate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    let results = investigations
    if (activeCategory !== 'All') {
      results = results.filter(inv => inv.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(inv =>
        inv.title.toLowerCase().includes(q) ||
        inv.summary.toLowerCase().includes(q) ||
        inv.tags.some(t => t.toLowerCase().includes(q)) ||
        inv.services.some(s => s.toLowerCase().includes(q))
      )
    }
    return results
  }, [searchQuery, activeCategory])

  const clearFilters = () => {
    setSearchQuery('')
    setActiveCategory('All')
  }

  const hasFilters = searchQuery.trim() || activeCategory !== 'All'

  return (
    <main className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-14 px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 65% 70% at 50% -5%, rgba(139,0,255,0.35) 0%, rgba(119,74,164,0.2) 30%, transparent 60%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-medium text-[#A0A0B8] mb-6 backdrop-blur-sm">
            <Zap size={12} className="text-[#F59E0B]" />
            Investigation Library
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.08] mb-4">
            See How Bits{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #9B6DC5 0%, #C084FC 50%, #E879F9 100%)' }}
            >
              Solves Problems
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#A0A0B8] mb-8 max-w-xl mx-auto leading-relaxed">
            Real investigations. Real incidents. See exactly how Bits AI SRE investigates
            complex problems and surfaces root causes.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── Search + Filters ────────────────────────────── */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65637A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search investigations..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#18162A] border border-white/[0.1] text-white placeholder-[#65637A] text-sm outline-none focus:border-[#774AA4]/60 focus:shadow-[0_0_0_3px_rgba(139,0,255,0.12)] transition-all"
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <CategoryTab
              active={activeCategory === 'All'}
              onClick={() => setActiveCategory('All')}
              count={investigations.length}
            >
              All
            </CategoryTab>
            {investigationCategories.map(cat => {
              const count = investigations.filter(i => i.category === cat).length
              return (
                <CategoryTab
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  count={count}
                  icon={categoryIcons[cat]}
                >
                  {cat}
                </CategoryTab>
              )
            })}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 flex items-center gap-1 text-xs text-[#A0A0B8] hover:text-white transition-colors"
              >
                <X size={12} />
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#65637A] text-sm">No investigations match your search.</p>
            <button onClick={clearFilters} className="mt-3 text-xs text-[#9B6DC5] hover:text-white transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(inv => (
              <InvestigationCard key={inv.id} investigation={inv} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function CategoryTab({ active, onClick, children, count, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-[#774AA4]/25 text-white border border-[#774AA4]/50'
          : 'bg-[#18162A] text-[#A0A0B8] border border-white/[0.07] hover:border-white/[0.15] hover:text-white'
      }`}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      {children}
      <span className={`text-[10px] ${active ? 'text-[#9B6DC5]' : 'text-[#65637A]'}`}>{count}</span>
    </button>
  )
}

function InvestigationCard({ investigation: inv, navigate }) {
  const colors = categoryColors[inv.category] || categoryColors['Incident Response']

  return (
    <button
      onClick={() => navigate({ page: 'investigation', investigationId: inv.id })}
      className="group w-full h-full text-left rounded-xl border border-white/[0.07] bg-[#18162A] hover:border-[#774AA4]/40 hover:bg-[#1F1C33] transition-all duration-200 shadow-card hover:shadow-cardHover hover:-translate-y-0.5 overflow-hidden flex flex-col"
    >
      {/* Top accent bar — always at the very top */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#774AA4] via-[#A855F7] to-[#E879F9] opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />

      <div className="p-5 flex flex-col flex-1">
        {/* Category */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
            {categoryIcons[inv.category]} {inv.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white text-[15px] leading-snug mb-2 group-hover:text-white transition-colors">
          {inv.title}
        </h3>

        {/* Summary */}
        <p className="text-[#A0A0B8] text-sm leading-relaxed line-clamp-3 mb-4">
          {inv.summary}
        </p>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {inv.services.map(s => (
            <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono text-[#A0A0B8] bg-white/[0.04] border border-white/[0.06]">
              {s}
            </span>
          ))}
        </div>

        {/* Footer: metadata + CTA — pushed to bottom */}
        <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-[11px] text-[#65637A]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {inv.timeToResolution}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle size={11} />
              {inv.monitorType}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-[#9B6DC5] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Read more <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </button>
  )
}
