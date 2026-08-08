import React, { useState } from "react";
import HomePage from "./components/HomePage";
import SplashScreen from "./components/splashscreen";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return showSplash ? (
    <SplashScreen
      onAnimationComplete={() => setShowSplash(false)}
    />
  ) : (
    <HomePage />
  );
}

export default App;