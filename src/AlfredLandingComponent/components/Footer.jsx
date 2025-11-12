import React, { useState, useEffect } from 'react';
import './footer.css';
import Footerlogo from "../assets/images/footer-logo.svg";
import Twitter from "../assets/images/twitter.svg";
import Insta from "../assets/images/insta.svg";
import Fb from "../assets/images/fb.svg";
import Linked from "../assets/images/linkedin.svg";
import { SIMBLI_URL, subscribeNewsletterApi } from '../../api/api';
const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [messageTimeout, setMessageTimeout] = useState(null);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to clear message after timeout
  const clearMessageAfterTimeout = () => {
    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    // Set new timeout to clear message after 3 seconds
    const timeout = setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
    
    setMessageTimeout(timeout);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      clearMessageAfterTimeout();
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      clearMessageAfterTimeout();
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await subscribeNewsletterApi(email);
      const data = response.data;

      // Clear email input immediately after successful API call
      setEmail('');

      if (response.status === 200 && data.success) {
        setMessage('Thank you for subscribing to our newsletter!');
        setMessageType('success');
        clearMessageAfterTimeout();
      } else {
        // Handle API error responses
        const errorMessage = data.message || data.error || 'Failed to subscribe. Please try again.';
        setMessage(errorMessage);
        setMessageType('error');
        clearMessageAfterTimeout();
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      // Handle axios error responses
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Something went wrong. Please try again later.';
      setMessage(errorMessage);
      setMessageType('error');
      clearMessageAfterTimeout();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

  // Handle input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear message when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
      // Clear any existing timeout when user starts typing
      if (messageTimeout) {
        clearTimeout(messageTimeout);
        setMessageTimeout(null);
      }
    }
  };
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Branding Section */}
        <div className="footer-section branding-section">
          <div className="logo-container">
            <div className="logo-icon"><img src={Footerlogo} /></div>
            {/* <span className="logo-text">Simbli</span> */}
          </div>
          <p className="company-description">
            Human-like agents. Trained for specific roles. Built for creators, teams, and learners who want to move faster with AI.
          </p>
          <div className="social-icons mb-3">
             <a href="https://www.youtube.com/@Simbli-ai" className="social-icon" aria-label="youtube">
          <svg width="26" height="26" viewBox="0 0 30 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M29.3725 3.27892C29.0275 1.98847 28.0112 0.971256 26.72 0.625976C24.3812 2.2209e-07 15 0 15 0C15 0 5.61875 2.2209e-07 3.27875 0.625976C1.98875 0.971256 0.9725 1.98722 0.6275 3.27892C0 5.61888 0 10.5 0 10.5C0 10.5 0 15.3811 0.6275 17.7211C0.9725 19.0115 1.98875 20.0287 3.28 20.374C5.61875 21 15 21 15 21C15 21 24.3813 21 26.7213 20.374C28.0113 20.0287 29.0275 19.0128 29.3738 17.7211C30 15.3811 30 10.5 30 10.5C30 10.5 30 5.61888 29.3725 3.27892ZM11.9325 14.9328V6.06725L19.7725 10.5L11.9325 14.9328Z" fill="white"/>
          </svg>

             </a>
            <a href="https://x.com/Simbli_ai" className="social-icon" aria-label="X (formerly Twitter)"><img src={Twitter} /></a>
            <a href="https://www.instagram.com/simbli.ai/" className="social-icon" aria-label="Instagram"><img src={Insta} /></a>
            <a href="https://www.facebook.com/SimbliAi/" className="social-icon" aria-label="Facebook"><img src={Fb} /></a>
            <a href="https://www.linkedin.com/company/simbliai" className="social-icon" aria-label="LinkedIn"><img src={Linked} /></a>
             <a href="https://www.reddit.com/user/Simbli_ai/" className="social-icon" aria-label="reddit">
              <svg  width="26" height="26" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.47884 13.2917C7.84726 13.2917 7.33301 12.7774 7.33301 12.1458C7.33301 11.5142 7.84726 11 8.47884 11C9.11042 11 9.62467 11.5142 9.62467 12.1458C9.62467 12.7774 9.11042 13.2917 8.47884 13.2917Z" fill="white"/>
<path d="M13.7229 14.7537C13.8393 14.8702 13.8384 15.0581 13.7229 15.1736C12.941 15.9546 11.4423 16.0151 11.0013 16.0151C10.5604 16.0151 9.06167 15.9546 8.28067 15.1736C8.16426 15.0572 8.16426 14.8702 8.28067 14.7537C8.39709 14.6373 8.58409 14.6373 8.70051 14.7537C9.19367 15.2469 10.2478 15.4211 11.0013 15.4211C11.7548 15.4211 12.809 15.246 13.3031 14.7528C13.4195 14.6373 13.6074 14.6373 13.7229 14.7537Z" fill="white"/>
<path d="M14.6667 12.1458C14.6667 12.7783 14.1524 13.2917 13.5208 13.2917C12.8883 13.2917 12.375 12.7774 12.375 12.1458C12.375 11.5142 12.8892 11 13.5208 11C14.1524 11 14.6667 11.5142 14.6667 12.1458Z" fill="white"/>
<path d="M11 0C4.92525 0 0 4.92525 0 11C0 17.0748 4.92525 22 11 22C17.0748 22 22 17.0748 22 11C22 4.92525 17.0748 0 11 0ZM17.3773 12.4658C17.402 12.6243 17.4148 12.7847 17.4148 12.9479C17.4148 15.4156 14.542 17.4167 10.9982 17.4167C7.45433 17.4167 4.5815 15.4156 4.5815 12.9479C4.5815 12.7838 4.59525 12.6225 4.62 12.463C4.06175 12.2118 3.67217 11.6518 3.67217 11C3.67217 10.1136 4.38992 9.39583 5.27633 9.39583C5.70717 9.39583 6.09767 9.56633 6.3855 9.84317C7.4965 9.04292 9.031 8.53142 10.7388 8.48375L11.5546 4.6475C11.5702 4.57325 11.6151 4.50817 11.6783 4.46692C11.7416 4.42567 11.8195 4.411 11.8938 4.42658L14.5594 4.99308C14.7473 4.61633 15.1333 4.35417 15.5833 4.35417C16.2158 4.35417 16.7292 4.8675 16.7292 5.5C16.7292 6.1325 16.2158 6.64583 15.5833 6.64583C14.9692 6.64583 14.4714 6.16092 14.443 5.55408L12.056 5.04625L11.3254 8.48375C13.0084 8.54242 14.5191 9.05392 15.6154 9.845C15.9042 9.56725 16.2956 9.39492 16.7283 9.39492C17.6147 9.39492 18.3324 10.1127 18.3324 10.9991C18.3315 11.6545 17.9392 12.2164 17.3773 12.4658Z" fill="white"/>
</svg>

             </a>
           
          </div>
          {/* <div className='back-to-top-button'>
            <button className='back-to-top-button-text'><a href="#home" style={{textDecoration:"none", color:"#ffffff"}}>Scroll to Top</a></button>
          </div> */}
            <a  href="https://theresanaiforthat.com/ai/simbli-ai/?ref=featured&v=7816412" target="_blank" rel="nofollow"><img width="180" src="https://media.theresanaiforthat.com/featured-on-taaft.png?width=600"/></a>
        </div>

        {/* Explore Section */}
        <div className="footer-section">
          <h3 className="section-title1">Product</h3>
          <ul className="footer-links">
            <li><a href="#features" className="footer-link">Features


</a></li>
            <li><a href="#how-it-works" className="footer-link">How it Works</a></li>
            <li><a href="#pricing-plans" className="footer-link">Pricing</a></li>
            <li><a href="#testimonials" className="footer-link">Testimonials</a></li>
     
          </ul>
        </div>

        {/* Meet Your AI Team Section */}
        <div className="footer-section">
          <h3 className="section-title1">Support</h3>
          <ul className="footer-links">
            <li><a href="#faq" className="footer-link">FAQ



</a></li>
            <li><a href="https://www.simbli.ai/contact" target='_blank' className="footer-link">Contact Support</a></li>
            <li><a href={`${SIMBLI_URL}/terms-and-conditions.html`} target='_blank' className="footer-link">Terms of Service</a></li>
              <li><a href={`${SIMBLI_URL}/privacy-policy.html`} target='_blank' className="footer-link">Privacy Policy</a></li>
              <li><a href={`${SIMBLI_URL}/refund-policy.html`} target='_blank' className="footer-link">Refund Policy</a></li>
          </ul>
        </div>

        {/* Get Started Section */}
        <div className="footer-section get-started-section">
          <h3 className="section-title1">Stay Updated</h3>
          <li className='section-title2' style={{listStyle:"none"}}>Get the latest updates about
Alfred and social media
automation tips.</li>
<form onSubmit={handleSubmit} className="email-form">
            <div className="email-input-container">
              <input 
                type="email" 
                placeholder="Enter your Email" 
                className="email-input "
                value={email}
                onChange={handleEmailChange}
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                className="email-send-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M15.7378 6.26215L8.47779 11.3028L0.88412 8.7712C0.354069 8.59415 -0.00303035 8.09684 1.9383e-05 7.53814C0.00310924 6.97944 0.364302 6.48518 0.896399 6.31432L20.3108 0.0621679C20.7723 -0.0861854 21.2788 0.035563 21.6216 0.378377C21.9644 0.721191 22.0862 1.22769 21.9378 1.6892L15.6857 21.1036C15.5148 21.6357 15.0205 21.9969 14.4618 22C13.9031 22.003 13.4058 21.6459 13.2288 21.1159L10.685 13.4854L15.7378 6.26215Z" fill="#0C2A1E"/>
                  </svg>
                )}
              </button>
            </div>
            {message && (
              <div style={{minHeight:"unset !important"}} className={`email-message ${messageType}`}>
                <style>
                  {
                    `
                            .loading, .error {
margin-top:5px !important;
border-radius:5px ;
}
                    `
                  }
                </style>
                {message}
              </div>
            )}
          </form>
          {/* <button className="waitlist-button">Join Our Waitlist!</button> */}
        </div>
        
      </div>

      {/* Copyright Section */}
      <div className="copyright-section">
        <p className="copyright-text">© 2025 Simbli. All rights reserved. Built with human-like AI.</p>
      </div>
    </footer>
  );
};

export default Footer;