import React, { useState } from "react";
import "./Navigation.css";

const Navigation = ({ style }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const offset = 100; // Adjust this value based on your navbar height
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <nav className="hero__nav" style={style}>
      <div className="nav-logo">
        <img src="/assets/cclogo.svg" alt="CodeCell Logo" />
      </div>
      
      <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <li><a href="#home" onClick={(e) => handleNavClick(e, '#home')}>Home</a></li>
        <li><a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a></li>
        <li><a href="#timeline" onClick={(e) => handleNavClick(e, '#timeline')}>Timeline</a></li>
        <li><a href="#statistics" onClick={(e) => handleNavClick(e, '#statistics')}>Statistics</a></li>
        <li><a href="#prizes" onClick={(e) => handleNavClick(e, '#prizes')}>Prizes</a></li>
        <li><a href="#sponsors" onClick={(e) => handleNavClick(e, '#sponsors')}>Sponsors</a></li>
        <li><a href="#flashbacks" onClick={(e) => handleNavClick(e, '#flashbacks')}>Flashbacks</a></li>
        <li><a href="#faq" onClick={(e) => handleNavClick(e, '#faq')}>FAQ</a></li>
        <li><a href="#team" onClick={(e) => handleNavClick(e, '#team')}>Team</a></li>
      </ul>
    </nav>
  );
};

export default Navigation; 