'use client'

// Shared admin-page primitives used by both the guest list (/guests) and the
// seating planner (/seating): the dark/light palette, the badge labels, and the
// small stateless icons. Extracted from GuestList.tsx so the two pages can't
// drift apart on color or iconography (per feature-brief--seating Risk #6).

import { useEffect, useRef, useState } from 'react'
import type { GroupKind, OverrideAffiliation } from '@/lib/guestData'

// Both admin pages support a light/dark toggle. Dark is the default data-dense
// admin treatment; light uses the wedding's invitation palette (#FEF0EC /
// #8B4A3A / #C49A8A) so the page stays on-brand. Every color the page renders
// comes from the active Theme — no hardcoded hex in the markup.

export type ColorScheme = 'dark' | 'light'

export type Theme = {
  page: string // page background
  panel: string // card / panel: border + background
  panelBorder: string // bare border color (row separators)
  overlay: string // sync-gate dimming overlay background
  skeleton: string // skeleton placeholder fill
  bright: string // strongest text (values, names)
  primary: string // headings / accent text
  secondary: string // subtitle text
  muted: string // labels / status text
  faint: string // small guest sub-labels
  dimmed: string // footer / faintest text + icons
  accent: string // spinner / warning / flag accent
  accentBg: string // accent as a background (override marker dot)
  refreshBtn: string // header buttons: border + text + hover
  input: string // search input text
  placeholder: string // search input placeholder
  avatar: string // normal avatar background + text
  avatarFlag: string // flagged avatar background + text
  flagNote: string // flag note border + text
  badge: Record<GroupKind, string>
}

export const THEMES: Record<ColorScheme, Theme> = {
  dark: {
    page: 'bg-[#2a1a15]',
    panel: 'border border-[#4a352d] bg-[#3a2620]',
    panelBorder: 'border-[#4a352d]',
    overlay: 'bg-[#2a1a15]/75',
    skeleton: 'bg-[#4a352d]',
    bright: 'text-[#f2e6df]',
    primary: 'text-[#e7c6b8]',
    secondary: 'text-[#c9a99b]',
    muted: 'text-[#b59a8e]',
    faint: 'text-[#a98d80]',
    dimmed: 'text-[#9c8077]',
    accent: 'text-[#d9a48f]',
    accentBg: 'bg-[#d9a48f]',
    refreshBtn: 'border-[#5a4038] text-[#c9a99b] hover:bg-white/5',
    input: 'text-[#f2e6df]',
    placeholder: 'placeholder:text-[#9c8077]',
    avatar: 'bg-[#4e3a32] text-[#e7c6b8]',
    avatarFlag: 'bg-[#d9a48f] text-[#2a1a15]',
    flagNote: 'border-[#d9a48f] text-[#e7c6b8]',
    badge: {
      couple: 'bg-[#c49a8a]/20 text-[#e7c6b8]',
      family: 'bg-[#8b4a3a]/55 text-[#e7c6b8]',
      individual: 'bg-white/5 text-[#c9a99b]',
      review: 'bg-[#d9a48f] text-[#2a1a15]',
    },
  },
  light: {
    page: 'bg-[#FEF0EC]',
    panel: 'border border-[#E2C0B2] bg-[#FBE4DB]',
    panelBorder: 'border-[#E2C0B2]',
    overlay: 'bg-[#FEF0EC]/75',
    skeleton: 'bg-[#E7C9BC]',
    bright: 'text-[#42241B]',
    primary: 'text-[#8B4A3A]',
    secondary: 'text-[#9E5F4E]',
    muted: 'text-[#8A6A5E]',
    faint: 'text-[#9B7B6E]',
    dimmed: 'text-[#A98F83]',
    accent: 'text-[#B5654A]',
    accentBg: 'bg-[#B5654A]',
    refreshBtn: 'border-[#D8B4A6] text-[#8B4A3A] hover:bg-[#8B4A3A]/5',
    input: 'text-[#42241B]',
    placeholder: 'placeholder:text-[#B29A8F]',
    avatar: 'bg-[#C49A8A] text-[#FEF0EC]',
    avatarFlag: 'bg-[#B5654A] text-[#FEF0EC]',
    flagNote: 'border-[#B5654A] text-[#8B4A3A]',
    badge: {
      couple: 'bg-[#C49A8A]/35 text-[#7A4030]',
      family: 'bg-[#8B4A3A]/20 text-[#7A4030]',
      individual: 'bg-[#8B4A3A]/[0.08] text-[#9E5F4E]',
      review: 'bg-[#B5654A] text-[#FEF0EC]',
    },
  },
}

export const BADGE_LABEL: Record<GroupKind, string> = {
  couple: 'Couple',
  family: 'Family',
  individual: 'Individual',
  review: 'Needs review',
}

// Shared localStorage key for the persisted light/dark choice — both admin
// pages read the same preference so the toggle feels global.
export const COLOR_SCHEME_STORAGE_KEY = 'guests-color-scheme'

// --- Icons -----------------------------------------------------------------

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}

export function Spinner({ t }: { t: Theme }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      className={`mx-auto animate-spin ${t.accent}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WarnIcon({ t }: { t: Theme }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`mx-auto ${t.accent}`}
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

// Small accent dot marking a manually-assigned (overridden) row.
export function OverrideDot({ t }: { t: Theme }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${t.accentBg}`}
      aria-label="manually assigned"
    />
  )
}

// --- Generic dropdown picker ----------------------------------------------
// A small popover menu styled from the active Theme. Used by the affiliation
// override picker on /guests and the table-assignment picker on /seating.
// Options are arbitrary strings so each page supplies its own choice set.

export function DropdownPicker<T extends string>({
  current,
  options,
  hasSelection,
  onSelect,
  onClear,
  clearLabel = 'Reset',
  ariaLabel,
  t,
}: {
  /** The label shown on the trigger button (the current effective value). */
  current: string
  /** Selectable option values. */
  options: readonly T[]
  /** When true, shows the accent dot and renders the clear action. */
  hasSelection: boolean
  onSelect: (value: T) => void
  onClear: () => void
  clearLabel?: string
  ariaLabel: string
  t: Theme
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click. Mousedown (not click) so the menu dismisses
  // before any subsequent click on a parent collapsible row fires.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 border ${t.refreshBtn} px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.1em]`}
      >
        {hasSelection && <OverrideDot t={t} />}
        <span>{current}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 top-full z-20 mt-1 max-h-64 min-w-[140px] overflow-auto ${t.panel} py-1`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(opt)
                setOpen(false)
              }}
              className={`block w-full px-3 py-1.5 text-left font-body text-xs ${t.bright} hover:bg-white/5`}
            >
              {opt}
            </button>
          ))}
          {hasSelection && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className={`block w-full border-t ${t.panelBorder} px-3 py-1.5 text-left font-body text-xs ${t.muted} hover:bg-white/5`}
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// --- Affiliation override picker -------------------------------------------
// Thin wrapper over DropdownPicker for the Groom / Bride affiliation override
// on /guests (per ADR-0002 the picker is the only place overrides are made).

export function OverridePicker({
  current,
  hasOverride,
  onSet,
  onClear,
  t,
}: {
  current: 'Groom' | 'Bride' | 'Guests'
  hasOverride: boolean
  onSet: (value: OverrideAffiliation) => void
  onClear: () => void
  t: Theme
}) {
  return (
    <DropdownPicker<OverrideAffiliation>
      current={current}
      options={['Groom', 'Bride']}
      hasSelection={hasOverride}
      onSelect={onSet}
      onClear={onClear}
      clearLabel="Reset to derived"
      ariaLabel="Override affiliation"
      t={t}
    />
  )
}
