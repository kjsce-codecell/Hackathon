import React from "react";
import "./hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__backgrounds">
        <div className="hero__background hero__background--base"></div>
        <img
          src="/images/hero/terrain.svg"
          alt="Terrain"
          className="hero__background hero__background--terrain"
        />
        <div className="hero__background hero__background--horse"></div>
        <div className="hero__background hero__background--sky"></div>
      </div>
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
          <div className="title-group">
            <div className="text-group">
              <span className="gajshield">GAJSHIELD</span>
              <span className="kjsse">KJSSE HACK</span>
            </div>
            <span className="eight">8</span>
          </div>
        </h1>
      </div>
    </section>
  );
};

export default Hero; 