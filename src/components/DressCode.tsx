import { DRESS_CODE } from '@/lib/constants'
import Divider from '@/components/Divider'

const CATEGORIES = [
  { label: 'Ninong', value: DRESS_CODE.ninong },
  { label: 'Ninang', value: DRESS_CODE.ninang },
  { label: 'Gentlemen', value: DRESS_CODE.gentlemen },
  { label: 'Ladies', value: DRESS_CODE.ladies },
]

export default function DressCode() {
  return (
    <section id="dresscode" className="py-24 bg-mauve">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-script text-5xl text-white text-center mb-3">Dress Code</h2>
        <Divider inverted />
        <p className="font-body text-xs tracking-[0.4em] uppercase text-white/70 text-center mb-12">
          Strictly Formal
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {CATEGORIES.map((cat) => (
            <div key={cat.label} className="bg-white/10 border border-white/20 p-6">
              <p className="font-body text-xs tracking-[0.3em] uppercase text-white/60 mb-2">
                {cat.label}
              </p>
              <p className="font-body text-white text-lg leading-snug">{cat.value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/20 pt-8 text-center">
          <p className="font-body text-white text-base tracking-wide">{DRESS_CODE.note}</p>
        </div>
      </div>
    </section>
  )
}
