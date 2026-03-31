import { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react'
import { templates, contentTypes, monitorTypes, useCases } from '../data/templates.js'
import ContentCard from './ContentCard.jsx'

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'most-used', label: 'Most Used' },
  { value: 'most-starred', label: 'Most Starred' },
]

export default function Browse({ navigate, initialQuery = '', initialContentType = null, initialVerified = false, initialTrending = false }) {
  const [query, setQuery] = useState(initialQuery)
  const [selectedTypes, setSelectedTypes] = useState(initialContentType ? [initialContentType] : [])
  const [selectedMonitorTypes, setSelectedMonitorTypes] = useState([])
  const [selectedUseCases, setSelectedUseCases] = useState([])
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified)
  const [sortBy, setSortBy] = useState(initialTrending ? 'trending' : 'trending')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sync initial props when they change (navigating back, etc.)
  useEffect(() => {
    setQuery(initialQuery || '')
    setSelectedTypes(initialContentType ? [initialContentType] : [])
    setVerifiedOnly(initialVerified)
  }, [initialQuery, initialContentType, initialVerified])

  const filtered = useMemo(() => {
    let result = [...templates]

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.contentType.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q)
      )
    }

    // Content type filter
    if (selectedTypes.length > 0) {
      result = result.filter(t => selectedTypes.includes(t.contentType))
    }

    // Monitor type filter
    if (selectedMonitorTypes.length > 0) {
      result = result.filter(t =>
        t.monitorTypes.some(mt => selectedMonitorTypes.includes(mt))
      )
    }

    // Use case filter
    if (selectedUseCases.length > 0) {
      result = result.filter(t =>
        t.useCases.some(uc => selectedUseCases.includes(uc))
      )
    }

    // Verified only
    if (verifiedOnly) {
      result = result.filter(t => t.verified)
    }

    // Sort
    if (sortBy === 'trending') {
      result.sort((a, b) => {
        if (a.trending && !b.trending) return -1
        if (!a.trending && b.trending) return 1
        return b.usageCount - a.usageCount
      })
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'most-used') {
      result.sort((a, b) => b.usageCount - a.usageCount)
    } else if (sortBy === 'most-starred') {
      result.sort((a, b) => b.stars - a.stars)
    }

    return result
  }, [query, selectedTypes, selectedMonitorTypes, selectedUseCases, verifiedOnly, sortBy])

  const toggleItem = (arr, setArr, item) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  const activeFilterCount =
    selectedTypes.length +
    selectedMonitorTypes.length +
    selectedUseCases.length +
    (verifiedOnly ? 1 : 0)

  const clearAll = () => {
    setSelectedTypes([])
    setSelectedMonitorTypes([])
    setSelectedUseCases([])
    setVerifiedOnly(false)
    setQuery('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Browse Templates</h1>
        <p className="text-[#65637A] text-sm">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
          {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
        </p>
      </div>

      {/* Search + sort bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65637A]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search templates, tags, authors…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#18162A] border border-white/[0.08] text-white placeholder-[#65637A] text-sm outline-none focus:border-[#774AA4]/50 focus:shadow-[0_0_0_3px_rgba(139,0,255,0.12)] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6585] hover:text-[#9B95B5]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg bg-[#18162A] border border-white/[0.08] text-white text-sm outline-none focus:border-[#774AA4]/50 cursor-pointer"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6585] pointer-events-none" />
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#18162A] border border-white/[0.08] text-[#A0A0B8] text-sm hover:text-white transition-all"
        >
          <Filter size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#7646DB] text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar filters ──────────────────────────── */}
        <aside className={`
          flex-shrink-0 w-56 space-y-5
          ${sidebarOpen ? 'block' : 'hidden'}
          lg:block
        `}>
          {/* Active filters header */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#A0A0B8] uppercase tracking-[0.08em]">
                {activeFilterCount} active
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-[#9B6DC5] hover:text-white font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Content Type */}
          <FilterSection title="Content Type">
            {contentTypes.map(type => (
              <FilterCheckbox
                key={type}
                label={type}
                checked={selectedTypes.includes(type)}
                onChange={() => toggleItem(selectedTypes, setSelectedTypes, type)}
                count={templates.filter(t => t.contentType === type).length}
              />
            ))}
          </FilterSection>

          {/* Monitor Type */}
          <FilterSection title="Monitor Type">
            {monitorTypes.map(mt => (
              <FilterCheckbox
                key={mt}
                label={mt}
                checked={selectedMonitorTypes.includes(mt)}
                onChange={() => toggleItem(selectedMonitorTypes, setSelectedMonitorTypes, mt)}
                count={templates.filter(t => t.monitorTypes.includes(mt)).length}
              />
            ))}
          </FilterSection>

          {/* Use Case */}
          <FilterSection title="Use Case">
            {useCases.map(uc => (
              <FilterCheckbox
                key={uc}
                label={uc}
                checked={selectedUseCases.includes(uc)}
                onChange={() => toggleItem(selectedUseCases, setSelectedUseCases, uc)}
                count={templates.filter(t => t.useCases.includes(uc)).length}
              />
            ))}
          </FilterSection>

          {/* Verified toggle */}
          <div className="pt-2 border-t border-white/[0.05]">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs text-[#A0A0B8] group-hover:text-white transition-colors">
                Datadog Verified only
              </span>
              <div
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`relative w-9 h-5 rounded-full transition-all cursor-pointer ${
                  verifiedOnly ? 'bg-[#774AA4]' : 'bg-[#2A2440]'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  verifiedOnly ? 'left-4' : 'left-0.5'
                }`} />
              </div>
            </label>
          </div>
        </aside>

        {/* ── Results grid ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#18162A] border border-white/[0.07] flex items-center justify-center text-2xl mb-4">🔍</div>
              <h3 className="text-white font-semibold mb-1">No templates found</h3>
              <p className="text-[#A0A0B8] text-sm mb-4">
                Try adjusting your search or clearing some filters
              </p>
              <button
                onClick={clearAll}
                className="px-4 py-2 rounded-lg bg-[#774AA4] text-white text-sm font-medium hover:bg-[#8B5ABE] transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(t => (
                <ContentCard key={t.id} template={t} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-b border-white/[0.05] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-2.5 group"
      >
        <span className="text-[11px] font-semibold text-[#65637A] uppercase tracking-[0.08em] group-hover:text-white transition-colors">
          {title}
        </span>
        <ChevronDown
          size={13}
          className={`text-[#65637A] transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <div className="space-y-1.5">
          {children}
        </div>
      )}
    </div>
  )
}

function FilterCheckbox({ label, checked, onChange, count }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer group">
      <div className="flex items-center gap-2">
        <div
          onClick={onChange}
          className={`w-3.5 h-3.5 rounded flex-shrink-0 border transition-all ${
            checked
              ? 'bg-[#774AA4] border-[#774AA4]'
              : 'bg-transparent border-[#2A2440] group-hover:border-[#774AA4]/60'
          }`}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="w-full h-full text-white">
              <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span
          onClick={onChange}
          className={`text-xs transition-colors ${
            checked ? 'text-white' : 'text-[#A0A0B8] group-hover:text-white'
          }`}
        >
          {label}
        </span>
      </div>
      <span className="text-[10px] text-[#65637A]">{count}</span>
    </label>
  )
}
