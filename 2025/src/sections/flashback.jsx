import "./flashback.css";

const FlashBack = () => {
  return (
    <section className="flashback">
      <img src="/assets/AboutUsRightStreak.svg" className="AboutUsRightStreak" />
      <img src="/assets/AboutUsLeftStreak.svg" className="AboutUsLeftStreak" />

      <header className="flashback-header">
        <h1 className="flashback-header-text">FLASHBACK</h1>
      </header>

      <div className="flashback-video">
        <iframe
          width="610"
          height="385"
          src="https://www.youtube.com/embed/MsIwzZziLfs"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
};

export default FlashBack;
