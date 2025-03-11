import React, { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
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
          src="/images/hero/sky.png"
          alt="Sky"
          className="hero__background hero__background--sky"
          style={{
            transform: `translate(${mousePosition.x * 0.25}px, ${mousePosition.y * 0.25}px)`
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
      {/* <Navigation
        style={{
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
        }}
      /> */}
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