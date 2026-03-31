import { useState } from 'react'
import { useEffect } from 'react'
import {
  ChevronRight, Copy, Check, Star, Users,
  Calendar, Building2, CheckCircle, Tag, ArrowLeft,
  Shield, ArrowUp, MessageSquare, ThumbsUp, Send, Maximize2, Minimize2, X
} from 'lucide-react'
import { templates, contentTypeIcons } from '../data/templates.js'
import Badge from './Badge.jsx'
import ContentCard from './ContentCard.jsx'

// Seed comments keyed by template id — falls back to generic pool
const SEED_COMMENTS = {
  default: [
    {
      id: 'c1', author: 'Sarah K.', authorType: 'community', companySize: 'enterprise',
      body: 'This saved us hours of setup. We adapted it for our payments service and saw noticeably better investigation results within a week. The dependency ordering section is especially valuable — Bits uses it exactly as described.',
      likes: 14, createdAt: '2025-11-03T10:22:00Z',
    },
    {
      id: 'c2', author: 'Datadog Team', authorType: 'datadog', companySize: null,
      body: 'Great question from the thread below — the `## Bits Investigation Hints` section is the highest-signal part of any bits.md. If you only add one section, make it that one. We\'re working on a guide that goes deeper on this.',
      likes: 31, createdAt: '2025-11-18T14:05:00Z',
    },
    {
      id: 'c3', author: 'Marcus T.', authorType: 'community', companySize: 'mid-market',
      body: 'One tip: we added a "Known noisy alerts" section listing monitors that fire frequently but are usually false positives. Bits stopped over-indexing on them almost immediately.',
      likes: 22, createdAt: '2025-12-01T09:15:00Z',
    },
  ],
  alt: [
    {
      id: 'c4', author: 'Priya N.', authorType: 'community', companySize: 'startup',
      body: 'Finally something I could actually copy-paste on day one. Took 20 minutes to adapt for our stack and our first investigation came back with a real root cause instead of "inconclusive".',
      likes: 19, createdAt: '2025-10-14T16:44:00Z',
    },
    {
      id: 'c5', author: 'Datadog Team', authorType: 'datadog', companySize: null,
      body: 'This is one of the most-used templates in the library for good reason. A few teams have shared variations — worth checking the related templates in the sidebar.',
      likes: 27, createdAt: '2025-11-22T11:30:00Z',
    },
    {
      id: 'c6', author: 'James W.', authorType: 'community', companySize: 'enterprise',
      body: 'We use a version of this across 40+ services. The key unlock for us was the SLO table — Bits uses those thresholds to calibrate severity. Without it, everything felt equally urgent.',
      likes: 33, createdAt: '2025-12-08T08:20:00Z',
    },
  ],
}

function getSeedComments(templateId) {
  // Deterministically pick a seed set based on template id
  const charSum = templateId.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return charSum % 2 === 0 ? SEED_COMMENTS.default : SEED_COMMENTS.alt
}

export default function TemplateDetail({ templateId, navigate }) {
  const template = templates.find(t => t.id === templateId)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [upvoted, setUpvoted] = useState(false)
  const [starred, setStarred] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(template?.stars ?? 0)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const [comments, setComments] = useState(() => getSeedComments(templateId))
  const [newComment, setNewComment] = useState('')
  const [commentName, setCommentName] = useState('')
  const [likedComments, setLikedComments] = useState(new Set())

  if (!template) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-[#A0A0B8]">Template not found.</p>
        <button
          onClick={() => navigate({ page: 'browse' })}
          className="mt-4 px-4 py-2 rounded-lg bg-[#774AA4] text-white text-sm font-medium"
        >
          Back to Browse
        </button>
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(template.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleUpvote = () => {
    setUpvoteCount(c => upvoted ? c - 1 : c + 1)
    setUpvoted(!upvoted)
  }

  const handlePostComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const comment = {
      id: `user-${Date.now()}`,
      author: commentName.trim() || 'Anonymous',
      authorType: 'community',
      companySize: null,
      body: newComment.trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
    }
    setComments(prev => [...prev, comment])
    setNewComment('')
  }

  const handleLikeComment = (id) => {
    setLikedComments(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const relatedTemplates = templates
    .filter(t =>
      t.id !== template.id &&
      (t.contentType === template.contentType ||
       t.monitorTypes.some(mt => template.monitorTypes.includes(mt)))
    )
    .slice(0, 3)

  const icon = contentTypeIcons[template.contentType] || '📄'

  const companyLabels = {
    startup: 'Startup',
    'mid-market': 'Mid-Market',
    enterprise: 'Enterprise',
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filename =
    template.contentType === 'bits.md' ? 'bits.md' :
    template.contentType === 'Monitor Template' ? 'monitor-template.md' :
    template.contentType === 'Runbook' ? 'runbook.md' :
    template.contentType === 'Chat Prompts' ? 'prompts.md' :
    template.contentType === 'Setup Guide' ? 'guide.md' :
    'tips.md'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* ── Breadcrumb ─────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-[#65637A] mb-6">
        <button onClick={() => navigate({ page: 'home' })} className="hover:text-[#9B6DC5] transition-colors">
          Home
        </button>
        <ChevronRight size={12} />
        <button onClick={() => navigate({ page: 'browse' })} className="hover:text-[#9B6DC5] transition-colors">
          Browse
        </button>
        <ChevronRight size={12} />
        <button
          onClick={() => navigate({ page: 'browse', contentType: template.contentType })}
          className="hover:text-[#9B6DC5] transition-colors"
        >
          {template.contentType}
        </button>
        <ChevronRight size={12} />
        <span className="text-[#A0A0B8] truncate max-w-[200px]">{template.title}</span>
      </nav>

      <div className="flex gap-8">
        {/* ── Main content ───────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Title area */}
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="contentType">{icon} {template.contentType}</Badge>
              {template.verified && <Badge variant="verified">Datadog Verified</Badge>}
              {template.trending && <Badge variant="trending">Trending</Badge>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3 tracking-tight">
              {template.title}
            </h1>

            <p className="text-[#A0A0B8] text-sm leading-relaxed max-w-2xl">
              {template.description}
            </p>
          </div>

          {/* Monitor type + use case badges */}
          {(template.monitorTypes.length > 0 || template.useCases.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {template.monitorTypes.map(mt => (
                <Badge key={mt} variant="monitorType">{mt}</Badge>
              ))}
              {template.useCases.map(uc => (
                <Badge key={uc} variant="useCase">{uc}</Badge>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 py-3.5 px-4 rounded-xl bg-[#110F1C] border border-white/[0.06] mb-6 text-sm">
            {/* Author */}
            <div className="flex items-center gap-2">
              {template.authorType === 'datadog' ? (
                <div className="w-7 h-7 rounded-full bg-[#774AA4] flex items-center justify-center">
                  <Shield size={13} className="text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center text-xs font-bold text-[#9B6DC5]">
                  {(template.author[0] || 'U').toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-white font-medium text-xs">
                  {template.authorType === 'datadog' ? 'Datadog' : template.author}
                </div>
                <div className="text-[#65637A] text-[10px]">
                  {template.authorType === 'datadog' ? 'Official Template' : 'Community Member'}
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-white/[0.06]" />

            {template.companySize && (
              <div className="flex items-center gap-1.5 text-[#A0A0B8]">
                <Building2 size={13} />
                <span className="text-xs">{companyLabels[template.companySize]}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[#A0A0B8]">
              <Star size={13} className={starred ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#65637A]'} />
              <span className="text-xs">{(upvoteCount + (starred ? 1 : 0)).toLocaleString()} stars</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#A0A0B8]">
              <Users size={13} />
              <span className="text-xs">
                {template.usageCount >= 1000
                  ? `${(template.usageCount / 1000).toFixed(1)}k`
                  : template.usageCount} uses
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#A0A0B8]">
              <Calendar size={13} />
              <span className="text-xs">{formatDate(template.createdAt)}</span>
            </div>
          </div>

          {/* Upvote + Star */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                upvoted
                  ? 'bg-[#774AA4] text-white shadow-[0_0_20px_rgba(139,0,255,0.4)]'
                  : 'bg-[#18162A] border border-white/[0.08] text-[#A0A0B8] hover:border-[#774AA4]/50 hover:text-white'
              }`}
            >
              <ArrowUp size={15} />
              Upvote
              <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                upvoted ? 'bg-white/20' : 'bg-white/[0.06]'
              }`}>
                {upvoteCount + (upvoted ? 1 : 0)}
              </span>
            </button>

            <button
              onClick={() => setStarred(!starred)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                starred
                  ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B]'
                  : 'bg-[#18162A] border border-white/[0.08] text-[#A0A0B8] hover:border-[#F59E0B]/30 hover:text-white'
              }`}
            >
              <Star size={15} className={starred ? 'fill-[#F59E0B]' : ''} />
              {starred ? 'Starred' : 'Star'}
            </button>
          </div>

          {/* ── Template content block ──────────────── */}
          <div className="rounded-xl border border-white/[0.07] bg-[#070611] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0F0D1E] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFullscreen(true)}
                  title="Full screen (F)"
                  className="p-1 rounded hover:bg-white/[0.08] text-[#65637A] hover:text-white transition-all"
                >
                  <Maximize2 size={13} />
                </button>
                <span className="text-[#65637A] text-xs font-mono">{filename}</span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-[#00C389]/15 text-[#00C389] border border-[#00C389]/30'
                    : 'bg-[#18162A] text-[#A0A0B8] hover:text-white hover:bg-[#1F1C33] border border-white/[0.07]'
                }`}
              >
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <pre className="p-5 text-[#E8E6F0] text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto">
              {template.content}
            </pre>
          </div>

          {/* ── Fullscreen modal ─────────────────────── */}
          {fullscreen && (
            <div
              className="fixed inset-0 z-50 bg-[#070611] flex flex-col animate-fade-in"
              onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false) }}
            >
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-[#0F0D1E] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Minimize2 size={13} className="text-[#65637A]" />
                  <span className="text-[#65637A] text-xs font-mono">{filename}</span>
                  <span className="text-[#2A2840] text-xs mx-1">·</span>
                  <span className="text-[#65637A] text-xs">{template.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      copied
                        ? 'bg-[#00C389]/15 text-[#00C389] border border-[#00C389]/30'
                        : 'bg-[#18162A] text-[#A0A0B8] hover:text-white hover:bg-[#1F1C33] border border-white/[0.07]'
                    }`}
                  >
                    {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                  </button>
                  <button
                    onClick={() => setFullscreen(false)}
                    className="p-1.5 rounded-lg text-[#65637A] hover:text-white hover:bg-white/[0.08] transition-all"
                    title="Exit full screen (Esc)"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <pre className="flex-1 overflow-auto p-8 text-[#E8E6F0] text-sm leading-relaxed whitespace-pre-wrap break-words font-mono">
                {template.content}
              </pre>

              {/* Bottom hint */}
              <div className="flex items-center justify-center py-2 border-t border-white/[0.05]">
                <span className="text-[#65637A] text-[11px]">Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.07] text-[10px] font-mono">Esc</kbd> to exit</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Tag size={13} className="text-[#65637A]" />
              {template.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => navigate({ page: 'browse', query: tag })}
                  className="px-2.5 py-1 rounded-md text-xs text-[#A0A0B8] bg-[#18162A] border border-white/[0.06] hover:border-[#774AA4]/40 hover:text-[#9B6DC5] transition-all"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* ── Comments ───────────────────────────────── */}
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <MessageSquare size={16} className="text-[#65637A]" />
              <span className="text-[11px] font-semibold text-[#65637A] uppercase tracking-[0.08em]">Discussion</span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[#65637A] text-[11px] font-medium">
                {comments.length}
              </span>
            </div>

            {/* Comment list */}
            <div className="space-y-5 mb-8">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  liked={likedComments.has(comment.id)}
                  onLike={() => handleLikeComment(comment.id)}
                />
              ))}
            </div>

            {/* New comment form */}
            <form onSubmit={handlePostComment} className="rounded-xl border border-white/[0.07] bg-[#110F1C] overflow-hidden">
              <div className="p-4 border-b border-white/[0.05]">
                <input
                  type="text"
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={40}
                  className="w-full bg-transparent text-sm text-white placeholder-[#65637A] outline-none"
                />
              </div>
              <div className="p-4">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share how you've used this template, ask a question, or suggest an improvement…"
                  rows={3}
                  className="w-full bg-transparent text-sm text-white placeholder-[#65637A] outline-none resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                <span className="text-[11px] text-[#65637A]">Shown as anonymous if no name provided</span>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#774AA4] text-white hover:bg-[#8B5ABE] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={12} />
                  Post comment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar: Related Templates ──────────── */}
        {relatedTemplates.length > 0 && (
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[11px] font-semibold text-[#65637A] uppercase tracking-[0.08em]">Related</span>
              </div>
              <div className="space-y-3">
                {relatedTemplates.map(t => (
                  <ContentCard key={t.id} template={t} navigate={navigate} />
                ))}
              </div>

              <button
                onClick={() => navigate({ page: 'browse', contentType: template.contentType })}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#18162A] border border-white/[0.07] text-[#A0A0B8] text-xs font-medium hover:text-white hover:border-[#774AA4]/30 transition-all"
              >
                <ArrowLeft size={13} />
                More {template.contentType}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

const AVATAR_COLORS = [
  'bg-[#774AA4]', 'bg-[#0EA5E9]', 'bg-[#10B981]',
  'bg-[#F59E0B]', 'bg-[#EC4899]', 'bg-[#8B5CF6]',
]

function CommentItem({ comment, liked, onLike }) {
  const colorIndex = comment.author.charCodeAt(0) % AVATAR_COLORS.length
  const avatarColor = comment.authorType === 'datadog' ? 'bg-[#774AA4]' : AVATAR_COLORS[colorIndex]

  const relativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
        {comment.author[0].toUpperCase()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-white text-xs font-semibold">{comment.author}</span>
          {comment.authorType === 'datadog' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#774AA4]/20 text-[#9B6DC5] text-[10px] font-medium border border-[#774AA4]/25">
              <Shield size={8} /> Datadog
            </span>
          )}
          {comment.companySize && (
            <span className="text-[#65637A] text-[10px]">{
              comment.companySize === 'enterprise' ? 'Enterprise' :
              comment.companySize === 'mid-market' ? 'Mid-Market' : 'Startup'
            }</span>
          )}
          <span className="text-[#65637A] text-[10px] ml-auto">{relativeTime(comment.createdAt)}</span>
        </div>

        <p className="text-[#A0A0B8] text-sm leading-relaxed">{comment.body}</p>

        <button
          onClick={onLike}
          className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
            liked ? 'text-[#774AA4]' : 'text-[#65637A] hover:text-[#A0A0B8]'
          }`}
        >
          <ThumbsUp size={11} className={liked ? 'fill-[#774AA4]' : ''} />
          {comment.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  )
}
