import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { COMMON_BASE_URL } from '../api/api';
import './404error.css';
import logosim from "../assets/simbli-logo.png";
import alfreds from '../assets/404png.png';
import Footer from '../AlfredLandingComponent/components/Footer';

const Error = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    const token = localStorage.getItem("access-token");
    if (!token) {
      setIsValidToken(false);
      return;
    }

    axios
      .get(`${COMMON_BASE_URL}/api/v1/check-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setIsValidToken(res.status === 200))
      .catch(() => {
        localStorage.removeItem("access-token");
        localStorage.removeItem("mail");
        setIsValidToken(false);
      });
  }, []);

  const handleBackToHome = () => {
    navigate('/landing');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('mail');
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const smoothScrollTo = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
    <style>
        {
            `
            .alfred-social-link{
            fill:#20484f !Important;
            }
            .alfred-header-container::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 100px;
    z-index: -1;
    border:1px solid #54C754 !important;
    backdrop-filter: blur(10px);
    background-color: #ffffff3b !important;
    border: 1px solid rgba(255, 255, 255, 0.185);
}
            `
        }
    </style>
    <div className="error-page-container">
      {/* Header - Copied from Header.jsx */}
      <header className="alfred-header px-lg-5">
        <div className="alfred-header-container">
          {/* Logo Section */}
          <div className="alfred-logo-section">
            <img src={logosim} alt="Simbli" className="w-26 h-6" />
          </div>

          {/* Desktop Navigation Menu */}
          <div className="alfred-header-right">
           

            {/* Social Media Icons - Desktop Only */}
            <div className="alfred-social-icons alfred-desktop-social">
              <a href="https://www.youtube.com/@Simbli-ai" target="_blank" rel="noreferrer" className="alfred-social-link" style={{color: '#20484f'}}>
                <svg width="19" height="18" viewBox="0 0 30 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M29.3725 3.27892C29.0275 1.98847 28.0112 0.971256 26.72 0.625976C24.3812 2.2209e-07 15 0 15 0C15 0 5.61875 2.2209e-07 3.27875 0.625976C1.98875 0.971256 0.9725 1.98722 0.6275 3.27892C0 5.61888 0 10.5 0 10.5C0 10.5 0 15.3811 0.6275 17.7211C0.9725 19.0115 1.98875 20.0287 3.28 20.374C5.61875 21 15 21 15 21C15 21 24.3813 21 26.7213 20.374C28.0113 20.0287 29.0275 19.0128 29.3738 17.7211C30 15.3811 30 10.5 30 10.5C30 10.5 30 5.61888 29.3725 3.27892ZM11.9325 14.9328V6.06725L19.7725 10.5L11.9325 14.9328Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://x.com/Simbli_ai" target="_blank" rel="noreferrer" className="alfred-social-link" style={{color: '#20484f'}}>
                <svg width="17" height="17" viewBox="0 0 23 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.22754 0.0996094L12.2227 6.77051L12.2969 6.86914L12.3779 6.77539L18.1602 0.0996094H21.4229L13.8604 8.83008L13.8076 8.89062L13.8555 8.95508L22.8008 20.9004H15.9531L10.4238 13.5986L10.3486 13.5L10.2686 13.5928L3.93652 20.9004H0.671875L8.77148 11.5508L8.82422 11.4893L8.77539 11.4248L0.201172 0.0996094H7.22754ZM4.03906 2.08105L16.7959 18.9277L16.8262 18.9678H19.0303L18.9102 18.8076L6.2959 1.95996L6.26562 1.91992H3.91699L4.03906 2.08105Z" fill="currentColor" stroke="#137037" strokeWidth="0.2"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/simbli.ai/" target="_blank" rel="noreferrer" className="alfred-social-link" style={{color: '#20484f'}}>
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_1401_731)">
                    <path d="M10.5 1.89082C13.3055 1.89082 13.6377 1.90312 14.741 1.95234C15.7664 1.99746 16.3201 2.16973 16.6893 2.31328C17.1773 2.50195 17.5301 2.73164 17.8951 3.09668C18.2643 3.46582 18.4898 3.81445 18.6785 4.30254C18.8221 4.67168 18.9943 5.22949 19.0395 6.25078C19.0887 7.3582 19.101 7.69043 19.101 10.4918C19.101 13.2973 19.0887 13.6295 19.0395 14.7328C18.9943 15.7582 18.8221 16.3119 18.6785 16.6811C18.4898 17.1691 18.2602 17.5219 17.8951 17.8869C17.526 18.2561 17.1773 18.4816 16.6893 18.6703C16.3201 18.8139 15.7623 18.9861 14.741 19.0312C13.6336 19.0805 13.3014 19.0928 10.5 19.0928C7.69453 19.0928 7.36231 19.0805 6.25899 19.0312C5.23359 18.9861 4.67988 18.8139 4.31074 18.6703C3.82266 18.4816 3.46992 18.252 3.10488 17.8869C2.73574 17.5178 2.51016 17.1691 2.32148 16.6811C2.17793 16.3119 2.00566 15.7541 1.96055 14.7328C1.91133 13.6254 1.89902 13.2932 1.89902 10.4918C1.89902 7.68633 1.91133 7.3541 1.96055 6.25078C2.00566 5.22539 2.17793 4.67168 2.32148 4.30254C2.51016 3.81445 2.73984 3.46172 3.10488 3.09668C3.47402 2.72754 3.82266 2.50195 4.31074 2.31328C4.67988 2.16973 5.2377 1.99746 6.25899 1.95234C7.36231 1.90312 7.69453 1.89082 10.5 1.89082ZM10.5 0C7.64942 0 7.29258 0.0123047 6.17285 0.0615234C5.05723 0.110742 4.29024 0.291211 3.62578 0.549609C2.93262 0.820312 2.34609 1.17715 1.76367 1.76367C1.17715 2.34609 0.820313 2.93262 0.549609 3.62168C0.291211 4.29023 0.110742 5.05312 0.0615234 6.16875C0.0123047 7.29258 0 7.64941 0 10.5C0 13.3506 0.0123047 13.7074 0.0615234 14.8271C0.110742 15.9428 0.291211 16.7098 0.549609 17.3742C0.820313 18.0674 1.17715 18.6539 1.76367 19.2363C2.34609 19.8188 2.93262 20.1797 3.62168 20.4463C4.29024 20.7047 5.05313 20.8852 6.16875 20.9344C7.28848 20.9836 7.64531 20.9959 10.4959 20.9959C13.3465 20.9959 13.7033 20.9836 14.823 20.9344C15.9387 20.8852 16.7057 20.7047 17.3701 20.4463C18.0592 20.1797 18.6457 19.8188 19.2281 19.2363C19.8105 18.6539 20.1715 18.0674 20.4381 17.3783C20.6965 16.7098 20.877 15.9469 20.9262 14.8313C20.9754 13.7115 20.9877 13.3547 20.9877 10.5041C20.9877 7.65352 20.9754 7.29668 20.9262 6.17695C20.877 5.06133 20.6965 4.29434 20.4381 3.62988C20.1797 2.93262 19.8229 2.34609 19.2363 1.76367C18.6539 1.18125 18.0674 0.820312 17.3783 0.553711C16.7098 0.295312 15.9469 0.114844 14.8313 0.065625C13.7074 0.0123047 13.3506 0 10.5 0Z" fill="currentColor"/>
                    <path d="M10.5 5.10645C7.52227 5.10645 5.10645 7.52227 5.10645 10.5C5.10645 13.4777 7.52227 15.8936 10.5 15.8936C13.4777 15.8936 15.8936 13.4777 15.8936 10.5C15.8936 7.52227 13.4777 5.10645 10.5 5.10645ZM10.5 13.9986C8.56816 13.9986 7.00137 12.4318 7.00137 10.5C7.00137 8.56816 8.56816 7.00137 10.5 7.00137C12.4318 7.00137 13.9986 8.56816 13.9986 10.5C13.9986 12.4318 12.4318 13.9986 10.5 13.9986Z" fill="currentColor"/>
                    <path d="M17.366 4.89318C17.366 5.59045 16.8 6.15236 16.1068 6.15236C15.4096 6.15236 14.8477 5.58635 14.8477 4.89318C14.8477 4.19591 15.4137 3.634 16.1068 3.634C16.8 3.634 17.366 4.20002 17.366 4.89318Z" fill="currentColor"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_1401_731">
                      <rect width="21" height="21" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </a>
              <a href="https://www.facebook.com/SimbliAi/" target="_blank" rel="noreferrer" className="alfred-social-link" style={{color: '#20484f'}}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.9998 0C4.92482 0 0 4.94301 0 11.0404C0 16.2179 3.55161 20.5625 8.34267 21.7558V14.4144H6.07452V11.0404H8.34267V9.58661C8.34267 5.82889 10.0371 4.08716 13.7128 4.08716C14.4097 4.08716 15.6122 4.2245 16.1041 4.3614V7.4196C15.8445 7.39221 15.3935 7.37853 14.8334 7.37853C13.0299 7.37853 12.333 8.06435 12.333 9.84716V11.0404H15.9259L15.3086 14.4144H12.333V22C17.7796 21.3398 22 16.6851 22 11.0404C21.9996 4.94301 17.0747 0 10.9998 0Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/simbliai" target="_blank" rel="noreferrer" className="alfred-social-link" style={{color: '#20484f'}}>
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_1401_733)">
                    <path d="M19.4455 0H1.55039C0.693164 0 0 0.676758 0 1.51348V19.4824C0 20.3191 0.693164 21 1.55039 21H19.4455C20.3027 21 21 20.3191 21 19.4865V1.51348C21 0.676758 20.3027 0 19.4455 0ZM6.23027 17.8951H3.11309V7.8709H6.23027V17.8951ZM4.67168 6.50508C3.6709 6.50508 2.86289 5.69707 2.86289 4.70039C2.86289 3.70371 3.6709 2.8957 4.67168 2.8957C5.66836 2.8957 6.47637 3.70371 6.47637 4.70039C6.47637 5.69297 5.66836 6.50508 4.67168 6.50508ZM17.8951 17.8951H14.782V13.0225C14.782 11.8617 14.7615 10.3646 13.1619 10.3646C11.5418 10.3646 11.2957 11.632 11.2957 12.9404V17.8951H8.18672V7.8709H11.1727V9.24082H11.2137C11.6279 8.45332 12.6451 7.6207 14.1586 7.6207C17.3127 7.6207 17.8951 9.69609 17.8951 12.3949V17.8951Z" fill="currentColor"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_1401_733">
                      <rect width="21" height="21" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </a>
              <a href="https://www.reddit.com/user/Simbli_ai/" target="_blank" rel="noreferrer" className="alfred-social-link" style={{color: '#20484f'}}>
                <svg width="17" height="17" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.47884 13.2917C7.84726 13.2917 7.33301 12.7774 7.33301 12.1458C7.33301 11.5142 7.84726 11 8.47884 11C9.11042 11 9.62467 11.5142 9.62467 12.1458C9.62467 12.7774 9.11042 13.2917 8.47884 13.2917Z" fill="currentColor"/>
                  <path d="M13.7229 14.7537C13.8393 14.8702 13.8384 15.0581 13.7229 15.1736C12.941 15.9546 11.4423 16.0151 11.0013 16.0151C10.5604 16.0151 9.06167 15.9546 8.28067 15.1736C8.16426 15.0572 8.16426 14.8702 8.28067 14.7537C8.39709 14.6373 8.58409 14.6373 8.70051 14.7537C9.19367 15.2469 10.2478 15.4211 11.0013 15.4211C11.7548 15.4211 12.809 15.246 13.3031 14.7528C13.4195 14.6373 13.6074 14.6373 13.7229 14.7537Z" fill="currentColor"/>
                  <path d="M14.6667 12.1458C14.6667 12.7783 14.1524 13.2917 13.5208 13.2917C12.8883 13.2917 12.375 12.7774 12.375 12.1458C12.375 11.5142 12.8892 11 13.5208 11C14.1524 11 14.6667 11.5142 14.6667 12.1458Z" fill="currentColor"/>
                  <path d="M11 0C4.92525 0 0 4.92525 0 11C0 17.0748 4.92525 22 11 22C17.0748 22 22 17.0748 22 11C22 4.92525 17.0748 0 11 0ZM17.3773 12.4658C17.402 12.6243 17.4148 12.7847 17.4148 12.9479C17.4148 15.4156 14.542 17.4167 10.9982 17.4167C7.45433 17.4167 4.5815 15.4156 4.5815 12.9479C4.5815 12.7838 4.59525 12.6225 4.62 12.463C4.06175 12.2118 3.67217 11.6518 3.67217 11C3.67217 10.1136 4.38992 9.39583 5.27633 9.39583C5.70717 9.39583 6.09767 9.56633 6.3855 9.84317C7.4965 9.04292 9.031 8.53142 10.7388 8.48375L11.5546 4.6475C11.5702 4.57325 11.6151 4.50817 11.6783 4.46692C11.7416 4.42567 11.8195 4.411 11.8938 4.42658L14.5594 4.99308C14.7473 4.61633 15.1333 4.35417 15.5833 4.35417C16.2158 4.35417 16.7292 4.8675 16.7292 5.5C16.7292 6.1325 16.2158 6.64583 15.5833 6.64583C14.9692 6.64583 14.4714 6.16092 14.443 5.55408L12.056 5.04625L11.3254 8.48375C13.0084 8.54242 14.5191 9.05392 15.6154 9.845C15.9042 9.56725 16.2956 9.39492 16.7283 9.39492C17.6147 9.39492 18.3324 10.1127 18.3324 10.9991C18.3315 11.6545 17.9392 12.2164 17.3773 12.4658Z" fill="currentColor"/>
                </svg>
              </a>
            </div>

           

            {/* Mobile Menu Button */}
            <button
              className="alfred-mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span className={`alfred-hamburger ${isMobileMenuOpen ? "alfred-hamburger-open" : ""}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`alfred-mobile-menu ${isMobileMenuOpen ? "alfred-mobile-menu-open" : ""}`}>
         
        </div>
      </header>

      <div className="error-content-card">
        {/* Left Section - Illustration */}
        <div className="error-illustration">
          <img 
            src={alfreds} 
            alt="404 Error Illustration"
          />
        </div>

        {/* Right Section - Text Content */}
        <div className="error-text-content">
          <h1 className="error-code">404</h1>
          <h2 className="error-title">Simbli’s AI couldn’t locate this one.</h2>
          <p className="error-description">
           No worries, though. Everything else is working perfectly.
Let’s take you back to the good stuff.
          </p>
          <button 
            className="error-back-button"
            onClick={handleBackToHome}
          >
           Go to Homepage
          </button>
        </div>
      </div>

      {/* Footer Component */}
 
    </div>
         <Footer />
    </>
  );
};

export default Error;
