import React from "react";
import "./Navigation.css";

const Navigation = ({ style }) => {
  return (
    <nav className="hero__nav" style={style}>
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
  );
};

export default Navigation; 