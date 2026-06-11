import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Countdown from '@/components/Countdown'
import Gallery from '@/components/Gallery'
import EventDetails from '@/components/EventDetails'
import DressCode from '@/components/DressCode'
import Entourage from '@/components/Entourage'
import Gifts from '@/components/Gifts'
import RSVP from '@/components/RSVP'
import GameTeaser from '@/components/GameTeaser'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FadeIn><Countdown /></FadeIn>
        <FadeIn><GameTeaser /></FadeIn>
        <FadeIn><Gallery /></FadeIn>
        <FadeIn direction="left"><EventDetails /></FadeIn>
        <FadeIn direction="right"><DressCode /></FadeIn>
        <FadeIn direction="left"><Entourage /></FadeIn>
        <FadeIn direction="right"><Gifts /></FadeIn>
        <FadeIn><RSVP /></FadeIn>
      </main>
      <Footer />
    </>
  )
}
