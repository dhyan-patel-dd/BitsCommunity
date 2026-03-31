import { useState } from 'react'
import { useEffect } from 'react'
import {
  ChevronRight, ChevronLeft, Check, Copy, FileCode,
  Bell, BookOpen, MessageSquare, Compass, Lightbulb,
  Shield, AlertCircle, User, EyeOff, Building2, Upload,
  Sparkles, ArrowRight, Maximize2, Minimize2, X
} from 'lucide-react'
import { contentTypes, monitorTypes, useCases, contentTypeIcons, contentTypeDescriptions } from '../data/templates.js'

const SERVICE_TYPES = ['API / REST', 'Database', 'Kubernetes', 'Message Queue', 'Frontend / RUM', 'Serverless', 'Data Pipeline', 'Cache / Redis']
const INDUSTRIES = ['Technology / SaaS', 'Financial Services / Fintech', 'E-Commerce / Retail', 'Healthcare', 'Media / Entertainment', 'Gaming', 'Manufacturing', 'Other']
const COMPANY_SIZES = ['Startup (1–200)', 'Mid-Market (201–2,000)', 'Enterprise (2,000+)']

const CONTENT_TYPE_ICONS_LUCIDE = {
  'bits.md': FileCode,
  'Monitor Template': Bell,
  'Runbook': BookOpen,
  'Chat Prompts': MessageSquare,
  'Setup Guide': Compass,
  'Tips & Best Practices': Lightbulb,
}

const CONTENT_TYPE_PLACEHOLDERS = {
  'bits.md': `# bits.md — [Your Service Name]

## Service Overview
Brief description of what this service does, traffic volume, criticality.

**Team:** your-team@company.com
**On-call:** #your-oncall-channel
**PagerDuty:** your-service-escalation

## Architecture & Dependencies
List your key dependencies in priority order for Bits to investigate.

## SLOs & Thresholds
| Metric | SLO | Alert Threshold |
|--------|-----|-----------------|
| p99 latency | < 500ms | > 2s |
| Error rate | < 0.5% | > 2% |

## Known Flaky Areas
List anything Bits should know is normally noisy or expected.

## Bits Investigation Hints
1. First check: was there a recent deploy?
2. Second: check [primary dependency]
3. Third: check [secondary dependency]`,

  'Monitor Template': `{{#is_alert}}
🔴 **[SERVICE NAME] — [ALERT NAME]**

**Current value:** {{value}} (threshold: {{threshold}})
**Environment:** {{env}}
**Service:** {{service.name}}

**Immediate checks:**
1. Check recent deploys in the last 30 minutes
2. Check [dependency name] health
3. Review [relevant dashboard link]

**Runbook:** [link to your runbook]

Ask Bits: "What caused the spike in [metric] for {{service.name}} starting at {{last_triggered_at}}?"
{{/is_alert}}

{{#is_recovery}}
✅ **RECOVERY: [SERVICE NAME] — [ALERT NAME]**
Duration: {{duration}}
{{/is_recovery}}`,

  'Runbook': `# [Service Name] — [Incident Type] Runbook

## Overview
When to use this runbook and what it covers.

## Severity & Escalation
- **P0:** Page immediately, wake on-call
- **P1:** Respond within 15 minutes
- **P2:** Respond within 1 hour

## Diagnosis Steps

### Step 1: Confirm the alert
- [ ] Check monitor in Datadog
- [ ] Verify it's not a flapping alert

### Step 2: Check dependencies
- [ ] [Dependency 1] — check [metric/dashboard]
- [ ] [Dependency 2] — check [metric/dashboard]

### Step 3: Common causes
**Cause A:** [description]
- Fix: [action]

**Cause B:** [description]
- Fix: [action]

## Mitigation
Steps to reduce customer impact while investigating root cause.

## Resolution
Steps to fully resolve and close the incident.

## Post-Incident
- [ ] Write postmortem
- [ ] Update this runbook if needed`,

  'Chat Prompts': `# [Topic] — Bits Chat Prompt Collection

## Root Cause Investigation
"What caused the spike in error rate for [service] starting at [time]? Show me correlated signals across logs, traces, and infrastructure."

"Is there a correlation between the recent deploy of [service] at [time] and the current alert?"

## Dependency Analysis
"Which upstream or downstream services are contributing to the current degradation in [service]?"

"Show me the dependency chain for [service] and highlight any anomalies in the last hour."

## Log Investigation
"Find the most frequent error patterns in [service] logs in the last 30 minutes. Group by error type."

## Performance Deep-Dive
"What changed in [service] p99 latency over the last 24 hours? Identify the inflection point."`,

  'Setup Guide': `# [Guide Title]

## What you'll accomplish
By the end of this guide, you will have [outcome].

**Time required:** ~[X] minutes
**Prerequisites:** [list any requirements]

---

## Step 1: [First Step Title]

[Explanation of what you're doing and why]

\`\`\`
[code or config example]
\`\`\`

✅ **Checkpoint:** [How to verify this step worked]

---

## Step 2: [Second Step Title]

[Continue...]

---

## Troubleshooting

**Problem:** [Common issue]
**Solution:** [How to fix it]`,

  'Tips & Best Practices': `# [Tip Title]

## The tip
[One-sentence summary of the insight]

## Why it matters
[Explain the problem this solves or the outcome it produces]

## How to apply it
[Concrete, actionable steps]

### Example
**Before:**
[What a bad example looks like]

**After:**
[What the improved version looks like]

## Results we saw
[Optional: what changed after applying this, e.g., "cut inconclusive investigations from 40% to 12%"]`,
}

const STEPS = [
  { id: 1, label: 'Type & basics' },
  { id: 2, label: 'Content' },
  { id: 3, label: 'Tags' },
  { id: 4, label: 'Attribution' },
]

export default function Submit({ navigate }) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const [contentFullscreen, setContentFullscreen] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setContentFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const [form, setForm] = useState({
    contentType: '',
    title: '',
    description: '',
    content: '',
    monitorTypes: [],
    useCases: [],
    serviceTypes: [],
    industry: '',
    companySize: '',
    displayName: '',
    displayPreference: 'username', // 'username' | 'anonymous-industry' | 'anonymous'
  })

  const [errors, setErrors] = useState({})

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  const toggleArray = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }))
  }

  const validateStep = () => {
    const errs = {}
    if (step === 1) {
      if (!form.contentType) errs.contentType = 'Please select a content type'
      if (!form.title.trim()) errs.title = 'Title is required'
      if (form.title.trim().length < 10) errs.title = 'Title should be at least 10 characters'
      if (!form.description.trim()) errs.description = 'Description is required'
      if (form.description.trim().length < 30) errs.description = 'Add a bit more detail — aim for 30+ characters'
    }
    if (step === 2) {
      if (!form.content.trim()) errs.content = 'Template content is required'
      if (form.content.trim().length < 50) errs.content = 'Content is too short — add more detail'
    }
    if (step === 3) {
      if (form.useCases.length === 0) errs.useCases = 'Select at least one use case'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const back = () => setStep(s => s - 1)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) return <SuccessState form={form} navigate={navigate} />

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate({ page: 'browse' })}
          className="flex items-center gap-1.5 text-xs text-[#65637A] hover:text-[#9B6DC5] transition-colors mb-4"
        >
          <ChevronLeft size={14} /> Back to browse
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-[#65637A] uppercase tracking-[0.08em]">Contribute</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Submit a Template</h1>
        <p className="text-[#A0A0B8] text-sm mt-1">
          Share what's working for your team. All submissions are reviewed by Datadog before publishing.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id
                  ? 'bg-[#00C389] text-white'
                  : step === s.id
                    ? 'bg-[#774AA4] text-white shadow-[0_0_14px_rgba(139,0,255,0.4)]'
                    : 'bg-[#18162A] border border-white/[0.1] text-[#65637A]'
              }`}>
                {step > s.id ? <Check size={13} /> : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                step === s.id ? 'text-white' : step > s.id ? 'text-[#00C389]' : 'text-[#65637A]'
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-all ${step > s.id ? 'bg-[#00C389]/40' : 'bg-white/[0.07]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-white/[0.07] bg-[#18162A] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#774AA4] via-[#A855F7] to-[#E879F9]" />

          <div className="p-6 space-y-6">

            {/* ── Step 1: Type & basics ── */}
            {step === 1 && (
              <>
                <FormSection title="Content type" required error={errors.contentType}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {contentTypes.map(type => {
                      const Icon = CONTENT_TYPE_ICONS_LUCIDE[type]
                      const active = form.contentType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => update('contentType', type)}
                          className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                            active
                              ? 'border-[#774AA4]/70 bg-[#774AA4]/15 shadow-[0_0_0_1px_rgba(119,74,164,0.3)]'
                              : 'border-white/[0.07] bg-[#110F1C] hover:border-white/[0.15] hover:bg-[#1F1C33]'
                          }`}
                        >
                          <Icon size={15} className={active ? 'text-[#9B6DC5] mt-0.5 flex-shrink-0' : 'text-[#65637A] mt-0.5 flex-shrink-0'} />
                          <div>
                            <div className={`text-xs font-semibold leading-tight ${active ? 'text-white' : 'text-[#A0A0B8]'}`}>
                              {type}
                            </div>
                            <div className="text-[10px] text-[#65637A] mt-0.5 leading-tight">
                              {contentTypeDescriptions[type].split(' ').slice(0, 5).join(' ')}…
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </FormSection>

                <FormSection title="Title" required error={errors.title}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    placeholder={form.contentType ? `e.g. "Kubernetes ${form.contentType} for API Gateway services"` : 'Give your template a clear, descriptive title'}
                    maxLength={100}
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-[#110F1C] border text-sm text-white placeholder-[#65637A] outline-none transition-all ${
                      errors.title ? 'border-red-500/60 focus:border-red-500' : 'border-white/[0.08] focus:border-[#774AA4]/60 focus:shadow-[0_0_0_3px_rgba(139,0,255,0.1)]'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    <span />
                    <span className="text-[10px] text-[#65637A]">{form.title.length}/100</span>
                  </div>
                </FormSection>

                <FormSection title="Description" required error={errors.description}>
                  <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="What does this template do? Who is it for? What problem does it solve? What makes it effective?"
                    rows={3}
                    maxLength={400}
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-[#110F1C] border text-sm text-white placeholder-[#65637A] outline-none resize-none leading-relaxed transition-all ${
                      errors.description ? 'border-red-500/60 focus:border-red-500' : 'border-white/[0.08] focus:border-[#774AA4]/60 focus:shadow-[0_0_0_3px_rgba(139,0,255,0.1)]'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[#65637A]">Aim for 1–3 sentences that would help someone decide if this is right for their stack.</span>
                    <span className="text-[10px] text-[#65637A]">{form.description.length}/400</span>
                  </div>
                </FormSection>
              </>
            )}

            {/* ── Step 2: Content ── */}
            {step === 2 && (
              <FormSection
                title={form.contentType ? `Your ${form.contentType} content` : 'Template content'}
                required
                error={errors.content}
                hint="This is what users will copy. Use the placeholder as a starting structure."
              >
                {/* inline editor */}
                <div className="rounded-lg border border-white/[0.07] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#0F0D1E] border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setContentFullscreen(true)}
                        title="Full screen (Esc to exit)"
                        className="p-1 rounded hover:bg-white/[0.08] text-[#65637A] hover:text-white transition-all"
                      >
                        <Maximize2 size={12} />
                      </button>
                      <span className="text-[#65637A] text-xs font-mono">
                        {form.contentType === 'bits.md' ? 'bits.md' :
                         form.contentType === 'Monitor Template' ? 'monitor-template.md' :
                         form.contentType === 'Runbook' ? 'runbook.md' :
                         form.contentType === 'Chat Prompts' ? 'prompts.md' :
                         form.contentType === 'Setup Guide' ? 'guide.md' : 'tips.md'}
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={form.content}
                    onChange={e => update('content', e.target.value)}
                    placeholder={form.contentType ? CONTENT_TYPE_PLACEHOLDERS[form.contentType] : 'Paste or write your template content here…'}
                    rows={18}
                    className="w-full px-4 py-3 bg-[#070611] text-[#E8E6F0] text-xs font-mono leading-relaxed outline-none resize-none placeholder-[#3A3858]"
                  />
                </div>

                {/* fullscreen editor modal */}
                {contentFullscreen && (
                  <div className="fixed inset-0 z-50 bg-[#070611] flex flex-col animate-fade-in">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-[#0F0D1E] flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Minimize2 size={13} className="text-[#65637A]" />
                        <span className="text-[#65637A] text-xs font-mono">
                          {form.contentType === 'bits.md' ? 'bits.md' :
                           form.contentType === 'Monitor Template' ? 'monitor-template.md' :
                           form.contentType === 'Runbook' ? 'runbook.md' :
                           form.contentType === 'Chat Prompts' ? 'prompts.md' :
                           form.contentType === 'Setup Guide' ? 'guide.md' : 'tips.md'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContentFullscreen(false)}
                        className="p-1.5 rounded-lg text-[#65637A] hover:text-white hover:bg-white/[0.08] transition-all"
                        title="Exit full screen (Esc)"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <textarea
                      value={form.content}
                      onChange={e => update('content', e.target.value)}
                      placeholder={form.contentType ? CONTENT_TYPE_PLACEHOLDERS[form.contentType] : 'Paste or write your template content here…'}
                      autoFocus
                      className="flex-1 px-8 py-6 bg-transparent text-[#E8E6F0] text-sm font-mono leading-relaxed outline-none resize-none placeholder-[#3A3858]"
                    />
                    <div className="flex items-center justify-center py-2 border-t border-white/[0.05]">
                      <span className="text-[#65637A] text-[11px]">Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.07] text-[10px] font-mono">Esc</kbd> to exit · changes are saved</span>
                    </div>
                  </div>
                )}
                {errors.content && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                    <AlertCircle size={12} /> {errors.content}
                  </p>
                )}
                <p className="text-[10px] text-[#65637A] mt-2">
                  Tip: Remove any company-specific URLs, internal hostnames, or proprietary information before submitting.
                </p>
              </FormSection>
            )}

            {/* ── Step 3: Tags ── */}
            {step === 3 && (
              <>
                <FormSection title="Monitor types" hint="Which Datadog monitor types is this relevant to?">
                  <div className="flex flex-wrap gap-2">
                    {monitorTypes.map(mt => (
                      <ChipToggle
                        key={mt}
                        label={mt}
                        active={form.monitorTypes.includes(mt)}
                        onClick={() => toggleArray('monitorTypes', mt)}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Use cases" required error={errors.useCases}>
                  <div className="flex flex-wrap gap-2">
                    {useCases.map(uc => (
                      <ChipToggle
                        key={uc}
                        label={uc}
                        active={form.useCases.includes(uc)}
                        onClick={() => toggleArray('useCases', uc)}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection title="Service types" hint="What kind of services or infrastructure does this template target?">
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TYPES.map(st => (
                      <ChipToggle
                        key={st}
                        label={st}
                        active={form.serviceTypes.includes(st)}
                        onClick={() => toggleArray('serviceTypes', st)}
                      />
                    ))}
                  </div>
                </FormSection>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSection title="Industry" hint="Optional — helps others find relevant examples">
                    <select
                      value={form.industry}
                      onChange={e => update('industry', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#110F1C] border border-white/[0.08] text-sm text-white outline-none focus:border-[#774AA4]/60 cursor-pointer appearance-none"
                    >
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </FormSection>

                  <FormSection title="Company size" hint="Optional — shown anonymized on your template">
                    <select
                      value={form.companySize}
                      onChange={e => update('companySize', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#110F1C] border border-white/[0.08] text-sm text-white outline-none focus:border-[#774AA4]/60 cursor-pointer appearance-none"
                    >
                      <option value="">Select size…</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormSection>
                </div>
              </>
            )}

            {/* ── Step 4: Attribution ── */}
            {step === 4 && (
              <>
                <FormSection
                  title="Display name"
                  hint="How your name appears on the template. Defaults to your Datadog portal username."
                >
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={e => update('displayName', e.target.value)}
                    placeholder="e.g. Sarah K. or your Datadog username"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#110F1C] border border-white/[0.08] text-sm text-white placeholder-[#65637A] outline-none focus:border-[#774AA4]/60 focus:shadow-[0_0_0_3px_rgba(139,0,255,0.1)] transition-all"
                  />
                </FormSection>

                <FormSection title="Attribution preference" required>
                  <div className="space-y-2.5">
                    {[
                      {
                        value: 'username',
                        icon: User,
                        label: 'Show my display name',
                        sublabel: form.displayName || 'Your display name or portal username',
                      },
                      {
                        value: 'anonymous-industry',
                        icon: Building2,
                        label: 'Show as "Datadog Customer"',
                        sublabel: form.industry ? `Shown as: Datadog Customer · ${form.industry}` : 'Shown as: Datadog Customer (your industry if provided)',
                      },
                      {
                        value: 'anonymous',
                        icon: EyeOff,
                        label: 'Fully anonymous',
                        sublabel: 'No attribution shown. Datadog can still see your identity internally.',
                      },
                    ].map(opt => {
                      const Icon = opt.icon
                      const active = form.displayPreference === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update('displayPreference', opt.value)}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                            active
                              ? 'border-[#774AA4]/70 bg-[#774AA4]/12'
                              : 'border-white/[0.07] bg-[#110F1C] hover:border-white/[0.15]'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            active ? 'bg-[#774AA4]/30 text-[#9B6DC5]' : 'bg-white/[0.05] text-[#65637A]'
                          }`}>
                            <Icon size={13} />
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${active ? 'text-white' : 'text-[#A0A0B8]'}`}>
                              {opt.label}
                            </div>
                            <div className="text-xs text-[#65637A] mt-0.5">{opt.sublabel}</div>
                          </div>
                          {active && (
                            <div className="ml-auto flex-shrink-0">
                              <div className="w-5 h-5 rounded-full bg-[#774AA4] flex items-center justify-center">
                                <Check size={11} className="text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </FormSection>

                {/* Review notice */}
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#00C389]/08 border border-[#00C389]/20">
                  <Shield size={15} className="text-[#00C389] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-[#00C389] mb-0.5">Moderation review</div>
                    <div className="text-xs text-[#A0A0B8] leading-relaxed">
                      All submissions are reviewed by the Datadog Bits team before going live. We typically review within 2–3 business days.
                      We may reach out via your portal account if we have questions.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-[#110F1C]/50">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-[#A0A0B8] hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <ChevronLeft size={15} /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#65637A]">Step {step} of {STEPS.length}</span>
              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[#774AA4] text-white hover:bg-[#8B5ABE] shadow-[0_0_14px_rgba(139,0,255,0.3)] hover:shadow-[0_0_20px_rgba(139,0,255,0.5)] transition-all"
                >
                  Continue <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-[0_0_14px_rgba(139,0,255,0.3)] hover:shadow-[0_0_20px_rgba(139,0,255,0.5)]"
                  style={{ background: 'linear-gradient(135deg, #774AA4 0%, #8B00FF 100%)' }}
                >
                  <Upload size={14} /> Submit for review
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ── Helper components ─────────────────────────────────── */

function FormSection({ title, required, hint, error, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <label className="text-sm font-semibold text-white">
          {title}
          {required && <span className="text-[#774AA4] ml-0.5">*</span>}
        </label>
      </div>
      {hint && <p className="text-xs text-[#65637A] mb-2.5 leading-relaxed">{hint}</p>}
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function ChipToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
        active
          ? 'bg-[#774AA4]/20 border-[#774AA4]/50 text-[#9B6DC5]'
          : 'bg-[#110F1C] border-white/[0.08] text-[#A0A0B8] hover:border-white/[0.2] hover:text-white'
      }`}
    >
      {active && <Check size={10} />}
      {label}
    </button>
  )
}

function SuccessState({ form, navigate }) {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center animate-fade-in">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#00C389]/15 border border-[#00C389]/30 flex items-center justify-center mx-auto mb-6">
        <Check size={28} className="text-[#00C389]" strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Submission received</h1>
      <p className="text-[#A0A0B8] text-sm leading-relaxed mb-1">
        <span className="text-white font-medium">"{form.title}"</span> is now in the Datadog review queue.
      </p>
      <p className="text-[#65637A] text-sm mb-8">
        We'll review it within 2–3 business days. If it's a good fit, it'll be published and you'll be credited
        {form.displayPreference === 'username' ? ` as ${form.displayName || 'your display name'}` :
         form.displayPreference === 'anonymous-industry' ? ' as Datadog Customer' : ' anonymously'}.
      </p>

      {/* What happens next */}
      <div className="text-left rounded-xl border border-white/[0.07] bg-[#18162A] p-5 mb-8">
        <div className="text-[11px] font-semibold text-[#65637A] uppercase tracking-[0.08em] mb-3">What happens next</div>
        <div className="space-y-3">
          {[
            { icon: Shield, label: 'Datadog reviews your submission', sub: 'Usually within 2–3 business days' },
            { icon: Sparkles, label: 'If approved, it goes live in Bits Community', sub: 'Attributed per your preference' },
            { icon: ArrowRight, label: 'The community can upvote, star, and comment', sub: 'You can see feedback in your contributor profile' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#774AA4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={13} className="text-[#9B6DC5]" />
              </div>
              <div>
                <div className="text-white text-xs font-medium">{label}</div>
                <div className="text-[#65637A] text-[11px] mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate({ page: 'home' })}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#774AA4] text-white hover:bg-[#8B5ABE] transition-all"
        >
          Back to home
        </button>
        <button
          onClick={() => navigate({ page: 'browse' })}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#18162A] border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:border-white/[0.2] transition-all"
        >
          Browse templates
        </button>
      </div>
    </div>
  )
}
