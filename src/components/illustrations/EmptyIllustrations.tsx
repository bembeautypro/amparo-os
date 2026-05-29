// Inline SVG illustrations for empty states.
// Strokes use `currentColor` so they pick up `text-primary`.

const baseProps = {
  width: 120,
  height: 120,
  viewBox: "0 0 120 120",
  fill: "none" as const,
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true as const,
};

export function PillsEmpty({ className }: { className?: string }) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="14" y="60" width="92" height="24" rx="12" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
      <path d="M60 60V84" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
      <circle cx="26" cy="34" r="14" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="26" cy="34" r="3" fill="currentColor" />
      <circle cx="94" cy="34" r="14" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" />
    </svg>
  );
}

export function CalendarEmpty({ className }: { className?: string }) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="20" y="26" width="80" height="74" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 46H100" stroke="currentColor" strokeWidth="2.5" />
      <path d="M38 18V34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M82 18V34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="42" cy="64" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="60" cy="64" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="78" cy="64" r="3" fill="currentColor" />
      <circle cx="42" cy="82" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="60" cy="82" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function DocsEmpty({ className }: { className?: string }) {
  return (
    <svg {...baseProps} className={className}>
      <path
        d="M30 18H68L92 42V96C92 99.3 89.3 102 86 102H30C26.7 102 24 99.3 24 96V24C24 20.7 26.7 18 30 18Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M68 18V42H92" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M38 64H78" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 76H68" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 88H58" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryEmpty({ className }: { className?: string }) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="2.5" />
      <path d="M60 36V60L76 70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="14" r="3" fill="currentColor" />
      <path d="M14 60H22" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M98 60H106" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
