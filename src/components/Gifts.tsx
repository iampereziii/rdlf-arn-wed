import Image from 'next/image'
import { GIFTS } from '@/lib/constants'
import Divider from '@/components/Divider'

export default function Gifts() {
  return (
    <section id="gifts" className="py-24 bg-blush">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="font-script text-5xl text-accent mb-3">Gifts</h2>
        <Divider />
        <p className="font-body text-xs tracking-[0.4em] uppercase text-accent/60 mb-10">
          A Message from the Couple
        </p>
        <div className="border border-mauve p-8 sm:p-12">
          <p className="font-body text-accent text-lg leading-relaxed italic">
            &ldquo;{GIFTS.message}&rdquo;
          </p>
        </div>

        {GIFTS.qrImage && (
          <div className="mt-10">
            <p className="font-body text-sm text-accent/80 mb-6">
              Scan to send a gift via {GIFTS.qrLabel}
            </p>
            <div className="inline-block border border-mauve bg-white p-6">
              <Image
                src={`/${GIFTS.qrImage}`}
                alt={`${GIFTS.qrLabel} QR code for monetary gifts`}
                width={220}
                height={220}
                className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]"
              />
            </div>
            <p className="font-body text-xs tracking-[0.4em] uppercase text-accent/60 mt-5">
              {GIFTS.qrLabel}
              {GIFTS.qrAccountName && (
                <span className="block tracking-normal normal-case text-accent/80 mt-1">
                  {GIFTS.qrAccountName}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
