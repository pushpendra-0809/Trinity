import React from "react";
import "./HomePage.css";


function HomePage() {
  return (
    <div className="home-page">
      {/* Ambient background glow */}
      <div className="ambient-glow"></div>

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div className="nav-logo">
          TRINITY
        </div>

        <div className="nav-links">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#about">About</a>

          <button className="nav-button">
            Get Started
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <main className="hero">
        {/* Badge */}
        <div className="hero-badge">
          AI-POWERED INTERVIEW INTELLIGENCE
        </div>

        {/* Main heading */}
        <h1>
          Hire with
          <span> better questions.</span>
        </h1>

        {/* Description */}
        <p className="hero-description">
          Trinity uses AI-powered interview intelligence to help you
          ask smarter questions, understand candidates better, and make
          confident hiring decisions.
        </p>

        {/* Buttons */}
        <div className="hero-buttons">
          <button className="primary-button">
            Start Interview
            <span>→</span>
          </button>

          <button className="secondary-button">
            Explore Trinity
          </button>
        </div>

        {/* Tagline */}
        <div className="tagline">
          BUILT TO QUESTION&nbsp;&nbsp;·&nbsp;&nbsp;DESIGNED TO KNOW
        </div>
      </main>
    </div>
  );
}

export default HomePage;