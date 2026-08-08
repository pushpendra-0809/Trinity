// // import React from "react";
// // import "./HomePage.css";

// // function HomePage({ onStartInterview }) {
// //   // ================= SCROLL FUNCTION =================

// //   const scrollToSection = (id) => {
// //     const section = document.getElementById(id);

// //     if (section) {
// //       section.scrollIntoView({
// //         behavior: "smooth",
// //         block: "start",
// //       });

// //       // URL hash update
// //       window.history.replaceState(null, "", `#${id}`);
// //     }
// //   };

// //   // ================= HOME =================

// //   const goHome = () => {
// //     window.history.replaceState(null, "", window.location.pathname);

// //     window.scrollTo({
// //       top: 0,
// //       behavior: "smooth",
// //     });
// //   };

// //   return (
// //     <div className="home-page">

// //       {/* ================= AMBIENT GLOW ================= */}

// //       <div className="ambient-glow"></div>
// //       <div className="ambient-glow-secondary"></div>

// //       {/* ================= NAVBAR ================= */}

// //       <nav className="navbar">

// //         {/* LOGO */}

// //         <button
// //           className="nav-logo"
// //           onClick={goHome}
// //           type="button"
// //         >
// //           TRINITY
// //         </button>

// //         {/* NAV LINKS */}

// //         <div className="nav-links">

// //           <button
// //             type="button"
// //             onClick={() => scrollToSection("product")}
// //           >
// //             Product
// //           </button>

// //           <button
// //             type="button"
// //             onClick={() => scrollToSection("how-it-works")}
// //           >
// //             How it Works
// //           </button>

// //           <button
// //             type="button"
// //             onClick={() => scrollToSection("about")}
// //           >
// //             About
// //           </button>

// //           <button
// //             className="nav-button"
// //             type="button"
// //             onClick={onStartInterview}
// //           >
// //             Get Started
// //           </button>

// //         </div>
// //       </nav>


// //       {/* ================================================= */}
// //       {/* ================= HERO SECTION ================== */}
// //       {/* ================================================= */}

// //       <main className="hero">

// //         {/* BADGE */}

// //         <div className="hero-badge">
// //           <span className="badge-dot"></span>
// //           AI-POWERED INTERVIEW INTELLIGENCE
// //         </div>


// //         {/* HEADING */}

// //         <h1>
// //           Hire with
// //           <span> better questions.</span>
// //         </h1>


// //         {/* DESCRIPTION */}

// //         <p className="hero-description">
// //           Trinity uses AI-powered interview intelligence to help you
// //           ask smarter questions, understand candidates better, and make
// //           confident hiring decisions.
// //         </p>


// //         {/* BUTTONS */}

// //         <div className="hero-buttons">

// //           <button
// //             className="primary-button"
// //             type="button"
// //             onClick={onStartInterview}
// //           >
// //             Start Interview
// //             <span>→</span>
// //           </button>


// //           <button
// //             className="secondary-button"
// //             type="button"
// //             onClick={() => scrollToSection("product")}
// //           >
// //             Explore Trinity
// //             <span>↗</span>
// //           </button>

// //         </div>


// //         {/* TAGLINE */}

// //         <div className="tagline">
// //           <span>BUILT TO QUESTION</span>
// //           <span>·</span>
// //           <span>DESIGNED TO KNOW</span>
// //         </div>

// //       </main>


// //       {/* ================================================= */}
// //       {/* ================= PRODUCT SECTION =============== */}
// //       {/* ================================================= */}

// //       <section
// //         id="product"
// //         className="content-section product-section"
// //       >

// //         <div className="section-badge">
// //           THE TRINITY APPROACH
// //         </div>

// //         <h2>
// //           Better interviews.
// //           <span> Better decisions.</span>
// //         </h2>

// //         <p className="section-description">
// //           Trinity brings intelligence into every stage of the interview
// //           process, helping interviewers focus on what actually matters.
// //         </p>


// //         <div className="feature-grid">

// //           {/* CARD 1 */}

// //           <div className="feature-card">

// //             <div className="feature-number">
// //               01
// //             </div>

// //             <h3>
// //               Smarter Questions
// //             </h3>

// //             <p>
// //               Ask focused questions designed to reveal a candidate's
// //               real capabilities, experience, and thinking.
// //             </p>

// //           </div>


// //           {/* CARD 2 */}

// //           <div className="feature-card">

// //             <div className="feature-number">
// //               02
// //             </div>

// //             <h3>
// //               Deeper Understanding
// //             </h3>

// //             <p>
// //               Move beyond surface-level answers and understand what
// //               makes each candidate uniquely qualified.
// //             </p>

// //           </div>


// //           {/* CARD 3 */}

// //           <div className="feature-card">

// //             <div className="feature-number">
// //               03
// //             </div>

// //             <h3>
// //               Confident Decisions
// //             </h3>

// //             <p>
// //               Turn interview insights into clearer and more informed
// //               hiring decisions.
// //             </p>

// //           </div>

// //         </div>

// //       </section>


// //       {/* ================================================= */}
// //       {/* ============== HOW IT WORKS SECTION ============== */}
// //       {/* ================================================= */}

// //       <section
// //         id="how-it-works"
// //         className="content-section how-section"
// //       >

// //         <div className="section-badge">
// //           HOW TRINITY WORKS
// //         </div>

// //         <h2>
// //           From conversation
// //           <span> to clarity.</span>
// //         </h2>

// //         <p className="section-description">
// //           A simple interview workflow designed to help you ask,
// //           understand, and decide better.
// //         </p>


// //         <div className="steps-container">

// //           {/* STEP 1 */}

// //           <div className="step">

// //             <div className="step-number">
// //               01
// //             </div>

// //             <div>
// //               <h3>
// //                 Set up your interview
// //               </h3>

// //               <p>
// //                 Define the candidate, role, and interview context
// //                 before you begin.
// //               </p>
// //             </div>

// //           </div>


// //           {/* STEP 2 */}

// //           <div className="step">

// //             <div className="step-number">
// //               02
// //             </div>

// //             <div>
// //               <h3>
// //                 Ask better questions
// //               </h3>

// //               <p>
// //                 Trinity helps structure the interview around
// //                 meaningful questions and useful signals.
// //               </p>
// //             </div>

// //           </div>


// //           {/* STEP 3 */}

// //           <div className="step">

// //             <div className="step-number">
// //               03
// //             </div>

// //             <div>
// //               <h3>
// //                 Understand the candidate
// //               </h3>

// //               <p>
// //                 Focus on the answers that reveal experience,
// //                 reasoning, and potential.
// //               </p>
// //             </div>

// //           </div>


// //           {/* STEP 4 */}

// //           <div className="step">

// //             <div className="step-number">
// //               04
// //             </div>

// //             <div>
// //               <h3>
// //                 Make the decision
// //               </h3>

// //               <p>
// //                 Use the interview insights to make a confident
// //                 hiring decision.
// //               </p>
// //             </div>

// //           </div>

// //         </div>

// //       </section>


// //       {/* ================================================= */}
// //       {/* ================= ABOUT SECTION ================= */}
// //       {/* ================================================= */}

// //       <section
// //         id="about"
// //         className="content-section about-section"
// //       >

// //         <div className="about-card">

// //           <div className="section-badge">
// //             ABOUT TRINITY
// //           </div>

// //           <h2>
// //             Because every hire
// //             <span> matters.</span>
// //           </h2>

// //           <p className="section-description">
// //             Trinity exists to make interviews more thoughtful,
// //             structured, and meaningful.
// //           </p>

// //           <p className="about-text">
// //             Hiring is not just about finding someone who can do the job.
// //             It is about understanding people, asking the right questions,
// //             and making decisions that shape teams and businesses.
// //           </p>

// //           <div className="about-tagline">
// //             TRINITY
// //           </div>

// //         </div>

// //       </section>


// //       {/* ================================================= */}
// //       {/* ================= FINAL CTA ===================== */}
// //       {/* ================================================= */}

// //       <section className="final-cta">

// //         <div className="section-badge">
// //           READY TO BEGIN?
// //         </div>

// //         <h2>
// //           Start asking
// //           <span> better questions.</span>
// //         </h2>

// //         <p>
// //           Build interviews that reveal more.
// //         </p>

// //         <button
// //           className="primary-button"
// //           type="button"
// //           onClick={onStartInterview}
// //         >
// //           Start Interview
// //           <span>→</span>
// //         </button>

// //       </section>


// //       {/* ================= FOOTER ================= */}

// //       <footer className="footer">

// //         <div className="footer-logo">
// //           TRINITY
// //         </div>

// //         <div>
// //           Built to Question · Designed to Know
// //         </div>

// //         <div>
// //           © 2026 Trinity
// //         </div>

// //       </footer>

// //     </div>
// //   );
// // }

// // export default HomePage;

// import React from "react";
// import "./HomePage.css";

// function HomePage({ onStartInterview }) {

//   // ================= SCROLL FUNCTION =================

//   const scrollToSection = (id) => {
//     const section = document.getElementById(id);

//     if (section) {
//       section.scrollIntoView({
//         behavior: "smooth",
//         block: "start",
//       });

//       window.history.replaceState(null, "", `#${id}`);
//     }
//   };

//   // ================= HOME =================

//   const goHome = () => {
//     window.history.replaceState(
//       null,
//       "",
//       window.location.pathname
//     );

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   return (
//     <div className="home-page">

//       {/* ================================================= */}
//       {/* ================= NAVBAR ======================== */}
//       {/* ================================================= */}

//       <nav className="navbar">

//         {/* LOGO */}

//         <button
//           className="nav-logo"
//           onClick={goHome}
//           type="button"
//         >
//           ✦TRINITY
//         </button>


//         {/* NAV LINKS */}

//         <div className="nav-links">

//           <button
//             type="button"
//             onClick={() => scrollToSection("product")}
//           >
//             Product
//           </button>

//           <button
//             type="button"
//             onClick={() => scrollToSection("how-it-works")}
//           >
//             How it Works
//           </button>

//           <button
//             type="button"
//             onClick={() => scrollToSection("about")}
//           >
//             About
//           </button>

//           <button
//             className="get-started"
//             type="button"
//             onClick={onStartInterview}
//           >
//             Get Started
//           </button>

//         </div>

//       </nav>


//       {/* ================================================= */}
//       {/* ================= HERO SECTION ================== */}
//       {/* ================================================= */}

//       <main className="hero">

//         {/* EYEBROW */}

//         <div className="hero-eyebrow">
//           AI-POWERED INTERVIEW INTELLIGENCE
//         </div>


//         {/* MAIN HEADING */}

//         <h1 className="hero-title">
//           Hire with{" "}
//           <span className="gradient-text">
//             better questions.
//           </span>
//         </h1>


//         {/* DESCRIPTION */}

//         <p className="hero-description">
//           Trinity uses AI-powered interview intelligence to help you
//           ask smarter questions, understand candidates better, and make
//           confident hiring decisions.
//         </p>


//         {/* CTA */}

//         <div className="hero-actions">

//           <button
//             className="primary-btn"
//             type="button"
//             onClick={onStartInterview}
//           >
//             Start Interview
//             <span>→</span>
//           </button>

//         </div>


//         {/* TAGLINE */}

//         <div className="hero-tagline">
//           BUILT TO QUESTION · DESIGNED TO KNOW
//         </div>

//       </main>


//       {/* ================================================= */}
//       {/* ================= PRODUCT SECTION =============== */}
//       {/* ================================================= */}

//       <section
//         id="product"
//         className="product-section"
//       >

//         <div className="section-kicker">
//           THE TRINITY APPROACH
//         </div>


//         <h2 className="section-title">
//           Better interviews.
//           <br />
//           Better decisions.
//         </h2>


//         <div className="feature-grid">

//           {/* CARD 1 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               01
//             </div>

//             <h3>
//               Smarter Questions
//             </h3>

//             <p>
//               Ask focused questions designed to reveal a
//               candidate's real capabilities, experience,
//               and thinking.
//             </p>

//           </div>


//           {/* CARD 2 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               02
//             </div>

//             <h3>
//               Deeper Understanding
//             </h3>

//             <p>
//               Move beyond surface-level answers and
//               understand what makes each candidate
//               uniquely qualified.
//             </p>

//           </div>


//           {/* CARD 3 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               03
//             </div>

//             <h3>
//               Confident Decisions
//             </h3>

//             <p>
//               Turn interview insights into clearer and
//               more informed hiring decisions.
//             </p>

//           </div>

//         </div>

//       </section>


//       {/* ================================================= */}
//       {/* ============== HOW IT WORKS SECTION ============== */}
//       {/* ================================================= */}

//       <section
//         id="how-it-works"
//         className="how-section"
//       >

//         <div className="section-kicker">
//           HOW TRINITY WORKS
//         </div>


//         <h2 className="section-title">
//           From conversation
//           <br />
//           to clarity.
//         </h2>


//         <div className="feature-grid">

//           {/* STEP 1 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               01
//             </div>

//             <h3>
//               Set up your interview
//             </h3>

//             <p>
//               Define the candidate, role, and interview
//               context before you begin.
//             </p>

//           </div>


//           {/* STEP 2 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               02
//             </div>

//             <h3>
//               Ask better questions
//             </h3>

//             <p>
//               Trinity helps structure the interview around
//               meaningful questions and useful signals.
//             </p>

//           </div>


//           {/* STEP 3 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               03
//             </div>

//             <h3>
//               Understand the candidate
//             </h3>

//             <p>
//               Focus on the answers that reveal experience,
//               reasoning, and potential.
//             </p>

//           </div>


//           {/* STEP 4 */}

//           <div className="feature-card">

//             <div className="feature-number">
//               04
//             </div>

//             <h3>
//               Make the decision
//             </h3>

//             <p>
//               Use the interview insights to make a
//               confident hiring decision.
//             </p>

//           </div>

//         </div>

//       </section>


//       {/* ================================================= */}
//       {/* ================= ABOUT SECTION ================= */}
//       {/* ================================================= */}

//       <section
//         id="about"
//         className="about-section"
//       >

//         <div className="section-kicker">
//           ABOUT TRINITY
//         </div>


//         <h2 className="section-title">
//           Because every hire
//           <br />
//           matters.
//         </h2>


//         <p className="hero-description">
//           Trinity exists to make interviews more thoughtful,
//           structured, and meaningful.
//           <br />
//           <br />
//           Hiring is not just about finding someone who can
//           do the job. It is about understanding people,
//           asking the right questions, and making decisions
//           that shape teams and businesses.
//         </p>

//       </section>


//       {/* ================================================= */}
//       {/* ================= FINAL CTA ===================== */}
//       {/* ================================================= */}

//       <section className="about-section">

//         <div className="section-kicker">
//           READY TO BEGIN?
//         </div>


//         <h2 className="section-title">
//           Start asking
//           <br />
//           better questions.
//         </h2>


//         <div className="hero-actions">

//           <button
//             className="primary-btn"
//             type="button"
//             onClick={onStartInterview}
//           >
//             Start Interview
//             <span>→</span>
//           </button>

//         </div>

//       </section>


//       {/* ================================================= */}
//       {/* ================= FOOTER ======================== */}
//       {/* ================================================= */}

//       <footer
//         style={{
//           padding: "50px 8vw",
//           borderTop: "1px solid rgba(255,255,255,0.05)",
//           color: "rgba(190,202,225,0.55)",
//           fontFamily: "Arial, sans-serif",
//           fontSize: "13px",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           gap: "20px",
//           flexWrap: "wrap",
//         }}
//       >

//         <div>
//           ✦ TRINITY
//         </div>

//         <div>
//           Built to Question · Designed to Know
//         </div>

//         <div>
//           © 2026 Trinity
//         </div>

//       </footer>

//     </div>
//   );
// }

// export default HomePage;

import { useNavigate } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  // ================= SCROLL FUNCTION =================

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", `#${id}`);
    }
  };

  // ================= HOME =================

  const goHome = () => {
    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= START INTERVIEW =================

  const handleStartInterview = () => {
    navigate("/interview/setup");
  };

  return (
    <div className="home-page">

      {/* ================================================= */}
      {/* ================= NAVBAR ======================== */}
      {/* ================================================= */}

      <nav className="navbar">

        {/* LOGO */}

        <button
          className="nav-logo"
          onClick={goHome}
          type="button"
        >
          ✦TRINITY
        </button>

        {/* NAV LINKS */}

        <div className="nav-links">

          <button
            type="button"
            onClick={() => scrollToSection("product")}
          >
            Product
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
          >
            How it Works
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("about")}
          >
            About
          </button>

          <button
            className="get-started"
            type="button"
            onClick={handleStartInterview}
          >
            Get Started
          </button>

        </div>

      </nav>


      {/* ================================================= */}
      {/* ================= HERO SECTION ================== */}
      {/* ================================================= */}

      <main className="hero">

        {/* EYEBROW */}

        <div className="hero-eyebrow">
          AI-POWERED INTERVIEW INTELLIGENCE
        </div>

        {/* MAIN HEADING */}

        <h1 className="hero-title">
          Hire with{" "}
          <span className="gradient-text">
            better questions.
          </span>
        </h1>

        {/* DESCRIPTION */}

        <p className="hero-description">
          Trinity uses AI-powered interview intelligence to help you
          ask smarter questions, understand candidates better, and make
          confident hiring decisions.
        </p>

        {/* CTA */}

        <div className="hero-actions">
          <button
            className="primary-btn"
            type="button"
            onClick={handleStartInterview}
          >
            Start Interview
            <span>→</span>
          </button>
        </div>

        {/* TAGLINE */}

        <div className="hero-tagline">
          BUILT TO QUESTION · DESIGNED TO KNOW
        </div>

      </main>


      {/* ================================================= */}
      {/* ================= PRODUCT SECTION =============== */}
      {/* ================================================= */}

      <section
        id="product"
        className="product-section"
      >

        <div className="section-kicker">
          THE TRINITY APPROACH
        </div>

        <h2 className="section-title">
          Better interviews.
          <br />
          Better decisions.
        </h2>

        <div className="feature-grid">

          {/* CARD 1 */}

          <div className="feature-card">

            <div className="feature-number">
              01
            </div>

            <h3>
              Smarter Questions
            </h3>

            <p>
              Ask focused questions designed to reveal a
              candidate's real capabilities, experience,
              and thinking.
            </p>

          </div>


          {/* CARD 2 */}

          <div className="feature-card">

            <div className="feature-number">
              02
            </div>

            <h3>
              Deeper Understanding
            </h3>

            <p>
              Move beyond surface-level answers and understand
              what makes each candidate uniquely qualified.
            </p>

          </div>


          {/* CARD 3 */}

          <div className="feature-card">

            <div className="feature-number">
              03
            </div>

            <h3>
              Confident Decisions
            </h3>

            <p>
              Turn interview insights into clearer and more
              informed hiring decisions.
            </p>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* ============== HOW IT WORKS SECTION ============== */}
      {/* ================================================= */}

      <section
        id="how-it-works"
        className="how-section"
      >

        <div className="section-kicker">
          HOW TRINITY WORKS
        </div>

        <h2 className="section-title">
          From conversation
          <br />
          to clarity.
        </h2>

        <div className="feature-grid">

          {/* STEP 1 */}

          <div className="feature-card">

            <div className="feature-number">
              01
            </div>

            <h3>
              Set up your interview
            </h3>

            <p>
              Define the candidate, role, and interview
              context before you begin.
            </p>

          </div>


          {/* STEP 2 */}

          <div className="feature-card">

            <div className="feature-number">
              02
            </div>

            <h3>
              Ask better questions
            </h3>

            <p>
              Trinity helps structure the interview around
              meaningful questions and useful signals.
            </p>

          </div>


          {/* STEP 3 */}

          <div className="feature-card">

            <div className="feature-number">
              03
            </div>

            <h3>
              Understand the candidate
            </h3>

            <p>
              Focus on the answers that reveal experience,
              reasoning, and potential.
            </p>

          </div>


          {/* STEP 4 */}

          <div className="feature-card">

            <div className="feature-number">
              04
            </div>

            <h3>
              Make the decision
            </h3>

            <p>
              Use the interview insights to make a confident
              hiring decision.
            </p>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* ================= ABOUT SECTION ================= */}
      {/* ================================================= */}

      <section
        id="about"
        className="about-section"
      >

        <div className="section-kicker">
          ABOUT TRINITY
        </div>

        <h2 className="section-title">
          Because every hire
          <br />
          matters.
        </h2>

        <p className="hero-description">

          Trinity exists to make interviews more thoughtful,
          structured, and meaningful.

          <br />
          <br />

          Hiring is not just about finding someone who can
          do the job. It is about understanding people,
          asking the right questions, and making decisions
          that shape teams and businesses.

        </p>

      </section>


      {/* ================================================= */}
      {/* ================= FINAL CTA ===================== */}
      {/* ================================================= */}

      <section className="about-section">

        <div className="section-kicker">
          READY TO BEGIN?
        </div>

        <h2 className="section-title">
          Start asking
          <br />
          better questions.
        </h2>

        <div className="hero-actions">

          <button
            className="primary-btn"
            type="button"
            onClick={handleStartInterview}
          >
            Start Interview
            <span>→</span>
          </button>

        </div>

      </section>


      {/* ================================================= */}
      {/* ================= FOOTER ======================== */}
      {/* ================================================= */}

      <footer className="site-footer">

        <div>
          ✦ TRINITY
        </div>

        <div>
          Built to Question · Designed to Know
        </div>

        <div>
          © 2026 Trinity
        </div>

      </footer>

    </div>
  );
}

export default HomePage;

