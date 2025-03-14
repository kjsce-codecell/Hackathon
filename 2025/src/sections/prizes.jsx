import React, { useState, useEffect, useCallback } from 'react';
import './prizes.css';

const ScrambleText = ({ text }) => {
    const [scrambledText, setScrambledText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    const scramble = useCallback(() => {
        let iterations = 0;
        const maxIterations = 10;
        const interval = setInterval(() => {
            setScrambledText(prev => 
                text.split('').map((char, index) => {
                    if (char === ' ') return ' ';
                    if (iterations > index) return char;
                    return characters[Math.floor(Math.random() * characters.length)];
                }).join('')
            );
            
            iterations += 1/3;
            if (iterations >= maxIterations) {
                clearInterval(interval);
                setScrambledText(text);
                setIsHovering(false);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [text]);

    useEffect(() => {
        if (isHovering) {
            return scramble();
        }
    }, [isHovering, scramble]);

    return (
        <span 
            className="scramble-text"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setScrambledText(text)}
        >
            {scrambledText}
        </span>
    );
};

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
                        <div className="prize-frame-border prize-frame-border--top"></div>
                        <div className="prize-frame-border prize-frame-border--right"></div>
                        <div className="prize-frame-border prize-frame-border--bottom"></div>
                        <div className="prize-frame-border prize-frame-border--left"></div>
                        <div className="prize-category">
                            <ScrambleText text="GAJSHIELD TRACK" />
                        </div>
                        <div className="prize-details">
                            <div className="prize-detail-item">
                                <div className="prize-info">
                                    <div className="prize-position">1ST PRIZE</div>
                                    <div className="prize-amount">₹50,000</div>
                                </div>
                                <div className="prize-image-container">
                                    <img src="/assets/1stprize.png" alt="1st Prize" className="prize-image" />
                                </div>
                            </div>
                            <div className="prize-detail-item">
                                <div className="prize-info">
                                    <div className="prize-position">Runner-up</div>
                                    <div className="prize-amount">₹30,000</div>
                                </div>
                                <div className="prize-image-container">
                                    <img src="/assets/2ndprize.png" alt="2nd Prize" className="prize-image" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="prize-card">
                        <div className="prize-frame-border prize-frame-border--top"></div>
                        <div className="prize-frame-border prize-frame-border--right"></div>
                        <div className="prize-frame-border prize-frame-border--bottom"></div>
                        <div className="prize-frame-border prize-frame-border--left"></div>
                        <div className="prize-category">
                            <ScrambleText text="MYSTERY TRACK" />
                        </div>
                        <div className="prize-details">
                            <div className="prize-detail-item">
                                <div className="prize-info">
                                    <div className="prize-position">1ST PRIZE</div>
                                    <div className="prize-amount">₹50,000</div>
                                </div>
                                <div className="prize-image-container">
                                    <img src="/assets/1stprize.png" alt="1st Prize" className="prize-image" />
                                </div>
                            </div>
                            <div className="prize-detail-item">
                                <div className="prize-info">
                                    <div className="prize-position">Runner-up</div>
                                    <div className="prize-amount">₹30,000</div>
                                </div>
                                <div className="prize-image-container">
                                    <img src="/assets/2ndprize.png" alt="2nd Prize" className="prize-image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Prizes;
