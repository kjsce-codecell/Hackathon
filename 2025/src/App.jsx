import React from "react"
import Hero from "./sections/hero"
import About from "./sections/about"
import FlashBack from "./sections/flashback"
import Prizes from "./sections/prizes"
import Sponsor from "./sections/sponsor/sponsor"
import Footer from "./components/footer/footer.jsx"
import "./App.css"

function App() {
  return (
    <div className="main-container">
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


