import React, { useState } from "react";
import "./sponsor.css";
import currsponsors from "../../../public/sponsor/currsponsors";
import prevsponsors from "../../../public/sponsor/prevsponsors";

export default function Sponsor() {
  const [activeTab, setActiveTab] = useState("current");
  
  const renderPrevSponsors = () => {
    return (
      <div className="sponsor__logos">
        {prevsponsors.map((item, index) => (
          <div className="sponsor__logo-item" key={index}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <img 
                src={item.img} 
                alt="Sponsor Logo" 
                className="sponsor__logo-placeholder"
              />
            </a>
          </div>
        ))}
      </div>
    );
  };

  const renderCurrSponsors = () => {
    return (
      <>
        {currsponsors.map((category, index) => (
          <div key={index} className="sponsor__category">
            <h3 className="sponsor__category-title">{category.title}</h3>
            <div className="sponsor__logos">
              {category.sponsors.map((sponsor, idx) => (
                <div className="sponsor__logo-item" key={idx}>
                  <a href={sponsor.src} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={sponsor.img} 
                      alt="Sponsor Logo" 
                      className="sponsor__logo-placeholder"
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };
  
  return (
    <section className="sponsor" id="sponsor">
      <img className="sponsor__left-streak" src="/assets/AboutUsLeftStreak.svg" alt="Left streak" />
      <img className="sponsor__right-streak" src="/assets/AboutUsRightStreak.svg" alt="Right streak" />
      <div className="sponsor__outer-frame"></div>
      <div className="sponsor__content">
        <div className="sponsor__title-container">
          <h1 className="sponsor__title title-header-text">SPONSORS</h1>
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
              
              {activeTab === "current" ? renderCurrSponsors() : renderPrevSponsors()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}