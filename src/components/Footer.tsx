import { WEDDING } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function Footer() {
  return (
    <footer className="bg-blush py-16 text-center border-t border-mauve/20">
      <Divider />
      <p className="font-script text-5xl text-accent mt-2 mb-3">
        {WEDDING.groomName} &amp; {WEDDING.brideName}
      </p>
      <p className="font-body text-xs tracking-[0.4em] uppercase text-accent/50">
        {WEDDING.date}
      </p>
    </footer>
  )
}
