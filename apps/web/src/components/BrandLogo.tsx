// Wspólny komponent logo. Można podmienić w jednym miejscu.
export default function BrandLogo({
  className = '',
  variant = 'light',
  size = 28,
}: {
  className?: string;
  variant?: 'light' | 'dark';
  size?: number;
}) {
  const fg = variant === 'light' ? '#FFFFFF' : '#06377B';
  const accent = '#F2D701';
  return (
    <div className={'flex items-center gap-2 ' + className}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" fill={variant === 'light' ? '#06377B' : '#FFFFFF'} />
        <path fill={accent} d="M14 16h36v6H14zm0 12h36v6H14zm0 12h36v6H14z" />
      </svg>
      <div className={'font-extrabold tracking-tight ' + (variant === 'light' ? 'text-white' : 'text-brand')}>
        Pralnia <span style={{ color: accent }}>·</span> Dywanów
      </div>
    </div>
  );
}
