import { CREDIT, WEDDING } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function Footer() {
  const mailto = `mailto:${CREDIT.email}?subject=${encodeURIComponent(CREDIT.subject)}`

  return (
    <footer className="bg-blush py-16 text-center border-t border-mauve/20">
      <Divider />
      <p className="font-script text-5xl text-accent mt-2 mb-3">
        {WEDDING.groomName} &amp; {WEDDING.brideName}
      </p>
      <p className="font-body text-xs tracking-[0.4em] uppercase text-accent/50">
        {WEDDING.date}
      </p>

      {/* Whisper-level portfolio credit — the lead-gen funnel. */}
      <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent/40 mt-10">
        Designed &amp; built by{' '}
        <a
          href={mailto}
          className="relative text-accent/60 transition-colors hover:text-accent after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
        >
          {CREDIT.name}
        </a>
      </p>
    </footer>
  )
}
