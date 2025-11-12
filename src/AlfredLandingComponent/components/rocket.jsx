import React from "react";
import "./rocket.css";
import rocket from "../assets/images/rocket.png";
import { useNavigate } from "react-router-dom";

const Rocket = ({ isNewUser, onComplete, onSubscribe }) => {
  const navigate = useNavigate()
  const handleGetStarted = () => {
    if (isNewUser) {
      // For new users, scroll to pricing plans section
      const pricingPlansSection = document.getElementById('pricing-plans');
      if (pricingPlansSection) {
        pricingPlansSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
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

  return (
    <>
      <div className="my-5 px-lg-5 px-2 container-fluid mx-lg-3">
        <div className="rocket-back px-lg-5 px-2 py-5 row d-flex align-items-center ">
          <div className="rocket-back-txt col-lg-6 pt-lg-5">
            <h5 className="col-lg-12 ">
              Ready to Automate your<br></br>
              <p className="soc-med ">Social Media?</p>
            </h5>
            <h6 className="col-lg-9">
              Join thousands of creators and businesses who save hours every
              week with Alfred
            </h6>
          </div>
          <div className="col-lg-3">
            <div className="roc-img">
              <img src={rocket} alt="roc"></img>
            </div>
          </div>
          <div className="rocket-back-btn col-lg-3 pt-lg-5">
            <div className="alfred-banner-buttons d-flex align-items-center justify-content-end">
              {isNewUser ? (
                <button className="alfred-btn-primary" onClick={handleGetStarted}>Start Your 7-Day Free Trial</button>
              ) : (
                <button className="alfred-btn-primary" onClick={()=> navigate("/dashboard?tab=billing")}>Subscribe Now</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rocket;
