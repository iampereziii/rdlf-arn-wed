import Image from 'next/image'
import Link from 'next/link'
import { SEAT_BANNER } from '@/lib/constants'
import Divider from '@/components/Divider'

// Venue signage for the reception entrance — print it or leave it open on a
// screen. Static, no data fetch: the QR (or the tappable path under it) sends
// guests to the live /find-my-table lookup.
export default function SeatBanner() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blush px-6 py-16 text-center">
      <p className="font-body text-sm uppercase tracking-[0.4em] text-accent/60 sm:text-base">
        {SEAT_BANNER.eyebrow}
      </p>
      <h1 className="mt-3 font-script text-6xl text-accent sm:text-7xl md:text-8xl">
        {SEAT_BANNER.heading}
      </h1>
      <Divider />
      <p className="font-body text-xl italic text-accent/80 sm:text-2xl md:text-3xl">
        {SEAT_BANNER.message}
      </p>
      <div className="mt-10 inline-block border border-mauve bg-white p-6 sm:p-8">
        {SEAT_BANNER.qrImage ? (
          <Image
            src={`/${SEAT_BANNER.qrImage}`}
            alt="QR code to find your seat"
            width={320}
            height={320}
            className="h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80"
          />
        ) : (
          <p className="flex h-56 w-56 items-center justify-center font-body text-lg text-accent/60 sm:h-72 sm:w-72 md:h-80 md:w-80">
            QR coming soon
          </p>
        )}
      </div>
      <p className="mt-6 font-body text-base text-accent/70 sm:text-lg">
        or visit{' '}
        <Link href={SEAT_BANNER.lookupPath} className="font-semibold text-accent underline underline-offset-4">
          {SEAT_BANNER.lookupPath}
        </Link>{' '}
        on this site
      </p>
    </main>
  )
}
