import { ENTOURAGE } from '@/lib/constants'
import Divider from '@/components/Divider'

function Group({ title, members }: { title: string; members: string | string[] }) {
  const list = Array.isArray(members) ? members : [members]
  return (
    <div className="mb-6">
      <p className="font-body text-xs tracking-[0.3em] uppercase text-white/60 mb-2">{title}</p>
      <div className="space-y-0.5">
        {list.map((name) => (
          <p key={name} className="font-body text-white text-base">
            {name}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function Entourage() {
  return (
    <section id="entourage" className="py-24 bg-accent">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-script text-5xl text-white text-center mb-3">Our Entourage</h2>
        <Divider inverted />
        <p className="font-body text-xs tracking-[0.4em] uppercase text-white/60 text-center mb-12">
          Those Who Walk Beside Us
        </p>

        {/* Principal Sponsors */}
        <div className="mb-12">
          <p className="font-body text-xs tracking-[0.4em] uppercase text-white/60 text-center mb-6">
            Principal Sponsors
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 max-w-2xl mx-auto">
            {ENTOURAGE.principalSponsors.map((name) => (
              <p key={name} className="font-body text-white text-center text-base py-1">
                {name}
              </p>
            ))}
          </div>
        </div>

        <div className="border-t border-white/20 pt-12">
          <div className="grid md:grid-cols-2 gap-x-16 max-w-3xl mx-auto">
            <div>
              <Group title="Best Men" members={ENTOURAGE.bestMen} />
              <Group title="Groomsmen" members={ENTOURAGE.groomsmen} />
              <Group title="Cord" members={ENTOURAGE.cord} />
              <Group title="Candle" members={ENTOURAGE.candle} />
              <Group title="Veil" members={ENTOURAGE.veil} />
            </div>
            <div>
              <Group title="Maids of Honor" members={ENTOURAGE.maidsOfHonor} />
              <Group title="Bridesmaids" members={ENTOURAGE.bridesmaids} />
              <Group title="Ring Bearer" members={ENTOURAGE.ringBearer} />
              <Group title="Bible Bearer" members={ENTOURAGE.bibleBearer} />
              <Group title="Coin Bearer" members={ENTOURAGE.coinBearer} />
              <Group title="Flower Girls" members={ENTOURAGE.flowerGirls} />
              <Group title="Flower Lady" members={ENTOURAGE.flowerLady} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
