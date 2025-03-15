import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import "./stats.css";

const StatsPage = () => {
  const [counts, setCounts] = useState({
    applications: 0,
    colleges: 0,
    teams: 0,
    hackers: 0,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);
  const controls = useAnimation();
  const [isInView, setIsInView] = useState(false);
  const [startRotation, setStartRotation] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          animateSequence();
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasAnimated]);

  const animateSequence = async () => {
    setShowHeader(true);

    // Start everything almost simultaneously for a more impactful entrance
    setStartRotation(true);
    await controls.start("showRings");
    await controls.start("showConnectors");

    // Reduce delay before showing numbers
    setTimeout(() => {
      setShowNumbers(true);
      startCountAnimation();
    }, 50); // Reduced from 100
  };

  const startCountAnimation = () => {
    const duration = 1000; // Reduced from 1500
    const interval = 16;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      const easeOutProgress = 1 - Math.pow(1 - progress, 3);

      setCounts({
        applications: Math.floor(easeOutProgress * 1700),
        colleges: Math.floor(easeOutProgress * 100),
        teams: Math.floor(easeOutProgress * 40),
        hackers: Math.floor(easeOutProgress * 150),
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
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 769);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const numberVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8, // Reduced from 1.2
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  };

  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4, // Reduced from 0.6
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      className={`stats ${startRotation ? "start-rotation" : ""}`}
      ref={sectionRef}
      id="stats"
    >
      <img
        src="/assets/AboutUsRightStreak.svg"
        className="AboutUsRightStreak"
      />
      <img src="/assets/AboutUsLeftStreak.svg" className="AboutUsLeftStreak" />
      <div className="stats-container">
        <motion.header
          className="title-header"
          initial="hidden"
          animate={showHeader ? "visible" : "hidden"}
          variants={headerVariants}
        >
          <h1 className="title-header-text">STATS</h1>
        </motion.header>

        <div className="stats-grid">
          {["top-left", "top-right", "bottom-left", "bottom-right"].map(
            (position) => (
              <motion.img
                key={position}
                src={
                  isMobile
                    ? `/assets/${position}-mob.svg`
                    : `/assets/${position}.svg`
                }
                alt="connector"
                className={`connector ${position}-connector`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={controls}
                variants={{
                  showConnectors: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      duration: 0.8, // Reduced from 1.5
                      ease: [0.34, 1.56, 0.64, 1],
                    },
                  },
                }}
              />
            )
          )}

          <motion.div
            className="stat-row top-row"
            initial={{ opacity: 0 }}
            animate={showNumbers ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="stat-box">
              <div className="stat-value">
                <div className="icon document-icon"></div>
                <motion.span
                  className="stat-number"
                  initial="hidden"
                  animate={showNumbers ? "visible" : "hidden"}
                  variants={numberVariants}
                >
                  {counts.applications}+
                </motion.span>
              </div>
              <div className="stat-label">APPLICATIONS</div>
            </div>

            <div className="stat-box">
              <div className="stat-value">
                <motion.span
                  className="stat-number"
                  initial="hidden"
                  animate={showNumbers ? "visible" : "hidden"}
                  variants={numberVariants}
                >
                  {counts.colleges}+
                </motion.span>
                <div className="icon college-icon"></div>
              </div>
              <div className="stat-label">COLLEGES</div>
            </div>
          </motion.div>

          <div className="central-badge-container">
            <div className="central-badge">
              <div className="rotating-gears">
                {/* Render rings first */}
                {[
                  "grey-gear",
                  "red-circle-outer",
                  "grey-circle",
                  "red-gear",
                  "red-circle-inner",
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    className={`${item}`}
                    initial={{ opacity: 0 }}
                    animate={controls}
                    variants={{
                      showRings: {
                        opacity: 1,
                        transition: {
                          delay: index * 0.2, // Reduced from 0.4
                        },
                      },
                    }}
                  />
                ))}
                {/* Render gun separately with longer delay */}
                <motion.div
                  className="gun-icon"
                  initial={{ opacity: 0 }}
                  animate={controls}
                  variants={{
                    showRings: {
                      opacity: 1,
                      transition: {
                        delay: 1, // Reduced from 2
                        duration: 0.8, // Reduced from 1.2
                        ease: [0.34, 1.56, 0.64, 1],
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <motion.div
            className="stat-row bottom-row"
            initial={{ opacity: 0 }}
            animate={showNumbers ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="stat-box">
              <div className="stat-value">
                <div className="icon team-icon"></div>
                <motion.span
                  className="stat-number"
                  initial="hidden"
                  animate={showNumbers ? "visible" : "hidden"}
                  variants={numberVariants}
                >
                  {counts.teams}+
                </motion.span>
              </div>
              <div className="stat-label">TEAMS</div>
            </div>

            <div className="stat-box">
              <div className="stat-value">
                <motion.span
                  className="stat-number"
                  initial="hidden"
                  animate={showNumbers ? "visible" : "hidden"}
                  variants={numberVariants}
                >
                  {counts.hackers}+
                </motion.span>
                <div className="icon hacker-icon"></div>
              </div>
              <div className="stat-label">HACKERS</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StatsPage;
