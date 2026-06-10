'use client'

import { useEffect, useRef, useState } from 'react'

type Direction = 'up' | 'left' | 'right'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  /** Tailwind delay utility, e.g. "delay-150". */
  delay?: string
  /** Entrance direction. Defaults to a gentle rise. */
  direction?: Direction
}

// Hidden offsets per direction — paired with a soft blur for a premium,
// "develops into focus" reveal rather than a flat fade.
const HIDDEN: Record<Direction, string> = {
  up: 'opacity-0 translate-y-8 blur-[2px]',
  left: 'opacity-0 -translate-x-8 blur-[2px]',
  right: 'opacity-0 translate-x-8 blur-[2px]',
}

export default function FadeIn({
  children,
  className = '',
  delay = '',
  direction = 'up',
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${delay} ${
        visible ? 'opacity-100 translate-x-0 translate-y-0 blur-0' : HIDDEN[direction]
      } ${className}`}
    >
      {children}
    </div>
  )
}
