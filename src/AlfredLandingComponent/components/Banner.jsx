import React from "react";
import Header from "./Header";
import "./Banner.css";
import alfred from "../assets/images/Alfred1.png";
import alfred1 from "../assets/images/alfred2.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Banner = ({
  onComplete,
  onSubscribe,
  onLogin,
  onLogout,
  isNewUser,
  isTrialUser,
  isAuthenticated,
}) => {
  console.log("isNewUser", isNewUser);
  console.log("isTrialUser", isTrialUser);

  const handleGetStarted = () => {
    if (isNewUser) {
      // For new users, scroll to pricing plans section
      const pricingPlansSection = document.getElementById("pricing-plans");
      if (pricingPlansSection) {
        pricingPlansSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      // For existing users, use the original flow
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    }
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    }
  };

  // Handle button click - scroll to pricing if not authenticated, otherwise use appropriate handler
  const handleButtonClick = () => {
    if (!isAuthenticated) {
      // If not logged in, scroll to pricing plans section instead of navigating to login
      const pricingPlansSection = document.getElementById("pricing-plans");
      if (pricingPlansSection) {
        pricingPlansSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      // If authenticated, go to dashboard
      handleSubscribe();
    }
  };

  return (
    <div className="alfred-banner container-fluid  px-lg-5   p-0 m-0 mb-5">
      <Header onLogin={onLogin} onLogout={onLogout} isNewUser={isNewUser} />

      <div className=" container-fluid pt-5 px-4 px-lg-5">
        {/* ----- alfred back text -------- */}
        <img
          src={alfred1}
          alt="alfred"
          tittle="alfred"
          className="alfred-txt-img"
        />
        <div className="row pt-5 pt-lg-0 ">
          <div className="col-lg-7   d-flex align-items-center mb-5 mb-lg-0">
            <div className="alfred-banner-text ">
              <div className="alfred-banner-badge d-flex align-items-center mt-4">
                <span className="alfred-badge-dot pt-1 "></span>
                Meet Alfred : Your AI Social Media Agent
              </div>
              <h1 className="alfred-banner-title col-lg-11">
                CREATE, SCHEDULE, AND GROW WITH ALFRED
              </h1>
              <p className="alfred-banner-subtitle">
               Your AI-powered shortcut to social media success - create, design, and publish 10x faster with AI.
              </p>
              <div className="alfred-banner-buttons">
                {isNewUser ? (
                  <button
                    className="alfred-btn-primary"
                    onClick={handleGetStarted}
                  >
                    Start Your 7-Day Free Trial
                  </button>
                ) : (
                  <button
                    className="alfred-btn-primary"
                    onClick={handleButtonClick}
                  >
                    {!isAuthenticated
                      ? "Start Your 7-Day Free Trial"
                      : "GO TO DASHBOARD"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-5 d-flex pt-xl-5 align-items-end justify-content-center justify-content-lg-start">
            <img
              src={alfred}
              alt="alfred"
              tittle="alfred"
              className=" robo-img pt-xl-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
