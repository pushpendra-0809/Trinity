// import React, { useState } from "react";
// import SplashScreen from "./components/splashscreen";
// import HomePage from "./components/HomePage";
// import InterviewSetup from "./components/InterviewSetup";

// export default function App() {
//   const [showSplash, setShowSplash] = useState(true);

//   // "home" or "setup" — controls which page is shown
//   const [currentPage, setCurrentPage] = useState("home");

//   // Data collected from the InterviewSetup form
//   const [interviewData, setInterviewData] = useState(null);

//   // Called when "Start Interview" / "Get Started" is clicked on HomePage
//   const goToSetup = () => {
//     setCurrentPage("setup");
//   };

//   // Called when "Back" is clicked on InterviewSetup
//   const goToHome = () => {
//     setCurrentPage("home");
//   };

//   // Called when the InterviewSetup form is submitted
//   const handleStart = (data) => {
//     setInterviewData(data);
//     // TODO: once you build the actual interview screen,
//     // switch currentPage to that here, e.g. setCurrentPage("interview");
//     console.log("Interview setup data:", data);
//   };

//   return (
//     <>
//       {showSplash && (
//         <SplashScreen
//           onAnimationComplete={() => {
//             setShowSplash(false);
//           }}
//         />
//       )}

//       {currentPage === "home" && (
//         <HomePage onStartInterview={goToSetup} />
//       )}

//       {currentPage === "setup" && (
//         <InterviewSetup
//           onBack={goToHome}
//           onStart={handleStart}
//         />
//       )}
//     </>
//   );
// }
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import SplashScreen from "./components/splashscreen";
import HomePage from "./components/HomePage";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InterviewSetupPage from "./pages/InterviewSetupPage";
import InterviewPage from "./pages/InterviewPage";
import InterviewResultPage from "./pages/InterviewResultPage";

import { AuthProvider } from "./context/AuthContext";


// ======================================================
// LANDING PAGE FLOW
// Splash → Home
// ======================================================

function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  const goToInterview = () => {
    navigate("/login");
  };

  if (showSplash) {
    return (
      <SplashScreen
        onAnimationComplete={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <HomePage
      onStartInterview={goToInterview}
    />
  );
}


// ======================================================
// MAIN APP
// ======================================================

export default function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* ================================================= */}
          {/* ================= LANDING ======================= */}
          {/* ================================================= */}

          <Route
            path="/"
            element={<LandingPage />}
          />


          {/* ================================================= */}
          {/* ================= AUTH =========================== */}
          {/* ================================================= */}

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />


          {/* ================================================= */}
          {/* ================= DASHBOARD ===================== */}
          {/* ================================================= */}

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />


          {/* ================================================= */}
          {/* ================= INTERVIEW SETUP =============== */}
          {/* ================================================= */}

          <Route
            path="/interview/setup"
            element={<InterviewSetupPage />}
          />


          {/* ================================================= */}
          {/* ================= LIVE INTERVIEW ================= */}
          {/* ================================================= */}

          <Route
            path="/interview/:id"
            element={<InterviewPage />}
          />


          {/* ================================================= */}
          {/* ================= INTERVIEW RESULT ============== */}
          {/* ================================================= */}

          <Route
            path="/interview/:id/result"
            element={<InterviewResultPage />}
          />


          {/* ================================================= */}
          {/* ================= FALLBACK ======================= */}
          {/* ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}