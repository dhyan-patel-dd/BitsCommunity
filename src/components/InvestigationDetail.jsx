import { useMemo } from 'react'
import { ChevronRight, Clock, AlertTriangle, ArrowLeft, Tag } from 'lucide-react'
import { investigations, categoryColors, categoryIcons } from '../data/investigations.js'

export default function InvestigationDetail({ investigationId, navigate }) {
  const inv = investigations.find(i => i.id === investigationId)

  const related = useMemo(() => {
    if (!inv) return []
    return investigations
      .filter(i => i.id !== inv.id && i.category === inv.category)
      .slice(0, 2)
  }, [inv])

  if (!inv) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#65637A] text-sm mb-3">Investigation not found.</p>
          <button
            onClick={() => navigate({ page: 'library' })}
            className="text-xs text-[#9B6DC5] hover:text-white transition-colors"
          >
            Back to Library
          </button>
        </div>
      </main>
    )
  }

  const colors = categoryColors[inv.category] || categoryColors['Incident Response']

  return (
    <main className="min-h-screen">
      {/* ── Header area ──────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% -5%, rgba(139,0,255,0.25) 0%, transparent 55%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#65637A] mb-6">
            <button onClick={() => navigate({ page: 'library' })} className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={12} />
              Library
            </button>
            <ChevronRight size={11} />
            <span className="text-[#A0A0B8] truncate max-w-[300px]">{inv.title}</span>
          </nav>

          {/* Category */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
              {categoryIcons[inv.category]} {inv.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {inv.title}
          </h1>

          {/* Summary */}
          <p className="text-[#A0A0B8] text-base leading-relaxed mb-6 max-w-3xl">
            {inv.summary}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-[#65637A]">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              <span className="text-white font-medium">{inv.timeToResolution}</span> to resolution
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span className="text-white font-medium">{inv.monitorType}</span> monitor
            </span>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-2 mt-4">
            {inv.services.map(s => (
              <span key={s} className="px-2.5 py-1 rounded-md text-xs font-mono text-[#A0A0B8] bg-[#18162A] border border-white/[0.08]">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Writeup ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-xl border border-white/[0.07] bg-[#18162A] p-6 sm:p-8">
          <div className="prose-investigation">
            <MarkdownRenderer content={inv.writeup} />
          </div>
        </div>

        {/* Tags */}
        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <Tag size={13} className="text-[#65637A]" />
          {inv.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] text-[#A0A0B8] bg-white/[0.04] border border-white/[0.06]">
              {tag}
            </span>
          ))}
        </div>

        {/* ── Related ─────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-white mb-4">Related Investigations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map(r => (
                <RelatedCard key={r.id} investigation={r} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate({ page: 'library' })}
            className="inline-flex items-center gap-1.5 text-sm text-[#9B6DC5] hover:text-white font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Library
          </button>
        </div>
      </div>
    </main>
  )
}

/* ── Markdown renderer (simple) ──────────────────────────── */

function MarkdownRenderer({ content }) {
  const lines = content.split('\n')
  const elements = []
  let i = 0
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ol key={`list-${elements.length}`} className="space-y-3 my-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-[#A0A0B8] leading-relaxed">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#774AA4]/20 text-[#9B6DC5] text-xs font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ol>
      )
      listItems = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-8 mb-3 first:mt-0">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} className="text-sm font-bold text-white mt-6 mb-2">
          {line.slice(4)}
        </h3>
      )
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s+/, '')
      listItems.push(text)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-sm text-[#A0A0B8] leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      )
    }
    i++
  }
  flushList()

  return <>{elements}</>
}

function formatInline(text) {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#C084FC] text-xs font-mono">$1</code>')
    // Em-dash
    .replace(/ — /g, ' <span class="text-[#65637A]">—</span> ')
}

/* ── Related card ────────────────────────────────────────── */

function RelatedCard({ investigation: inv, navigate }) {
  const colors = categoryColors[inv.category] || categoryColors['Incident Response']

  return (
    <button
      onClick={() => navigate({ page: 'investigation', investigationId: inv.id })}
      className="group w-full text-left rounded-xl border border-white/[0.07] bg-[#110F1C] hover:border-[#774AA4]/40 hover:bg-[#1F1C33] transition-all duration-200 p-4"
    >
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border} border mb-2`}>
        {categoryIcons[inv.category]} {inv.category}
      </span>
      <h4 className="font-semibold text-white text-sm leading-snug line-clamp-2 mb-1.5">
        {inv.title}
      </h4>
      <p className="text-[#65637A] text-xs line-clamp-2 leading-relaxed">
        {inv.summary}
      </p>
    </button>
  )
}
