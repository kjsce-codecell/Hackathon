import React from "react"
import Hero from "./sections/hero.jsx"
import Footer from "./components/footer/footer.jsx"
import About from "./sections/about"
import FlashBack from "./sections/flashback"
import Sponsor from "./sections/sponsor/sponsor"
import Prizes from "./sections/prizes.jsx"

function App() {
  return (
    <div className="">
      <Hero />   
      <About />
      <FlashBack />
      <Prizes />
      <Sponsor />
      <Footer />
    </div>
  )
}

export default App


