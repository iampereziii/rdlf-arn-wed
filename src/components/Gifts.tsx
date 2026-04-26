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
      </div>
    </section>
  )
}
