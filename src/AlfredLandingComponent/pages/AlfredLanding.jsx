import React, { useEffect, useState } from "react";
import Banner from "../components/Banner";
import "./AlfredLanding.css";
import "../styles/tailwind-isolation.css";
import Alfredwhy from "../components/whyalfred";
import FAQ from "../components/FAQ";
import Ready from "../components/ready";
import Powered from "../components/Powered";
import UsersSee from "../components/userssee";
import Footer from "../components/Footer";
import HowToWork from "../components/HowToWork";
import Rocket from "../components/rocket";

const AlfredLanding = ({
  onComplete,
  onSubscribe,
  planIdValue,
  onLogin,
  onLogout,
  isNewUser,
  isTrialUser,
  isAuthenticated,
}) => {
  console.log("isNewUserFromAlfredLanding", isNewUser);
  console.log("isTrialUserFromAlfredLanding", isTrialUser);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      try {
        const crossedViewportHeight = window.scrollY > window.innerHeight;
        setShowScrollTop(crossedViewportHeight);
      } catch (_) {}
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initialize on mount in case user reloads mid-page
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        // Avoid injecting multiple times
        const existing = Array.from(document.getElementsByTagName("script")).some(
          (el) => el.src && el.src.includes("embed.tawk.to/68da402e46926219512d7634/1j6a8lecg")
        );
        if (existing) return;

        const s1 = document.createElement("script");
        const s0 = document.getElementsByTagName("script")[0];
        s1.async = true;
        s1.src = "https://embed.tawk.to/68da402e46926219512d7634/1j6a8lecg";
        s1.charset = "UTF-8";
        s1.setAttribute("crossorigin", "*");
        if (s0 && s0.parentNode) {
          s0.parentNode.insertBefore(s1, s0);
        } else {
          document.head.appendChild(s1);
        }

        return () => {
          // Cleanup the injected script on unmount
          if (s1 && s1.parentNode) {
            s1.parentNode.removeChild(s1);
          }
        };
      }
    } catch (_) {}
  }, []);
  return (
    <div className="alfred-landing-isolation">
      <div className="alfred-landing">
        <div id="home">
          <Banner
            onComplete={onComplete}
            onSubscribe={onSubscribe}
            onLogin={onLogin}
            onLogout={onLogout}
            isNewUser={isNewUser}
            isTrialUser={isTrialUser}
            isAuthenticated={isAuthenticated}
          />
        </div>
        <div id="products">{/* <Powered /> */}</div>
        <div id="features">
          <Alfredwhy />
        </div>
        <div id="how-it-works">
          <HowToWork planIdValue={planIdValue} onLogin={onLogin} onSubscribe={onSubscribe}/>
        </div>
        <div id="testimonials">
          <UsersSee />
        </div>
        {/* <Rocket/> */}
        <div id="faq">
          <FAQ />
        </div>
        <div id="contact">
          <Ready
            onComplete={onComplete}
            onSubscribe={onSubscribe}
            isNewUser={isNewUser}
            isTrialUser={isTrialUser}
            handleLogin={onLogin}
            isAuthenticated={isAuthenticated}
          />
        </div>
        <Footer />
      </div>
      {showScrollTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          className="floating-scroll-top"
          onClick={() => {
            try {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (_) {
              window.scrollTo(0, 0);
            }
          }}
        >
          <i className="bi bi-arrow-up" aria-hidden="true"></i>
        </button>
      )}
    </div>
  );
};

export default AlfredLanding;
