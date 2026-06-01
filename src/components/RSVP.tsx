'use client'

import { useEffect, useState } from 'react'
import { WEDDING } from '@/lib/constants'
import { rsvpWriteEnabled, submitRsvp } from '@/lib/rsvpSheet'
import Divider from '@/components/Divider'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputClass =
  'w-full bg-white/10 border border-white/30 text-white placeholder-white/40 font-body px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white'

export default function RSVP() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [attending, setAttending] = useState<boolean | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  // Personalized-invite link state, read from the URL on mount:
  //   ?name=…  → prefills the Full name field (still editable)
  //   ?plus=1  → this guest was granted a +1, so the companion field appears
  // Read via URLSearchParams in an effect (not next/navigation's
  // useSearchParams, which needs a Suspense boundary under output:'export').
  const [plusAllowed, setPlusAllowed] = useState(false)
  const [bringingPlusOne, setBringingPlusOne] = useState(false)
  const [plusOneName, setPlusOneName] = useState('')

  useEffect(() => {
    setIsOpen(new Date() <= WEDDING.rsvpDeadline)

    const params = new URLSearchParams(window.location.search)
    const invitedName = params.get('name')
    if (invitedName) setName(invitedName.trim().replace(/\s+/g, ' '))
    const plus = params.get('plus')
    if (plus === '1' || plus === 'true') setPlusAllowed(true)
  }, [])

  const formUrl = process.env.NEXT_PUBLIC_RSVP_FORM_URL ?? WEDDING.rsvpUrl
  const canSubmit =
    name.trim() !== '' && /\S+@\S+\.\S+/.test(email) && attending !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || status === 'submitting') return
    setStatus('submitting')
    const ok = await submitRsvp({
      name,
      email,
      contact,
      attending: attending === true,
      // Only send a +1 when one was granted, the guest opted in, and they're
      // attending — submitRsvp also drops it for a declining guest.
      plusOneName: plusAllowed && bringingPlusOne ? plusOneName : '',
      honeypot,
    })
    setStatus(ok ? 'success' : 'error')
  }

  return (
    <section id="rsvp" className="py-24 bg-accent">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="font-script text-5xl text-white mb-3">RSVP</h2>
        <Divider inverted />
        <p className="font-body text-xs tracking-[0.4em] uppercase text-white/60 mb-10">
          Kindly Respond by {WEDDING.rsvpDeadlineLabel}
        </p>

        {isOpen === null ? null : !isOpen ? (
          <p className="font-body text-white/80 text-xl italic">
            Thank you — RSVP is now closed.
          </p>
        ) : !rsvpWriteEnabled() ? (
          // Endpoint not configured yet — fall back to the Google Form link.
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-body text-sm tracking-[0.3em] uppercase border-2 border-white text-white px-12 py-4 hover:bg-white hover:text-accent transition-colors"
          >
            RSVP Now
          </a>
        ) : status === 'success' ? (
          <p className="font-body text-white text-xl italic">
            Thank you — your RSVP has been received.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="text-left space-y-5">
            <div>
              <label htmlFor="rsvp-name" className="sr-only">
                Full name
              </label>
              <input
                id="rsvp-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="rsvp-email" className="sr-only">
                Email address
              </label>
              <input
                id="rsvp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="rsvp-contact" className="sr-only">
                Contact number
              </label>
              <input
                id="rsvp-contact"
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Contact number"
                className={inputClass}
              />
            </div>

            {/* Honeypot — hidden from humans; bots that fill it are dropped. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="rsvp-company">Company</label>
              <input
                id="rsvp-company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="font-body text-xs tracking-[0.3em] uppercase text-white/60 mb-2">
                Will you be attending?
              </legend>
              <div className="flex gap-3">
                {[
                  { label: 'Joyfully accept', value: true },
                  { label: 'Regretfully decline', value: false },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => setAttending(opt.value)}
                    className={`flex-1 font-body text-sm tracking-widest uppercase border-2 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white ${
                      attending === opt.value
                        ? 'bg-white text-accent border-white'
                        : 'border-white/50 text-white hover:border-white'
                    }`}
                    aria-pressed={attending === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* +1 — only for invitees granted one (?plus=1) who are attending. */}
            {plusAllowed && attending === true && (
              <fieldset className="space-y-3">
                <legend className="font-body text-xs tracking-[0.3em] uppercase text-white/60 mb-2">
                  Bringing a guest?
                </legend>
                <div className="flex gap-3">
                  {[
                    { label: 'Yes, +1', value: true },
                    { label: 'Just me', value: false },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => setBringingPlusOne(opt.value)}
                      className={`flex-1 font-body text-sm tracking-widest uppercase border-2 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-white ${
                        bringingPlusOne === opt.value
                          ? 'bg-white text-accent border-white'
                          : 'border-white/50 text-white hover:border-white'
                      }`}
                      aria-pressed={bringingPlusOne === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {bringingPlusOne && (
                  <div>
                    <label htmlFor="rsvp-plus-one" className="sr-only">
                      Your guest&rsquo;s full name
                    </label>
                    <input
                      id="rsvp-plus-one"
                      type="text"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      placeholder="Your guest's full name"
                      className={inputClass}
                    />
                  </div>
                )}
              </fieldset>
            )}

            <button
              type="submit"
              disabled={!canSubmit || status === 'submitting'}
              className="w-full font-body text-sm tracking-[0.3em] uppercase border-2 border-white bg-white text-accent px-12 py-4 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Sending…' : 'Send RSVP'}
            </button>

            {status === 'error' && (
              <p className="font-body text-white/80 text-sm text-center" role="alert">
                Something went wrong sending your RSVP. Please try again, or use the{' '}
                <a href={formUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  RSVP form
                </a>
                .
              </p>
            )}
          </form>
        )}

        <p className="font-body text-white/40 text-sm mt-8 tracking-wide">
          {WEDDING.date} · Santa Maria, Bulacan
        </p>
      </div>
    </section>
  )
}
