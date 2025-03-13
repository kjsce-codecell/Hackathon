import React, { useEffect, useState, useCallback } from 'react';
import './prizes.css';

const TextScramble = ({ text }) => {
    const [displayText, setDisplayText] = useState(text);
    const [isScrambling, setIsScrambling] = useState(false);
    const characters = '!<>-_\\/[]{}—=+*^?#';

    const scramble = useCallback(() => {
        let iteration = 0;
        const maxIterations = 10;
        
        setIsScrambling(true);
        
        const interval = setInterval(() => {
            setDisplayText(current => {
                return text.split('')
                    .map((char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return characters[Math.floor(Math.random() * characters.length)];
                    })
                    .join('');
            });

            iteration += 1/3;

            if (iteration >= text.length + 1) {
                clearInterval(interval);
                setDisplayText(text);
                setIsScrambling(false);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [text]);

    const handleMouseEnter = () => {
        if (!isScrambling) {
            scramble();
        }
    };

    // Initial scramble on mount
    useEffect(() => {
        const timeout = setTimeout(scramble, 500);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="scramble-text" onMouseEnter={handleMouseEnter}>
            {displayText}
        </div>
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
                        <div className="prize-category">
                            <TextScramble text="CYBERSECURITY" />
                        </div>
                        <div className="prize-image-placeholder">
                        </div>
                        <div className="prize-position">Winner</div>
                    </div>
                    <div className="prize-card">
                        <div className="prize-category">
                            <TextScramble text="CYBERSECURITY" />
                        </div>
                        <div className="prize-image-placeholder">
                        </div>
                        <div className="prize-position">Runner-up</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Prizes;
