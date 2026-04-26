import { ENTOURAGE } from '@/lib/constants'
import Divider from '@/components/Divider'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-xs tracking-[0.4em] uppercase text-white/60 text-center mb-6">
      {children}
    </p>
  )
}

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

const SECONDARY_SPONSORS = [
  { role: 'Cord', members: ENTOURAGE.cord },
  { role: 'Candle', members: ENTOURAGE.candle },
  { role: 'Veil', members: ENTOURAGE.veil },
]

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
        <div className="mb-12 max-w-2xl mx-auto">
          <SectionLabel>Principal Sponsors</SectionLabel>

          <div className="grid grid-cols-2 mb-3">
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-white/40 text-right pr-5">
              Ninang
            </p>
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-white/40 text-left pl-5">
              Ninong
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {ENTOURAGE.principalSponsors.map((pair, i) => (
              <div key={i} className="grid grid-cols-2 py-2.5">
                <p className="font-body text-white text-sm text-right pr-5 leading-snug">
                  {pair.ninang}
                </p>
                <p className="font-body text-white text-sm text-left pl-5 leading-snug">
                  {pair.ninong}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Sponsors */}
        <div className="border-t border-white/20 pt-12 mb-12 max-w-sm mx-auto">
          <SectionLabel>Secondary Sponsors</SectionLabel>

          <div className="space-y-4">
            {SECONDARY_SPONSORS.map(({ role, members }) => (
              <div key={role} className="grid grid-cols-[6rem_1fr] items-baseline gap-3">
                <p className="font-body text-xs tracking-[0.3em] uppercase text-white/50 text-right">
                  {role}
                </p>
                <p className="font-body text-white text-sm leading-snug">
                  {members.join(' & ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Wedding Party */}
        <div className="border-t border-white/20 pt-12 mb-12">
          <SectionLabel>Wedding Party</SectionLabel>

          <div className="grid md:grid-cols-2 gap-x-16 max-w-3xl mx-auto">
            <div>
              <Group title="Best Men" members={ENTOURAGE.bestMen} />
              <Group title="Groomsmen" members={ENTOURAGE.groomsmen} />
            </div>
            <div>
              <Group title="Maids of Honor" members={ENTOURAGE.maidsOfHonor} />
              <Group title="Bridesmaids" members={ENTOURAGE.bridesmaids} />
            </div>
          </div>
        </div>

        {/* Little Ones */}
        <div className="border-t border-white/20 pt-12">
          <SectionLabel>Little Ones</SectionLabel>

          <div className="grid sm:grid-cols-3 gap-x-8 gap-y-6 max-w-2xl mx-auto">
            <Group title="Ring Bearer" members={ENTOURAGE.ringBearer} />
            <Group title="Bible Bearer" members={ENTOURAGE.bibleBearer} />
            <Group title="Coin Bearer" members={ENTOURAGE.coinBearer} />
            <Group title="Flower Girls" members={ENTOURAGE.flowerGirls} />
            <Group title="Flower Lady" members={ENTOURAGE.flowerLady} />
          </div>
        </div>
      </div>
    </section>
  )
}
