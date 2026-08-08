// import React, { useState, useEffect, useMemo } from "react";
// import { motion } from "framer-motion";
// import logo from "../assets/logo.png";

// const generateParticles = (count = 20) =>
//   Array.from({ length: count }, (_, i) => {
//     const size = Math.random() * 2 + 1.5;

//     return {
//       id: i,
//       size,
//       top: Math.random() * 100,
//       left: Math.random() * 100,
//       opacity: Math.random() * 0.2 + 0.1,
//       duration: Math.random() * 10 + 12,
//       delay: Math.random() * 5,
//       driftX: (Math.random() - 0.5) * 35,
//       driftY: (Math.random() - 0.5) * 35,
//     };
//   });

// export default function SplashScreen({ onAnimationComplete }) {
//   const [stage, setStage] = useState("card");
//   const [floatActive, setFloatActive] = useState(false);
//   const [fadeOut, setFadeOut] = useState(false);

//   const particles = useMemo(() => generateParticles(20), []);

//   /* ================= INITIAL CARD ================= */

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setStage("logo");
//     }, 500);

//     return () => clearTimeout(timer);
//   }, []);

//   /* ================= FADE OUT ================= */

//   useEffect(() => {
//     if (!fadeOut) return;

//     const timer = setTimeout(() => {
//       onAnimationComplete?.();
//     }, 800);

//     return () => clearTimeout(timer);
//   }, [fadeOut, onAnimationComplete]);

//   /* ================= LOGO INTRO COMPLETE ================= */

//   const handleLogoIntroComplete = () => {
//     setTimeout(() => {
//       setStage("text");
//       setFloatActive(true);

//       setTimeout(() => {
//         setFadeOut(true);
//       }, 2000);
//     }, 600);
//   };

//   /* ================= TEXT ANIMATION ================= */

//   const textContainerVariants = {
//     hidden: {},
//     visible: {
//       transition: {
//         staggerChildren: 0.18,
//         delayChildren: 0.05,
//       },
//     },
//   };

//   const textItemVariants = {
//     hidden: {
//       opacity: 0,
//       y: 12,
//     },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.6,
//         ease: "easeOut",
//       },
//     },
//   };

//   return (
//     <motion.div
//       style={{
//         position: "fixed",
//         inset: 0,
//         width: "100vw",
//         height: "100vh",

//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",

//         gap: "0px",

//         overflow: "hidden",

//         background: "#030509",

//         zIndex: 9999,
//       }}
//       animate={{
//         opacity: fadeOut ? 0 : 1,
//       }}
//       transition={{
//         duration: 0.8,
//         ease: "easeInOut",
//       }}
//     >
//       {/* =====================================================
//           PARTICLES
//       ===================================================== */}

//       {particles.map((p) => (
//         <motion.span
//           key={p.id}
//           style={{
//             position: "absolute",

//             width: `${p.size}px`,
//             height: `${p.size}px`,

//             top: `${p.top}%`,
//             left: `${p.left}%`,

//             borderRadius: "50%",

//             background: "rgba(180,210,255,0.8)",

//             pointerEvents: "none",
//           }}
//           initial={{
//             opacity: 0,
//           }}
//           animate={{
//             opacity: [0, p.opacity, p.opacity, 0],
//             x: [0, p.driftX, 0],
//             y: [0, p.driftY, 0],
//           }}
//           transition={{
//             duration: p.duration,
//             delay: p.delay,
//             repeat: Infinity,
//             ease: "easeInOut",
//           }}
//         />
//       ))}

//       {/* =====================================================
//           LARGE BLUE AMBIENT GLOW
//       ===================================================== */}

//       <motion.div
//         style={{
//           position: "absolute",

//           width: "500px",
//           height: "500px",

//           borderRadius: "50%",

//           background:
//             "radial-gradient(circle, rgba(70,130,255,0.22) 0%, rgba(70,130,255,0.08) 45%, transparent 72%)",

//           filter: "blur(80px)",

//           pointerEvents: "none",
//         }}
//         animate={{
//           scale: [1, 1.08, 1],
//           opacity: [0.45, 0.65, 0.45],
//         }}
//         transition={{
//           duration: 8,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />

//       {/* =====================================================
//           LOGO CARD
//       ===================================================== */}

//       <motion.div
//         style={{
//           position: "relative",

//           width: "340px",
//           height: "340px",

//           flexShrink: 0,
//         }}
//         animate={{
//           scale: [1, 1.015, 1],
//         }}
//         transition={{
//           duration: 6,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       >
//         <div
//           style={{
//             position: "relative",

//             width: "340px",
//             height: "340px",

//             boxSizing: "border-box",

//             borderRadius: "26px",

//             overflow: "hidden",

//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",

//             background:
//               "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(235,242,255,0.94))",

//             border:
//               "1px solid rgba(255,255,255,0.95)",

//             boxShadow: `
//               0 0 20px rgba(255,255,255,0.7),
//               0 0 55px rgba(255,255,255,0.35),
//               0 0 100px rgba(100,150,255,0.25),
//               inset 0 0 35px rgba(255,255,255,0.8)
//             `,
//           }}
//         >
//           {/* =================================================
//               TOP GLASS HIGHLIGHT
//           ================================================= */}

//           <div
//             style={{
//               position: "absolute",

//               top: 0,
//               left: 0,

//               width: "100%",
//               height: "45%",

//               background:
//                 "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0))",

//               pointerEvents: "none",
//             }}
//           />

//           {/* =================================================
//               CARD SHINE
//           ================================================= */}

//           <motion.div
//             style={{
//               position: "absolute",

//               top: 0,
//               left: 0,

//               width: "18%",
//               height: "100%",

//               background:
//                 "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",

//               filter: "blur(3px)",

//               transform: "skewX(-20deg)",

//               pointerEvents: "none",
//             }}
//             initial={{
//               x: "-180%",
//             }}
//             animate={{
//               x: "600%",
//             }}
//             transition={{
//               duration: 1.2,
//               repeat: Infinity,
//               repeatDelay: 2.8,
//               ease: "easeInOut",
//             }}
//           />

//           {/* =================================================
//               BLUE GLOW BEHIND LOGO
//           ================================================= */}

//           <motion.div
//             style={{
//               position: "absolute",

//               width: "75%",
//               height: "75%",

//               borderRadius: "50%",

//               background:
//                 "radial-gradient(circle, rgba(80,140,255,0.18), transparent 70%)",

//               filter: "blur(18px)",

//               pointerEvents: "none",
//             }}
//             animate={{
//               scale: [0.95, 1.05, 0.95],
//               opacity: [0.4, 0.65, 0.4],
//             }}
//             transition={{
//               duration: 4,
//               repeat: Infinity,
//               ease: "easeInOut",
//             }}
//           />

//           {/* =================================================
//               LOGO
//           ================================================= */}

//           <motion.div
//             style={{
//               position: "relative",

//               width: "220px",
//               height: "220px",

//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",

//               flexShrink: 0,
//             }}
//             animate={
//               floatActive
//                 ? {
//                     y: [0, -5, 0],
//                   }
//                 : {
//                     y: 0,
//                   }
//             }
//             transition={
//               floatActive
//                 ? {
//                     duration: 3.2,
//                     repeat: Infinity,
//                     ease: "easeInOut",
//                   }
//                 : {
//                     duration: 0,
//                   }
//             }
//           >
//             <motion.img
//               src={logo}
//               alt="Trinity Logo"
//               style={{
//                 display: "block",

//                 width: "220px",
//                 height: "220px",

//                 maxWidth: "220px",
//                 maxHeight: "220px",

//                 objectFit: "contain",

//                 flexShrink: 0,
//               }}
//               initial={{
//                 opacity: 0,
//                 scale: 1.4,
//                 rotate: -4,
//               }}
//               animate={
//                 stage !== "card"
//                   ? {
//                       opacity: 1,
//                       scale: 1,
//                       rotate: 0,
//                     }
//                   : {
//                       opacity: 0,
//                       scale: 1.4,
//                       rotate: -4,
//                     }
//               }
//               transition={{
//                 duration: 1.8,
//                 ease: "easeOut",
//               }}
//               onAnimationComplete={() => {
//                 if (stage === "logo") {
//                   handleLogoIntroComplete();
//                 }
//               }}
//             />
//           </motion.div>
//         </div>
//       </motion.div>

//       {/* =====================================================
//           TEXT SECTION
//       ===================================================== */}

//       <motion.div
//         variants={textContainerVariants}
//         initial="hidden"
//         animate={stage === "text" ? "visible" : "hidden"}
//         style={{
//           width: "100%",

//           display: "flex",
//           flexDirection: "column",

//           alignItems: "center",
//           justifyContent: "center",

//           textAlign: "center",

//           marginTop: "28px",

//           position: "relative",
//           zIndex: 2,
//         }}
//       >
//         {/* =================================================
//             TRINITY
//         ================================================= */}

//         <motion.div
//           variants={textItemVariants}
//           style={{
//             width: "100%",

//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",

//             textAlign: "center",

//             fontFamily:
//               "Georgia, 'Times New Roman', serif",

//             fontSize:
//               "clamp(2.1rem, 5vw, 3.4rem)",

//             fontWeight: "500",

//             letterSpacing: "0.28em",

//             lineHeight: "1",

//             color: "#0d285f",

//             textShadow:
//               "0 0 12px rgba(212,169,77,0.22)",

//             whiteSpace: "nowrap",
//           }}
//         >
//           {/* TRIN */}
//           <span
//             style={{
//               color: "#0d285f",
//             }}
//           >
//             TRIN
//           </span>

//           {/* GOLD I */}
//           <span
//             style={{
//               color: "#c99b3b",

//               fontWeight: "400",

//               marginLeft: "0.02em",
//               marginRight: "0.02em",
//             }}
//           >
//             II
//           </span>

//           {/* TY */}
//           <span
//             style={{
//               color: "#0d285f",
//             }}
//           >
//             TY
//           </span>
//         </motion.div>

//         {/* =================================================
//             GOLD DIVIDER
//         ================================================= */}

//         <motion.div
//           variants={textItemVariants}
//           style={{
//             display: "flex",

//             alignItems: "center",
//             justifyContent: "center",

//             gap: "12px",

//             marginTop: "12px",
//           }}
//         >
//           {/* LEFT LINE */}

//           <span
//             style={{
//               display: "block",

//               width: "70px",
//               height: "1px",

//               background:
//                 "linear-gradient(90deg, transparent, #c99b3b)",
//             }}
//           />

//           {/* CENTER DOT */}

//           <span
//             style={{
//               display: "block",

//               width: "6px",
//               height: "6px",

//               borderRadius: "50%",

//               background: "#c99b3b",

//               boxShadow:
//                 "0 0 8px rgba(201,155,59,0.7)",
//             }}
//           />

//           {/* RIGHT LINE */}

//           <span
//             style={{
//               display: "block",

//               width: "70px",
//               height: "1px",

//               background:
//                 "linear-gradient(90deg, #c99b3b, transparent)",
//             }}
//           />
//         </motion.div>

//         {/* =================================================
//             SUB TAGLINE
//         ================================================= */}

//         <motion.p
//           variants={textItemVariants}
//           style={{
//             margin: "24px 0 0",

//             padding: "0 16px",

//             width: "100%",
//             boxSizing: "border-box",

//             textAlign: "center",

//             fontFamily:
//               "'Brush Script MT', 'Segoe Script', cursive",

//             fontSize:
//               "clamp(1rem, 2.5vw, 1.35rem)",

//             letterSpacing: "0.08em",

//             color: "rgba(190,205,235,0.88)",

//             fontStyle: "italic",

//             textShadow:
//               "0 0 10px rgba(120,170,255,0.18)",
//           }}
//         >
//           Built to Question · Designed to Know
//         </motion.p>
//       </motion.div>
//     </motion.div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";


// =====================================================
// PARTICLES
// =====================================================

const generateParticles = (count = 20) =>
  Array.from({ length: count }, (_, i) => {
    const size = Math.random() * 2 + 1.5;

    return {
      id: i,
      size,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.2 + 0.1,
      duration: Math.random() * 10 + 12,
      delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 35,
      driftY: (Math.random() - 0.5) * 35,
    };
  });


// =====================================================
// SPLASH SCREEN
// =====================================================

export default function SplashScreen({ onAnimationComplete }) {
  const [stage, setStage] = useState("card");
  const [fadeOut, setFadeOut] = useState(false);

  const particles = useMemo(
    () => generateParticles(20),
    []
  );


  // ===================================================
  // FIXED SPLASH TIMELINE
  // ===================================================

  useEffect(() => {
    // 0.5 sec -> logo starts
    const logoTimer = setTimeout(() => {
      setStage("logo");
    }, 500);


    // 2.9 sec -> text appears
    const textTimer = setTimeout(() => {
      setStage("text");
    }, 2900);


    // 5.8 sec -> start fading splash
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 5800);


    // 6.6 sec -> open homepage
    const completeTimer = setTimeout(() => {
      onAnimationComplete?.();
    }, 6600);


    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);


  // ===================================================
  // TEXT ANIMATION
  // ===================================================

  const textContainerVariants = {
    hidden: {},

    visible: {
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.05,
      },
    },
  };


  const textItemVariants = {
    hidden: {
      opacity: 0,
      y: 12,
    },

    visible: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };


  // ===================================================
  // RETURN
  // ===================================================

  return (
    <motion.div
      style={{
        position: "fixed",
        inset: 0,

        width: "100vw",
        height: "100vh",

        display: "flex",
        flexDirection: "column",

        alignItems: "center",
        justifyContent: "center",

        overflow: "hidden",

        background: "#030509",

        zIndex: 9999,
      }}

      animate={{
        opacity: fadeOut ? 0 : 1,
      }}

      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
    >

      {/* =================================================
          PARTICLES
      ================================================= */}

      {particles.map((p) => (
        <motion.span
          key={p.id}

          style={{
            position: "absolute",

            width: `${p.size}px`,
            height: `${p.size}px`,

            top: `${p.top}%`,
            left: `${p.left}%`,

            borderRadius: "50%",

            background:
              "rgba(180,210,255,0.8)",

            pointerEvents: "none",
          }}

          initial={{
            opacity: 0,
          }}

          animate={{
            opacity: [
              0,
              p.opacity,
              p.opacity,
              0,
            ],

            x: [
              0,
              p.driftX,
              0,
            ],

            y: [
              0,
              p.driftY,
              0,
            ],
          }}

          transition={{
            duration: p.duration,
            delay: p.delay,

            repeat: Infinity,

            ease: "easeInOut",
          }}
        />
      ))}


      {/* =================================================
          BLUE AMBIENT GLOW
      ================================================= */}

      <motion.div
        style={{
          position: "absolute",

          width: "500px",
          height: "500px",

          borderRadius: "50%",

          background:
            "radial-gradient(circle, rgba(70,130,255,0.22) 0%, rgba(70,130,255,0.08) 45%, transparent 72%)",

          filter: "blur(80px)",

          pointerEvents: "none",
        }}

        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.45, 0.65, 0.45],
        }}

        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      {/* =================================================
          LOGO CARD
      ================================================= */}

      <motion.div
        style={{
          position: "relative",

          width: "340px",
          height: "340px",

          flexShrink: 0,
        }}

        animate={{
          scale: [1, 1.015, 1],
        }}

        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >

        <div
          style={{
            position: "relative",

            width: "340px",
            height: "340px",

            boxSizing: "border-box",

            borderRadius: "26px",

            overflow: "hidden",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(235,242,255,0.94))",

            border:
              "1px solid rgba(255,255,255,0.95)",

            boxShadow: `
              0 0 20px rgba(255,255,255,0.7),
              0 0 55px rgba(255,255,255,0.35),
              0 0 100px rgba(100,150,255,0.25),
              inset 0 0 35px rgba(255,255,255,0.8)
            `,
          }}
        >

          {/* TOP GLASS */}

          <div
            style={{
              position: "absolute",

              top: 0,
              left: 0,

              width: "100%",
              height: "45%",

              background:
                "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0))",

              pointerEvents: "none",
            }}
          />


          {/* SHINE */}

          <motion.div
            style={{
              position: "absolute",

              top: 0,
              left: 0,

              width: "18%",
              height: "100%",

              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",

              filter: "blur(3px)",

              transform: "skewX(-20deg)",

              pointerEvents: "none",
            }}

            initial={{
              x: "-180%",
            }}

            animate={{
              x: "600%",
            }}

            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 2.8,
              ease: "easeInOut",
            }}
          />


          {/* BLUE LOGO GLOW */}

          <motion.div
            style={{
              position: "absolute",

              width: "75%",
              height: "75%",

              borderRadius: "50%",

              background:
                "radial-gradient(circle, rgba(80,140,255,0.18), transparent 70%)",

              filter: "blur(18px)",

              pointerEvents: "none",
            }}

            animate={{
              scale: [0.95, 1.05, 0.95],
              opacity: [0.4, 0.65, 0.4],
            }}

            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />


          {/* =================================================
              LOGO
          ================================================= */}

          <motion.div
            style={{
              position: "relative",

              width: "220px",
              height: "220px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              flexShrink: 0,
            }}

            animate={{
              y: stage === "text"
                ? [0, -5, 0]
                : 0,
            }}

            transition={{
              duration: 3.2,
              repeat: stage === "text"
                ? Infinity
                : 0,

              ease: "easeInOut",
            }}
          >

            <motion.img
              src={logo}

              alt="Trinity Logo"

              style={{
                display: "block",

                width: "220px",
                height: "220px",

                maxWidth: "220px",
                maxHeight: "220px",

                objectFit: "contain",

                flexShrink: 0,
              }}

              initial={{
                opacity: 0,
                scale: 1.4,
                rotate: -4,
              }}

              animate={{
                opacity:
                  stage === "card"
                    ? 0
                    : 1,

                scale:
                  stage === "card"
                    ? 1.4
                    : 1,

                rotate:
                  stage === "card"
                    ? -4
                    : 0,
              }}

              transition={{
                duration: 1.8,
                ease: "easeOut",
              }}
            />

          </motion.div>

        </div>

      </motion.div>


      {/* =================================================
          TEXT SECTION
      ================================================= */}

      <motion.div
        variants={textContainerVariants}

        initial="hidden"

        animate={
          stage === "text"
            ? "visible"
            : "hidden"
        }

        style={{
          width: "100%",

          display: "flex",
          flexDirection: "column",

          alignItems: "center",
          justifyContent: "center",

          textAlign: "center",

          marginTop: "28px",

          position: "relative",

          zIndex: 2,
        }}
      >

        {/* =================================================
            TRINITY
        ================================================= */}

        <motion.div
          variants={textItemVariants}

          style={{
            width: "100%",

            display: "flex",

            alignItems: "center",
            justifyContent: "center",

            textAlign: "center",

            fontFamily:
              "Georgia, 'Times New Roman', serif",

            fontSize:
              "clamp(2.1rem, 5vw, 3.4rem)",

            fontWeight: "500",

            letterSpacing: "0.28em",

            lineHeight: "1",

            color: "#0d285f",

            textShadow:
              "0 0 12px rgba(212,169,77,0.22)",

            whiteSpace: "nowrap",
          }}
        >

          <span
            style={{
              color: "#0d285f",
            }}
          >
            TRIN
          </span>


          <span
            style={{
              color: "#c99b3b",

              fontWeight: "400",

              marginLeft: "0.02em",
              marginRight: "0.02em",
            }}
          >
            II
          </span>


          <span
            style={{
              color: "#0d285f",
            }}
          >
            TY
          </span>

        </motion.div>


        {/* =================================================
            DIVIDER
        ================================================= */}

        <motion.div
          variants={textItemVariants}

          style={{
            display: "flex",

            alignItems: "center",
            justifyContent: "center",

            gap: "12px",

            marginTop: "12px",
          }}
        >

          <span
            style={{
              display: "block",

              width: "70px",
              height: "1px",

              background:
                "linear-gradient(90deg, transparent, #c99b3b)",
            }}
          />


          <span
            style={{
              display: "block",

              width: "6px",
              height: "6px",

              borderRadius: "50%",

              background: "#c99b3b",

              boxShadow:
                "0 0 8px rgba(201,155,59,0.7)",
            }}
          />


          <span
            style={{
              display: "block",

              width: "70px",
              height: "1px",

              background:
                "linear-gradient(90deg, #c99b3b, transparent)",
            }}
          />

        </motion.div>


        {/* =================================================
            TAGLINE
        ================================================= */}

        <motion.p
          variants={textItemVariants}

          style={{
            margin: "24px 0 0",

            padding: "0 16px",

            width: "100%",

            boxSizing: "border-box",

            textAlign: "center",

            fontFamily:
              "'Brush Script MT', 'Segoe Script', cursive",

            fontSize:
              "clamp(1rem, 2.5vw, 1.35rem)",

            letterSpacing: "0.08em",

            color:
              "rgba(190,205,235,0.88)",

            fontStyle: "italic",

            textShadow:
              "0 0 10px rgba(120,170,255,0.18)",
          }}
        >
          Built to Question · Designed to Know
        </motion.p>

      </motion.div>

    </motion.div>
  );
}
