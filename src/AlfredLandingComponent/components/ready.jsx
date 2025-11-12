import React from 'react';
import './ready.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from 'react-router-dom';


const Ready = ({ onComplete, onSubscribe, isNewUser, isTrialUser, handleLogin, isAuthenticated }) => {
  console.log("isNewUserFromReady", isNewUser);
  console.log("isTrialUserFromReady", isTrialUser);
   const navigate = useNavigate()
  const handleGetStarted = () => {
    // Scroll to pricing plans section for non-authenticated users
    const pricingPlansSection = document.getElementById('pricing-plans');
    if (pricingPlansSection) {
      pricingPlansSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    }
  };

  return (
    <div className=" container-fluid ready-banner py-5   p-0 m-0 ">
  <div className='col-lg-7 px-1 py-lg-5 py-5'>
     <div className='ready-txt '>
        <h5>Ready to Create Smarter with Alfred?</h5>
        <p className='col-10 col-lg-10'>Join thousands of creators and businesses who save hours every
            week while growing their social media presence with AI-powered automation.</p>
     </div>
     {/* <div className='row mt-4 px-lg-4 mt-5'>
        <div className='col-lg-4 col-12 col-md-4'>
                <div className='ready-card-over'>
                    <div className='ready-card-img'>
                        <svg className='ready-cardss' viewBox="0 0 57 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36.6826 0.0996094C42.2988 0.0996094 47.0708 2.08014 51.0029 6.04297C54.935 10.0053 56.9003 14.8144 56.9004 20.4756C56.9004 26.1795 54.9348 31.0076 51.0029 34.9648C47.0708 38.9223 42.2989 40.9004 36.6826 40.9004C31.0237 40.9003 26.2341 38.922 22.3076 34.9648C18.381 31.0075 16.418 26.1796 16.418 20.4756C16.418 14.8143 18.3809 10.0053 22.3076 6.04297C26.2341 2.08055 31.0238 0.0996797 36.6826 0.0996094ZM36.6592 2.82812C31.7896 2.82812 27.6474 4.54768 24.2383 7.9834C20.8292 11.4191 19.124 15.5931 19.124 20.5C19.124 25.4069 20.8292 29.5809 24.2383 33.0166C27.6474 36.4523 31.7896 38.1719 36.6592 38.1719C41.5287 38.1718 45.6711 36.4523 49.0801 33.0166C52.489 29.581 54.1943 25.4068 54.1943 20.5C54.1943 15.5932 52.489 11.419 49.0801 7.9834C45.6711 4.54773 41.5287 2.82818 36.6592 2.82812ZM13.3125 30.8496V33.5781H3.00586V30.8496H13.3125ZM38.0117 9.78711V19.9893L38.041 20.0186L45.7607 27.7979L43.8281 29.7461L35.3057 21.083V9.78711H38.0117ZM13.3125 19.1357V21.8643H0.0996094V19.1357H13.3125ZM13.3125 7.42188V10.1504H3.00586V7.42188H13.3125Z" fill="white" stroke="#2E8759" stroke-width="0.2"/>
                        </svg>
                    </div>
                    <div className='ready-txt-per ms-1'>
                        <h6 className='mb-0'>70%</h6>
                        <p>Time Saved</p>
                    </div>
                </div>
        </div>
         <div className='col-lg-4 col-12 mt-lg-0 mt-3 col-md-4'>
                <div className='ready-card-over'>
                    <div className='ready-card-img'>
                        <svg className='ready-cardss1' viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.747 19.799C14.0491 19.799 15.1588 19.3442 16.076 18.4346C16.9928 17.525 17.66 16.4336 18.0776 15.1603L16.1329 14.67C15.8554 15.5052 15.4356 16.233 14.8733 16.8533C14.3111 17.474 13.6023 17.7843 12.747 17.7843C11.8913 17.7843 11.1824 17.474 10.6201 16.8533C10.0579 16.233 9.63804 15.5052 9.36053 14.67L7.41587 15.1603C7.83347 16.4336 8.50067 17.525 9.41747 18.4346C10.3347 19.3442 11.4445 19.799 12.747 19.799ZM20.5125 32.3268C21.8093 32.3268 23.0536 32.0531 24.2452 31.5057C25.4365 30.9582 26.5477 30.1515 27.5788 29.0855L26.1244 27.7274C25.26 28.5512 24.3532 29.1783 23.4042 29.6088C22.4551 30.0397 21.487 30.2552 20.5 30.2552C19.513 30.2552 18.5449 30.0397 17.5958 29.6088C16.6468 29.1783 15.74 28.5512 14.8756 27.7274L13.4212 29.0855C14.4903 30.1807 15.6151 30.9947 16.7958 31.5273C17.9764 32.0603 19.2153 32.3268 20.5125 32.3268ZM28.253 19.799C29.5555 19.799 30.6653 19.3442 31.5825 18.4346C32.4993 17.525 33.1665 16.4336 33.5841 15.1603L31.6395 14.67C31.362 15.5052 30.9421 16.233 30.3799 16.8533C29.8176 17.474 29.1087 17.7843 28.253 17.7843C27.3977 17.7843 26.6889 17.474 26.1267 16.8533C25.5644 16.233 25.1446 15.5052 24.8671 14.67L22.9224 15.1603C23.34 16.4336 24.0072 17.525 24.924 18.4346C25.8412 19.3442 26.9509 19.799 28.253 19.799ZM20.5074 41C17.6727 41 15.0075 40.4621 12.5118 39.3862C10.0165 38.3103 7.84581 36.8503 5.99967 35.006C4.15353 33.1618 2.69214 30.993 1.61551 28.4996C0.538504 26.0065 0 23.3425 0 20.5074C0 17.6727 0.537935 15.0075 1.61381 12.5118C2.68968 10.0165 4.14973 7.8458 5.99397 5.99967C7.83821 4.15353 10.007 2.69214 12.5004 1.61551C14.9935 0.538504 17.6575 0 20.4926 0C23.3273 0 25.9925 0.537937 28.4882 1.61381C30.9835 2.68968 33.1542 4.14973 35.0003 5.99397C36.8465 7.83821 38.3079 10.007 39.3845 12.5004C40.4615 14.9935 41 17.6575 41 20.4926C41 23.3273 40.4621 25.9925 39.3862 28.4882C38.3103 30.9835 36.8503 33.1542 35.006 35.0003C33.1618 36.8465 30.993 38.3079 28.4996 39.3845C26.0065 40.4615 23.3425 41 20.5074 41ZM20.5 38.7222C25.587 38.7222 29.8958 36.9569 33.4264 33.4264C36.9569 29.8958 38.7222 25.587 38.7222 20.5C38.7222 15.413 36.9569 11.1042 33.4264 7.57361C29.8958 4.04306 25.587 2.27778 20.5 2.27778C15.413 2.27778 11.1042 4.04306 7.57361 7.57361C4.04306 11.1042 2.27778 15.413 2.27778 20.5C2.27778 25.587 4.04306 29.8958 7.57361 33.4264C11.1042 36.9569 15.413 38.7222 20.5 38.7222Z" fill="white"/>
</svg>

                    </div>
                    <div className='ready-txt-per ms-1 pt-1'>
                        <h6 className='mb-0'>1000+</h6>
                        <p>Happy Users</p>
                    </div>
                </div>
        </div>
         <div className='col-lg-4 col-12  mt-lg-0 mt-3 col-md-4'>
                <div className='ready-card-over'>
                    <div className='ready-card-img'>
                       <svg className='ready-cardss1' viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.83681 40.375C2.74352 40.375 1.83073 40.0089 1.09844 39.2766C0.366146 38.5443 0 37.6315 0 36.5382V6.21181C0 5.11852 0.366146 4.20573 1.09844 3.47344C1.83073 2.74115 2.74352 2.375 3.83681 2.375H25.9421V4.75H3.83681C3.47106 4.75 3.13599 4.9022 2.83159 5.20659C2.5272 5.51099 2.375 5.84606 2.375 6.21181V36.5382C2.375 36.9039 2.5272 37.239 2.83159 37.5434C3.13599 37.8478 3.47106 38 3.83681 38H34.1632C34.5289 38 34.864 37.8478 35.1684 37.5434C35.4728 37.239 35.625 36.9039 35.625 36.5382V14.4329H38V36.5382C38 37.6315 37.6339 38.5443 36.9016 39.2766C36.1693 40.0089 35.2565 40.375 34.1632 40.375H3.83681ZM10.6875 32.0625V29.6875H27.3125V32.0625H10.6875ZM10.6875 24.9375V22.5625H27.3125V24.9375H10.6875ZM10.6875 17.8125V15.4375H27.3125V17.8125H10.6875ZM33.25 11.875V7.125H28.5V4.75H33.25V0H35.625V4.75H40.375V7.125H35.625V11.875H33.25Z" fill="white"/>
</svg>

                    </div>
                    <div className='ready-txt-per ms-1 pt-1'>
                        <h6 className='mb-0'>50k+</h6>
                        <p>Posts Created</p>
                    </div>
                </div>
        </div>
     </div> */}
     <div className="alfred-banner-buttons d-flex align-items-center justify-content-center pt-lg-3 pt-3">
        {!isAuthenticated  ? (
          <button className="alfred-btn-primary mt-lg-4" onClick={handleGetStarted}>Start Free Trial – Get Started in Minutes</button>
        ) : (
          <button className="alfred-btn-primary mt-lg-4" onClick={()=> navigate("/dashboard?tab=billing")}>Subscribe Now – Get Started in Minutes</button>
        )}
    </div>
    </div>
    </div>
  );
};

export default Ready;
