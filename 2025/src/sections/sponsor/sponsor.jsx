import React from "react";
import "./sponsor.css";

export default function Sponsor() {
  return (
    <section className="sponsor" id="sponsor">
      <div className="sponsor__outer-frame"></div>
      <div className="sponsor__content">
        <div className="sponsor__title-container">
          <div className="sponsor__left-streak"></div>
          <h1 className="sponsor__title">SPONSOR</h1>
          <div className="sponsor__right-streak"></div>
        </div>
        
        <div className="sponsor__container">
          <div className="sponsor__select-container">
            <select className="sponsor__select">
              <option>Select</option>
              <option>Gold Sponsors</option>
              <option>Silver Sponsors</option>
              <option>Bronze Sponsors</option>
              <option>Partners</option>
            </select>
          </div>
          
          <div className="sponsor__frame-container">
            <div className="sponsor__frame-border sponsor__frame-border--top"></div>
            <div className="sponsor__frame-border sponsor__frame-border--right"></div>
            <div className="sponsor__frame-border sponsor__frame-border--bottom"></div>
            <div className="sponsor__frame-border sponsor__frame-border--left"></div>
            
            <div className="sponsor__frame">
              <h2 className="sponsor__frame-title">Our Sponsors</h2>
              
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
          
          <div className="sponsor__scroll-indicator">
            <span>↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}