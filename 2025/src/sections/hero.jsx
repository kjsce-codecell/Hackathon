import React, { useEffect, useState } from "react";
import "./hero.css";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="hero">
      <div className="hero__backgrounds">
        <div className="hero__background hero__background--base"></div>
        <img
          src="/images/hero/sky.svg"
          alt="Sky"
          className="hero__background hero__background--sky"
          style={{
            transform: `translate(${mousePosition.x * 0.25}px, ${mousePosition.y * 0.25}px)`
          }}
        />
        <img
          src="/images/hero/terrain.svg"
          alt="Terrain"
          className="hero__background hero__background--terrain"
          style={{
            transform: `scale(1.2, 1) translate(${mousePosition.x * 0.15}px, ${mousePosition.y * 0.15}px)`
          }}
        />
        <img
          src="/images/hero/ground.png"
          alt="Ground"
          className="hero__background hero__background--ground"
          style={{
            transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`
          }}
        />
        <div
          className="hero__background hero__background--horse"
          style={{
            transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * 0.4}px)`
          }}
        ></div>
      </div>
      <div className="hero__overlay"></div>
      <nav
        className="hero__nav"
        style={{
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
        }}
      >
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
      <div
        className="hero__content"
        style={{
          transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`
        }}
      >
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