import React, { useEffect, useState } from "react";
import "./stats.css";

const StatsPage = () => {
    const [counts, setCounts] = useState({
        applications: 0,
        colleges: 0,
        teams: 0,
        hackers: 0,
    });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Animate the counters
        const duration = 2000; // 2 seconds for the animation
        const interval = 20; // Update every 20ms
        const steps = duration / interval;

        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            setCounts({
                applications: Math.floor(progress * 1700),
                colleges: Math.floor(progress * 100),
                teams: Math.floor(progress * 40),
                hackers: Math.floor(progress * 150),
            });

            if (currentStep >= steps) {
                clearInterval(timer);
                setCounts({
                    applications: 1700,
                    colleges: 100,
                    teams: 40,
                    hackers: 150,
                });
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Initial check
        handleResize();

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <section className="stats">
            <img
                src="/assets/AboutUsRightStreak.svg"
                className="AboutUsRightStreak"
            />
            <img
                src="/assets/AboutUsLeftStreak.svg"
                className="AboutUsLeftStreak"
            />
            <div className="stats-container">
                <div className="title-container">
                    <h1 className="title">STATS</h1>
                </div>

                <div className="stats-grid">
                    <img
                        src={
                            isMobile
                                ? "/assets/top-left-mob.svg"
                                : "/assets/top-left.svg"
                        }
                        alt="connector"
                        className="connector top-left-connector"
                    />
                    <img
                        src={
                            isMobile
                                ? "/assets/top-right-mob.svg"
                                : "/assets/top-right.svg"
                        }
                        alt="connector"
                        className="connector top-right-connector"
                    />
                    <img
                        src={
                            isMobile
                                ? "/assets/bottom-left-mob.svg"
                                : "/assets/bottom-left.svg"
                        }
                        alt="connector"
                        className="connector bottom-left-connector"
                    />
                    <img
                        src={
                            isMobile
                                ? "/assets/bottom-right-mob.svg"
                                : "/assets/bottom-right.svg"
                        }
                        alt="connector"
                        className="connector bottom-right-connector"
                    />

                    {/* Top Row - Colleges and Applications */}
                    <div className="stat-row top-row">
                        <div className="stat-box">
                            <div className="stat-value">
                                <div className="icon document-icon"></div>
                                {counts.applications}+
                            </div>
                            <div className="stat-label">APPLICATIONS</div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-value">
                                {counts.colleges}+
                                <div className="icon college-icon"></div>
                            </div>
                            <div className="stat-label">COLLEGES</div>
                        </div>
                    </div>

                    {/* Middle - Central Badge with rotating gears */}
                    <div className="central-badge-container">
                        <div className="central-badge">
                            <div className="rotating-gears">
                                {/* Grey Gear - Outermost */}
                                <div className="grey-gear rotate-clockwise"></div>
                                {/* Red Circle */}
                                <div className="red-circle-outer"></div>
                                {/* Grey Circle */}
                                <div className="grey-circle"></div>
                                {/* Red Gear */}
                                <div className="red-gear rotate-counter-clockwise"></div>
                                {/* Inner Red Circle */}
                                <div className="red-circle-inner"></div>
                                {/* Gun Icon */}
                                <div className="gun-icon"></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row - Teams and Hackers */}
                    <div className="stat-row bottom-row">
                        <div className="stat-box">
                            <div className="stat-value">
                                <div className="icon team-icon"></div>
                                {counts.teams}+
                            </div>
                            <div className="stat-label">TEAMS</div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-value">
                                {counts.hackers}+
                                <div className="icon hacker-icon"></div>
                            </div>
                            <div className="stat-label">HACKERS</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsPage;
