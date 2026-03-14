import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
}

interface BrandLogoProps {
  className?: string
  textClassName?: string
  showText?: boolean
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn('size-8', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#hs-bg)" />
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="13.5"
        stroke="url(#hs-stroke)"
      />
      <path
        d="M24 12.5L14.5 16.2V23.4C14.5 30.7 18.6 35.9 24 38.3C29.4 35.9 33.5 30.7 33.5 23.4V16.2L24 12.5Z"
        fill="#F6FFFE"
        fillOpacity="0.97"
      />
      <path
        d="M24 16.8L18.2 19.1V23C18.2 28.4 20.9 32.3 24 33.9C27.1 32.3 29.8 28.4 29.8 23V19.1L24 16.8Z"
        fill="#0C7A74"
      />
      <path
        d="M23.2 20.7H24.8V22.8H26.9V24.4H24.8V26.5H23.2V24.4H21.1V22.8H23.2V20.7Z"
        fill="#DFF9F6"
      />
      <defs>
        <linearGradient id="hs-bg" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E8E88" />
          <stop offset="1" stopColor="#0B6A66" />
        </linearGradient>
        <linearGradient id="hs-stroke" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8EE5DD" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0A4F4B" stopOpacity="0.7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function BrandLogo({
  className,
  textClassName,
  showText = true,
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <BrandMark className="size-9 shrink-0" />
      {showText && (
        <span
          className={cn(
            'text-3xl font-semibold tracking-tight text-foreground',
            textClassName
          )}
        >
          HealthShield
        </span>
      )}
    </span>
  )
}
