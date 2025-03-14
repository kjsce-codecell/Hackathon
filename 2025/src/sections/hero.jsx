import React, { useEffect, useState, useCallback } from "react";
import Navigation from "../components/Navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import "./hero.css";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://apply.devfolio.co/v2/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    AOS.init({
      duration: 1500,
      once: true,
      mirror: false,
      easing: "ease-out",
      anchorPlacement: "top-bottom",
      disable: "mobile"
    });

    // Set loaded state after a small delay to ensure smooth animation
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
  }, []);

  const handleMouseMove = useCallback((e) => {
    // Slower mouse movement effect
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    setMousePosition({ x, y });
  }, []);

  const handleScroll = useCallback(() => {
    const position = window.pageYOffset;
    setScrollPosition(position);
    // Slower parallax effect
    const backgrounds = document.querySelector('.hero__backgrounds');
    if (backgrounds) {
      backgrounds.style.transform = `translateY(${position * 0.3}px)`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleMouseMove, handleScroll]);

  return (
    <section className="hero">
      <div
        className="hero__backgrounds"
        style={{
          transform: `translateY(${scrollPosition * 0.3}px)`
        }}
      >
        <div
          className="hero__background hero__background--base"
          data-aos="fade"
          data-aos-duration="2000"
          data-aos-easing="cubic-bezier(0.34, 1.56, 0.64, 1)"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}
        ></div>
        <img
          src="/images/hero/sky.png"
          alt="Sky"
          className="hero__background hero__background--sky"
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`
          }}
        />
        <img
          src="/images/hero/ground.png"
          alt="Ground"
          className="hero__background hero__background--ground"
          style={{
            transform: `translate(${mousePosition.x * 0.08}px, ${mousePosition.y * 0.08 + scrollPosition * 0.4}px)`,
            transformOrigin: 'bottom center'
          }}
          data-aos="slide-up"
          data-aos-duration="2000"
        />
        <div
          className="hero__background hero__background--horse"
          style={{
            transform: `translate(${mousePosition.x * 0.08}px, ${mousePosition.y * 0.08 + scrollPosition * 0.2}px)`,
            transformOrigin: 'center center'
          }}
        ></div>
      </div>
      <div
        className="hero__overlay"
        style={{
          opacity: Math.min((scrollPosition / 1500) * 0.7, 0.7)
        }}
      ></div>
      {/* <Navigation
        style={{
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
        }}
      /> */}
      <div
        className="hero__content"
        style={{
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1 - scrollPosition * 0.2}px)`
        }}
      >
        <h1 className="hero__title">
          <div className="title-group">
            <div className="text-group">
              <span className="gajshield animate-slide-in">
                GAJSHIELD
              </span>
              <span className="kjsse animate-slide-in-delay-1">
                KJSSE HACK
              </span>
            </div>
            <span className="eight animate-slide-in-delay-2">
              8
            </span>
          </div>
          <p className="dates">12 - 13 APRIL</p>
        </h1>
        <div
          className="apply-button-wrapper animate-slide-in-delay-2"
          data-aos="fade"
          data-aos-delay="1200"
        >
          <div
            className="apply-button"
            data-hackathon-slug="gajshield-kjsse-hack8"
            data-button-theme="dark-inverted"
          ></div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 