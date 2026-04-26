import { WEDDING } from '@/lib/constants'
import Divider from '@/components/Divider'

function EventCard({
  label,
  time,
  name,
  location,
  mapUrl,
}: {
  label: string
  time: string
  name: string
  location: string
  mapUrl: string
}) {
  return (
    <div className="border border-mauve p-8 sm:p-10 text-center flex flex-col items-center">
      <p className="font-body text-xs tracking-[0.4em] uppercase text-accent/60 mb-4">{label}</p>
      <p className="font-script text-5xl text-accent mb-4">{time}</p>
      <p className="font-body font-semibold text-accent text-lg mb-1">{name}</p>
      <p className="font-body text-accent/60 text-sm mb-8">{location}</p>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-xs tracking-[0.3em] uppercase border border-accent text-accent px-8 py-2.5 hover:bg-accent hover:text-white transition-colors"
      >
        View Map
      </a>
    </div>
  )
}

export default function EventDetails() {
  return (
    <section id="details" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-script text-5xl text-accent text-center mb-3">
          Celebration Details
        </h2>
        <Divider />
        <p className="font-body text-xs tracking-[0.3em] uppercase text-accent/60 text-center mb-12">
          {WEDDING.date}
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <EventCard
            label={WEDDING.ceremony.label}
            time={WEDDING.ceremony.time}
            name={WEDDING.church.name}
            location={WEDDING.church.location}
            mapUrl={WEDDING.church.mapUrl}
          />
          <EventCard
            label={WEDDING.reception.label}
            time={WEDDING.reception.time}
            name={WEDDING.venue.name}
            location={WEDDING.venue.location}
            mapUrl={WEDDING.venue.mapUrl}
          />
        </div>
      </div>
    </section>
  )
}
