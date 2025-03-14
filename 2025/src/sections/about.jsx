import "./about.css";

const About = () => {
  return (
    <section className="about">
      <img src="/assets/AboutUsRightStreak.svg" className="AboutUsRightStreak"></img>
      <img src="/assets/AboutUsLeftStreak.svg" className="AboutUsLeftStreak"></img>

        <header className="about-header">
          <h1 className="about-header-text">ABOUT</h1>
        </header>
        <div className="about-content">
          <p className="about-content-text">
            <b>Listen up, partner.</b><br />
            A 24-hour hackin’ showdown is comin’ up, and it ain't for the faint of heart. No screens between ya, no hiding behind a keyboard—this here’s the real deal, face to face.<br /><br />

            Good grub? Check.<br />
            A place to rest yer boots? Got it.<br />
            Games, fun, and a heap of prizes? You bet.<br /><br />  

            Round up yer crew, put them brains to work, and cook up somethin’ mighty impressive. Ain’t no better time to scheme, dream, and build somethin’ legendary.          
          </p>
          {/* <img src="/assets/desktop_prizes.png" className="about-border"></img> */}
        </div>
    </section>
  );
};

export default About;