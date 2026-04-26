import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Gallery from '@/components/Gallery'
import EventDetails from '@/components/EventDetails'
import DressCode from '@/components/DressCode'
import Entourage from '@/components/Entourage'
import Gifts from '@/components/Gifts'
import RSVP from '@/components/RSVP'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <EventDetails />
        <DressCode />
        <Entourage />
        <Gifts />
        <RSVP />
      </main>
      <Footer />
    </>
  )
}
