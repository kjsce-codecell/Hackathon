import React, { useState } from "react";
import "./sponsor.css";

export default function Sponsor() {
  const [activeTab, setActiveTab] = useState("current");
  
  return (
    <section className="sponsor" id="sponsor">
      <img className="sponsor__left-streak" src="/assets/AboutUsLeftStreak.svg" />
      <img className="sponsor__right-streak" src="/assets/AboutUsRightStreak.svg" />
      <div className="sponsor__outer-frame"></div>
      <div className="sponsor__content">
        <div className="sponsor__title-container">
          <h1 className="sponsor__title">SPONSOR</h1>
        </div>
        
        <div className="sponsor__container">
          <div className="sponsor__button-container">
            <button 
              className={`sponsor__button ${activeTab === "current" ? "sponsor__button--active" : ""}`}
              onClick={() => setActiveTab("current")}
            >
              Current Sponsors
            </button>
            <button 
              className={`sponsor__button ${activeTab === "previous" ? "sponsor__button--active" : ""}`}
              onClick={() => setActiveTab("previous")}
            >
              Previous Sponsors
            </button>
          </div>
          
          <div className="sponsor__frame-container">
            <div className="sponsor__frame-border sponsor__frame-border--top"></div>
            <div className="sponsor__frame-border sponsor__frame-border--right"></div>
            <div className="sponsor__frame-border sponsor__frame-border--bottom"></div>
            <div className="sponsor__frame-border sponsor__frame-border--left"></div>
            
            <div className="sponsor__frame">
              <h2 className="sponsor__frame-title">
                {activeTab === "current" ? "Our Current Sponsors" : "Our Previous Sponsors"}
              </h2>
              
              <p className="sponsor__frame-text">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.
              </p>
              
              <div className="sponsor__logos">
                <div className="sponsor__logo-item">
                  <div className="sponsor__logo-placeholder">LOGO 1</div>
                  <p className="sponsor__p">Lorem ipsum dolor sit amet</p>
                </div>
                <div className="sponsor__logo-item">
                  <div className="sponsor__logo-placeholder">LOGO 2</div>
                  <p className="sponsor__p">Consectetur adipiscing elit</p>
                </div>
                <div className="sponsor__logo-item">
                  <div className="sponsor__logo-placeholder">LOGO 3</div>
                  <p className="sponsor__p">Nullam in dui mauris</p>
                </div>
              </div>
              
              <p className="sponsor__frame-text">
                Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}