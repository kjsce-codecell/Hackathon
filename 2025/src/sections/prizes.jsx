import React from 'react';
import './prizes.css';

const Prizes = () => {
    return (
        <section className="prizes-section" id="prizes">
            <img src="/assets/AboutUsLeftStreak.svg" className="PrizesLeftStreak" />
            <img src="/assets/AboutUsRightStreak.svg" className="PrizesRightStreak" />
            <div className="prizes-container">
                <header className="prizes-header">
                    <h1>PRIZES</h1>
                </header>
                <div className="prizes-grid">
                    <div className="prize-card">
                        <div className="prize-category">
                            Cybersecurity
                        </div>
                        <div className="prize-image-placeholder">

                        </div>
                        <div className="prize-position">Winner</div>
                    </div>
                    <div className="prize-card">
                        <div className="prize-category">
                            Cybersecurity
                        </div>
                        <div className="prize-image-placeholder">
                            {/* Prize image or icon can be added here */}
                        </div>
                        <div className="prize-position">Runner-up</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Prizes;
