import React from "react"
import Footer from "./components/footer/footer.jsx"
import Hero from "./sections/hero"
import About from "./sections/about"
import FlashBack from "./sections/flashback"
import Prizes from "./sections/prizes"
import Sponsor from "./sections/sponsor/sponsor"
import StatsPage from "./sections/stats/stats.jsx"

function App() {
  return (
    <div className="main-container">
      <Hero />   
      <About />
      <StatsPage/>
      <FlashBack />
      <Prizes />
      <Sponsor />
      <Footer />
    </div>
  )
}

export default App


