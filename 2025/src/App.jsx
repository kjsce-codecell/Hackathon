import React from "react"
import Footer from "./components/footer/footer.jsx"
import Hero from "./sections/hero"
import About from "./sections/about"
import FlashBack from "./sections/flashback"
import Sponsor from "./sections/sponsor/sponsor"

function App() {
  return (
    <div className="">
      <Hero />   
      <About />
      <FlashBack />
      <Sponsor />
      <Footer />
    </div>
  )
}

export default App


