import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer>
      <div className="outlaws">
        <img src="./FOOTER/outlaws.svg" alt="Outlaws For Life" />
      </div>
      <div className="everything">
        <div className="M">
          <img src="./FOOTER/MATURE_17.svg" alt="MATURE" />
        </div>
        <div className="logo">
          <div className="save-the-date">SAVE THE DATE</div>
          <div className="april-dates">APRIL 12 | 13</div>
          <div className="register-now">REGISTER NOW</div>
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
          <p>Made with <span>🤍;</span> by <a href="https://www.kjssecodecell.com/" target="_blank" rel="noopener noreferrer">KJSCE CodeCell</a> </p>
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