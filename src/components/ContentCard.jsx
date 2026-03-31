import { useState } from 'react'
import { Star, Users, CheckCircle, Copy, Check } from 'lucide-react'
import Badge from './Badge.jsx'
import { contentTypeIcons } from '../data/templates.js'

export default function ContentCard({ template, navigate }) {
  const [copied, setCopied] = useState(false)
  const icon = contentTypeIcons[template.contentType] || '📄'

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(template.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // First ~180 chars of content, trimmed to a clean line break
  const preview = (() => {
    const raw = template.content.trim().slice(0, 200)
    const lastNewline = raw.lastIndexOf('\n')
    return (lastNewline > 80 ? raw.slice(0, lastNewline) : raw).trim()
  })()

  return (
    <div className="group relative w-full">
      {/* Main card — clickable */}
      <button
        onClick={() => navigate({ page: 'detail', templateId: template.id })}
        className="w-full text-left rounded-xl border border-white/[0.07] bg-[#18162A] group-hover:border-[#774AA4]/40 group-hover:bg-[#1F1C33] transition-all duration-200 shadow-card group-hover:shadow-cardHover group-hover:-translate-y-1 p-4 flex flex-col gap-3"
      >
        {/* Top: badges + copy button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="contentType">{icon} {template.contentType}</Badge>
            {template.verified && <Badge variant="verified">Verified</Badge>}
            {template.trending && <Badge variant="trending">Trending</Badge>}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy template"
            className={`flex-shrink-0 p-1.5 rounded-md transition-all duration-150 opacity-0 group-hover:opacity-100 ${
              copied
                ? 'bg-[#00C389]/15 text-[#00C389]'
                : 'bg-white/[0.06] text-[#65637A] hover:text-white hover:bg-white/[0.1]'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 transition-colors">
            {template.title}
          </h3>
          <p className="mt-1.5 text-[#A0A0B8] text-xs leading-relaxed line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Monitor type chips */}
        {template.monitorTypes && template.monitorTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.monitorTypes.slice(0, 3).map(mt => (
              <Badge key={mt} variant="monitorType">{mt}</Badge>
            ))}
            {template.monitorTypes.length > 3 && (
              <span className="text-[10px] text-[#65637A] self-center">+{template.monitorTypes.length - 3}</span>
            )}
          </div>
        )}

        {/* Content preview — slides up on hover */}
        <div className="grid transition-all duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="pt-2.5 border-t border-white/[0.05]">
              <pre className="text-[10px] text-[#65637A] font-mono leading-relaxed whitespace-pre-wrap line-clamp-4">
                {preview}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer: author + stats */}
        <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {template.authorType === 'datadog' ? (
              <div className="w-4 h-4 rounded-full bg-[#774AA4] flex items-center justify-center flex-shrink-0">
                <CheckCircle size={9} className="text-white" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <Users size={9} className="text-[#A0A0B8]" />
              </div>
            )}
            <span className="text-[#65637A] text-[11px] truncate">
              {template.authorType === 'datadog' ? 'Datadog' : template.author}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 text-[#65637A] text-[11px]">
              <Star size={10} className="text-[#F59E0B]" />
              <span>{template.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[#65637A] text-[11px]">
              <Users size={10} />
              <span>{template.usageCount >= 1000 ? `${(template.usageCount / 1000).toFixed(1)}k` : template.usageCount}</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
