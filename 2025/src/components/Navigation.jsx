import React, { useState, useEffect } from "react";
import "./Navigation.css";

const Navigation = ({ style }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setHoveredItem(null); // Clear any hover state on click
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const offset = 100; // Adjust this value based on your navbar height
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      // Reset link state after scrolling
      setTimeout(() => {
        // Remove any active/focus states from links
        document.activeElement.blur();
      }, 100);
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  // Handle hover states manually
  const handleMouseEnter = (index) => {
    setHoveredItem(index);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
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
        <li 
          className={hoveredItem === 0 ? 'hovered' : ''}
          onMouseEnter={() => handleMouseEnter(0)} 
          onMouseLeave={handleMouseLeave}
        >
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')}>Home</a>
        </li>
        <li 
          className={hoveredItem === 1 ? 'hovered' : ''}
          onMouseEnter={() => handleMouseEnter(1)} 
          onMouseLeave={handleMouseLeave}
        >
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a>
        </li>
        <li 
          className={hoveredItem === 2 ? 'hovered' : ''}
          onMouseEnter={() => handleMouseEnter(2)} 
          onMouseLeave={handleMouseLeave}
        >
          <a href="#stats" onClick={(e) => handleNavClick(e, '#stats')}>Stats</a>
        </li>
        <li 
          className={hoveredItem === 3 ? 'hovered' : ''}
          onMouseEnter={() => handleMouseEnter(3)} 
          onMouseLeave={handleMouseLeave}
        >
          <a href="#prizes" onClick={(e) => handleNavClick(e, '#prizes')}>Prizes</a>
        </li>
        <li 
          className={hoveredItem === 4 ? 'hovered' : ''}
          onMouseEnter={() => handleMouseEnter(4)} 
          onMouseLeave={handleMouseLeave}
        >
          <a href="#sponsors" onClick={(e) => handleNavClick(e, '#sponsors')}>Sponsors</a>
        </li>
        <li 
          className={hoveredItem === 5 ? 'hovered' : ''}
          onMouseEnter={() => handleMouseEnter(5)} 
          onMouseLeave={handleMouseLeave}
        >
          <a href="#flashbacks" onClick={(e) => handleNavClick(e, '#flashbacks')}>Flashbacks</a>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;