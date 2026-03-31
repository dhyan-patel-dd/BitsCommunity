import { CheckCircle, TrendingUp, Shield } from 'lucide-react'

const variantStyles = {
  contentType: 'bg-[#774AA4]/20 text-[#9B6DC5] border border-[#774AA4]/30',
  verified:    'bg-[#00C389]/12 text-[#00C389] border border-[#00C389]/30',
  monitorType: 'bg-[#60A5FA]/12 text-[#60A5FA] border border-[#60A5FA]/25',
  useCase:     'bg-white/[0.05] text-[#A0A0B8] border border-white/[0.08]',
  trending:    'bg-[#F59E0B]/12 text-[#F59E0B] border border-[#F59E0B]/25',
  featured:    'bg-[#774AA4]/20 text-[#9B6DC5] border border-[#774AA4]/30',
}

export default function Badge({ variant = 'contentType', children, className = '' }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap'

  return (
    <span className={`${base} ${variantStyles[variant] || variantStyles.contentType} ${className}`}>
      {variant === 'verified' && <Shield size={9} className="flex-shrink-0" />}
      {variant === 'trending' && <TrendingUp size={9} className="flex-shrink-0" />}
      {children}
    </span>
  )
}
