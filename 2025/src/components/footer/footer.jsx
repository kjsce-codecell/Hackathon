import React, { useEffect } from 'react';
import './footer.css';

const Footer = () => {
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
  return (
    <footer>
      <div className="outlaws">
        <div className="outlaws-image">
          <img src=".\FOOTER\no_outlaw-cropped.svg" alt="text" />
          <h1>Code The Journey</h1>
        </div>
      </div>
      <div className="everything">
        <div className="M">
          <img src="./FOOTER/MATURE_17.svg" alt="MATURE" />
        </div>
        <div className="logo">
          <div className="save-the-date">SAVE THE DATE</div>
          <div className="april-dates">APRIL 12 | 13</div>

          <div
            className="apply-button"
            data-hackathon-slug="gajshield-kjsse-hack8"
            data-button-theme="dark-inverted"
          ></div>
          <div className="social-icons">
            <a href="https://www.facebook.com/kjscecodecell/" target="_blank" rel="noopener noreferrer">
              <img src="./FOOTER/facebook.svg" alt="Facebook" style={{ width: '30px', height: '30px' }} />
            </a>
            <a href="https://x.com/kjsce_codecell" target="_blank" rel="noopener noreferrer">
              <img src="./FOOTER/twitter.svg" alt="Twitter" style={{ width: '30px', height: '30px' }} />
            </a>
            <a href="https://www.instagram.com/kjsce_codecell/" target="_blank" rel="noopener noreferrer">
              <img src="./FOOTER/instagram.svg" alt="Instagram" style={{ width: '30px', height: '30px' }} />
            </a>
            <a href="https://www.youtube.com/kjscecodecell" target="_blank" rel="noopener noreferrer">
              <img src="./FOOTER/youtube.svg" alt="YouTube" style={{ width: '30px', height: '30px' }} />
            </a>
            <a href="https://www.linkedin.com/company/kjscecodecell/" target="_blank" rel="noopener noreferrer">
              <img src="./FOOTER/linkedin.svg" alt="LinkedIn" style={{ width: '30px', height: '30px' }} />
            </a>
          </div>
          <p>Made with <span>🤍</span> by <a href="https://www.kjssecodecell.com/" target="_blank" rel="noopener noreferrer">KJSSE CodeCell</a> </p>
        </div>
        <div className="G">
          <img src="./FOOTER/MATURE_17.svg" alt="MATURE" />
        </div>
        <div className="cclogo">
          <img src="./FOOTER/Logo.svg" alt="cclogo" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;