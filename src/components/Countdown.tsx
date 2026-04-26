'use client'

import { useEffect, useState } from 'react'
import { WEDDING } from '@/lib/constants'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft {
  const diff = WEDDING.weddingDateTime.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [past, setPast] = useState(false)

  useEffect(() => {
    const update = () => {
      if (Date.now() >= WEDDING.weddingDateTime.getTime()) {
        setPast(true)
        return
      }
      setTimeLeft(getTimeLeft())
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (timeLeft === null) return null

  if (past) {
    return (
      <section className="py-12 bg-[#FEF0EC] text-center">
        <p className="font-['Pinyon_Script'] text-4xl text-[#8B4A3A]">We&rsquo;re married!</p>
      </section>
    )
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <section className="py-12 bg-[#FEF0EC]">
      <div className="flex justify-center gap-6 sm:gap-10">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-semibold text-[#8B4A3A] tabular-nums w-[2.5ch] text-center">
              {String(value).padStart(2, '0')}
            </span>
            <span className="font-['Cormorant_Garamond'] text-xs sm:text-sm uppercase tracking-widest text-[#8B4A3A] mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
