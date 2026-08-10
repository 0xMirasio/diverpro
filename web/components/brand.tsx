function ScubaMark({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M6.5 15.5c3.1-2.5 6.3-3.1 9.8-1.4l4.1 2 4.8-1.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M20.4 16.1l3.2 4.4M24.9 14.9l3.6 2.1M23.6 20.5l-1.1 4.2M23.6 20.5l3.7 2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="7" cy="14.8" r="2.8" stroke="currentColor" strokeWidth="2.1" />
    <path d="M12.2 12.9l1.5-4.3 3.7 1.3-1.3 4.1M3.8 21.9c3.9 2.2 7.9 2.2 11.8 0 3.9-2.2 7.9-2.2 11.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="BlueMates">
      <span className="brand-mark"><ScubaMark size={compact ? 22 : 25} /></span>
      <span className="brand-name">Blue<span>Mates</span></span>
    </div>
  );
}
