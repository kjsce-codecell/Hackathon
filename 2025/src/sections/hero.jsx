import React from "react";
import "./hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__overlay"></div>
      <nav className="hero__nav">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#timeline">Timeline</a></li>
          <li><a href="#statistics">Statistics</a></li>
          <li><a href="#prizes">Prizes</a></li>
          <li><a href="#sponsors">Sponsors</a></li>
          <li><a href="#flashbacks">Flashbacks</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="#team">Team</a></li>
        </ul>
      </nav>
      <div className="hero__content">
        <h1 className="hero__title">
          <span className="gajshield">GAJSHIELD</span>
          <span className="kjsse">KJSSE HACK</span>
          <span className="eight">8</span>
        </h1>
        <button className="hero__cta">
          <span className="hero__cta-icon">📁</span>
          Go to projects
        </button>
      </div>
    </section>
  );
};

export default Hero;