import { useState } from 'react'
import { Search, ArrowRight, TrendingUp, Star, Sparkles, ChevronRight, Shield, FileCode, Activity, BookOpen, MessageSquare, Compass, Lightbulb, Zap, Clock, AlertTriangle } from 'lucide-react'
import { templates, contentTypes, contentTypeIcons, contentTypeDescriptions } from '../data/templates.js'
import { investigations, categoryColors, categoryIcons } from '../data/investigations.js'
import ContentCard from './ContentCard.jsx'
import Badge from './Badge.jsx'

export default function Home({ navigate }) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    navigate({ page: 'browse', query: searchQuery })
  }

  const verifiedTemplates = templates.filter(t => t.verified).slice(0, 4)
  const trendingTemplates = templates.filter(t => t.trending).slice(0, 6)
  const featuredTemplates = templates.filter(t => t.featured).slice(0, 4)

  return (
    <main className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Primary radial glow */}
        <div
          className="absolute inset-0 pointer-events-none hero-glow-primary"
          style={{
            background: 'radial-gradient(ellipse 75% 85% at 50% -5%, rgba(139,0,255,0.55) 0%, rgba(119,74,164,0.38) 22%, rgba(99,44,166,0.18) 48%, transparent 68%)',
          }}
        />
        {/* Secondary magenta layer — offset phase */}
        <div
          className="absolute inset-0 pointer-events-none hero-glow-secondary"
          style={{
            background: 'radial-gradient(ellipse 38% 50% at 50% -6%, rgba(192,36,182,0.2) 0%, transparent 52%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Label pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-medium text-[#A0A0B8] mb-7 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C389] animate-pulse flex-shrink-0" />
            Community knowledge hub for Bits AI SRE
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-5">
            Bits{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #9B6DC5 0%, #C084FC 50%, #E879F9 100%)' }}
            >
              Community
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#A0A0B8] mb-10 max-w-xl mx-auto leading-relaxed">
            The best Bits configurations, templates, and investigations — all in one place.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#65637A] group-focus-within:text-[#774AA4] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search bits.md templates, runbooks, monitors…"
                className="w-full pl-12 pr-28 py-4 rounded-xl bg-[#18162A]/80 border border-white/[0.1] text-white placeholder-[#65637A] text-sm outline-none focus:border-[#774AA4]/60 focus:bg-[#18162A] focus:shadow-[0_0_0_3px_rgba(139,0,255,0.15)] transition-all backdrop-blur-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow-[0_0_12px_rgba(139,0,255,0.3)] hover:shadow-[0_0_20px_rgba(139,0,255,0.5)]"
                style={{ background: 'linear-gradient(135deg, #774AA4 0%, #8B00FF 100%)' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick search pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['K8s microservices', 'High error rate', 'First 30 minutes', 'bits.md template'].map(q => (
              <button
                key={q}
                onClick={() => navigate({ page: 'browse', query: q })}
                className="px-3 py-1 rounded-full text-xs text-[#A0A0B8] bg-white/[0.04] hover:bg-white/[0.09] hover:text-white border border-white/[0.06] transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div className="border-y border-white/[0.05] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            {[
              { value: String(templates.length), label: 'templates' },
              { value: '6', label: 'content types' },
              { value: String(investigations.length), label: 'investigations' },
              { value: String(templates.filter(t => t.verified).length), label: 'verified' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-white font-bold text-base tabular-nums">{stat.value}</span>
                <span className="text-[#65637A] text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Browse by Type — equal-width grid ─────────────── */}
      <div className="border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {contentTypes.map(type => (
              <button
                key={type}
                onClick={() => navigate({ page: 'browse', contentType: type })}
                className="group flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#18162A] border border-white/[0.07] hover:border-[#774AA4]/50 hover:bg-[#1F1C33] transition-all duration-200"
              >
                <span className="text-base leading-none flex-shrink-0">{contentTypeIcons[type]}</span>
                <span className="text-white text-xs font-medium truncate">{type}</span>
                <span className="text-[#65637A] text-[10px] font-medium flex-shrink-0">
                  {templates.filter(t => t.contentType === type).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-20">

        {/* ── Start Here ────────────────────────────────────── */}
        <section>
          <SectionHeader
            eyebrow="Datadog Verified"
            eyebrowIcon={<Shield size={12} className="text-[#00C389]" />}
            eyebrowColor="text-[#00C389]"
            title="Start Here"
            subtitle="Curated templates reviewed by the Datadog Bits team. The best starting point."
            action="View all verified"
            onAction={() => navigate({ page: 'browse', verified: true })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {verifiedTemplates.map(t => (
              <ContentCard key={t.id} template={t} navigate={navigate} />
            ))}
          </div>
        </section>

        {/* ── Trending This Week ────────────────────────────── */}
        <section>
          <SectionHeader
            eyebrow="Community Picks"
            eyebrowIcon={<TrendingUp size={12} className="text-[#F59E0B]" />}
            eyebrowColor="text-[#F59E0B]"
            title="Trending This Week"
            subtitle="What the community is copying and adapting most right now."
            action="See all trending"
            onAction={() => navigate({ page: 'browse' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTemplates.map(t => (
              <ContentCard key={t.id} template={t} navigate={navigate} />
            ))}
          </div>
        </section>

        {/* ── Investigation Library teaser ──────────────────── */}
        <section>
          <SectionHeader
            eyebrow="Investigation Library"
            eyebrowIcon={<Zap size={12} className="text-[#F59E0B]" />}
            eyebrowColor="text-[#F59E0B]"
            title="See Bits in Action"
            subtitle="Real investigations that solved real incidents. Learn how Bits surfaces root causes."
            action="View all investigations"
            onAction={() => navigate({ page: 'library' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {investigations.filter(i => i.featured).slice(0, 3).map(inv => {
              const colors = categoryColors[inv.category] || categoryColors['Incident Response']
              return (
                <button
                  key={inv.id}
                  onClick={() => navigate({ page: 'investigation', investigationId: inv.id })}
                  className="group text-left rounded-xl border border-white/[0.07] bg-[#18162A] hover:border-[#774AA4]/40 hover:bg-[#1F1C33] transition-all duration-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(10,8,18,0.8)]"
                >
                  <div className="h-0.5 bg-gradient-to-r from-[#774AA4] to-[#E879F9] opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="p-4">
                    <div className="mb-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {categoryIcons[inv.category]} {inv.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 mb-1.5">{inv.title}</h3>
                    <p className="text-[#A0A0B8] text-xs line-clamp-2 leading-relaxed mb-3">{inv.summary}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#65637A]">
                      <span className="flex items-center gap-1"><Clock size={10} /> {inv.timeToResolution}</span>
                      <span className="flex items-center gap-1"><AlertTriangle size={10} /> {inv.monitorType}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Featured — bento layout ───────────────────────── */}
        <section className="pb-4">
          <SectionHeader
            eyebrow="Editor's Choice"
            eyebrowIcon={<Sparkles size={12} className="text-[#9B6DC5]" />}
            eyebrowColor="text-[#9B6DC5]"
            title="Featured"
            subtitle="Hand-picked templates that show what great Bits configuration looks like."
            action="Browse all templates"
            onAction={() => navigate({ page: 'browse' })}
          />
          {/* Bento: 1 large card + 3 smaller */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {featuredTemplates[0] && (
              <div className="lg:col-span-3">
                <FeaturedCardLarge template={featuredTemplates[0]} navigate={navigate} />
              </div>
            )}
            <div className="lg:col-span-2 grid grid-cols-1 gap-4">
              {featuredTemplates.slice(1, 4).map(t => (
                <FeaturedCardSmall key={t.id} template={t} navigate={navigate} />
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#65637A] text-sm">
              Bits Community — Templates & best practices for{' '}
              <a href="https://docs.datadoghq.com/bits_ai/" className="text-[#9B6DC5] hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                Datadog Bits AI SRE
              </a>
            </span>
          </div>
          <div className="text-[#65637A] text-xs">
            Built by the Bits AI SRE team at Datadog
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function SectionHeader({ eyebrow, eyebrowIcon, eyebrowColor = 'text-[#A0A0B8]', title, subtitle, action, onAction }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        {eyebrow && (
          <div className={`flex items-center gap-1.5 mb-2 ${eyebrowColor}`}>
            {eyebrowIcon}
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{eyebrow}</span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-[#A0A0B8] text-sm mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex-shrink-0 flex items-center gap-1 text-xs text-[#9B6DC5] hover:text-white font-medium transition-colors mt-1"
        >
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  )
}

function TypeCard({ type, icon, description, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 p-5 rounded-xl bg-[#18162A] border border-white/[0.07] hover:border-[#774AA4]/50 hover:bg-[#1F1C33] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(10,8,18,0.7)] text-center"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>
      <div>
        <div className="text-white text-xs font-semibold leading-tight mb-0.5">{type}</div>
        <div className="text-[#65637A] text-[10px] leading-tight">{count} templates</div>
      </div>
      <div className="flex items-center gap-0.5 text-[#9B6DC5] text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Browse <ChevronRight size={10} />
      </div>
    </button>
  )
}

function FeaturedCardLarge({ template, navigate }) {
  const icon = contentTypeIcons[template.contentType] || '📄'
  return (
    <button
      onClick={() => navigate({ page: 'detail', templateId: template.id })}
      className="group lg:col-span-3 text-left rounded-xl border border-white/[0.07] bg-[#18162A] hover:border-[#774AA4]/40 transition-all duration-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(10,8,18,0.8),0_2px_8px_rgba(119,74,164,0.2)]"
    >
      <div className="h-0.5 bg-gradient-to-r from-[#774AA4] via-[#A855F7] to-[#E879F9] opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#774AA4]/25 flex items-center justify-center text-2xl border border-[#774AA4]/30 flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge variant="contentType">{template.contentType}</Badge>
              {template.verified && <Badge variant="verified">Verified</Badge>}
            </div>
            <h3 className="text-lg font-bold text-white leading-snug group-hover:text-white transition-colors">
              {template.title}
            </h3>
          </div>
        </div>

        <p className="text-[#A0A0B8] text-sm leading-relaxed line-clamp-4 mb-5">
          {template.description}
        </p>

        <div className="flex items-center justify-between text-xs text-[#65637A] pt-4 border-t border-white/[0.05]">
          <span>{template.authorType === 'datadog' ? '🟣 Datadog' : `👤 ${template.author}`}</span>
          <div className="flex items-center gap-3">
            <span>⭐ {template.stars.toLocaleString()}</span>
            <span>👥 {template.usageCount >= 1000 ? `${(template.usageCount / 1000).toFixed(1)}k` : template.usageCount} used</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function FeaturedCardSmall({ template, navigate }) {
  const icon = contentTypeIcons[template.contentType] || '📄'
  return (
    <button
      onClick={() => navigate({ page: 'detail', templateId: template.id })}
      className="group text-left rounded-xl border border-white/[0.07] bg-[#18162A] hover:border-[#774AA4]/40 transition-all duration-200 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(10,8,18,0.8)]"
    >
      <div className="h-0.5 bg-gradient-to-r from-[#774AA4] to-[#9B6DC5] opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#774AA4]/20 flex items-center justify-center text-base flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-1.5">
            <Badge variant="contentType">{template.contentType}</Badge>
            {template.verified && <Badge variant="verified">Verified</Badge>}
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors mb-1">
            {template.title}
          </h3>
          <p className="text-[#65637A] text-xs line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>
      </div>
    </button>
  )
}
