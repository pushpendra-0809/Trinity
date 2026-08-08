import React, { useState } from "react";
import SplashScreen from "./components/splashscreen";
import HomePage from "./components/HomePage";
import InterviewSetup from "./components/InterviewSetup";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // "home" or "setup" — controls which page is shown
  const [currentPage, setCurrentPage] = useState("home");

  // Data collected from the InterviewSetup form
  const [interviewData, setInterviewData] = useState(null);

  // Called when "Start Interview" / "Get Started" is clicked on HomePage
  const goToSetup = () => {
    setCurrentPage("setup");
  };

  // Called when "Back" is clicked on InterviewSetup
  const goToHome = () => {
    setCurrentPage("home");
  };

  // Called when the InterviewSetup form is submitted
  const handleStart = (data) => {
    setInterviewData(data);
    // TODO: once you build the actual interview screen,
    // switch currentPage to that here, e.g. setCurrentPage("interview");
    console.log("Interview setup data:", data);
  };

  return (
    <>
      {showSplash && (
        <SplashScreen
          onAnimationComplete={() => {
            setShowSplash(false);
          }}
        />
      )}

      {currentPage === "home" && (
        <HomePage onStartInterview={goToSetup} />
      )}

      {currentPage === "setup" && (
        <InterviewSetup
          onBack={goToHome}
          onStart={handleStart}
        />
      )}
    </>
  );
}