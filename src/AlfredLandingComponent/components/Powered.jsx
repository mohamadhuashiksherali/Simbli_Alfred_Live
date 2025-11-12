import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Powered.css';

// Import images
import aryshareLogo from '../assets/images/aryshare.png';
import razorpayLogo from '../assets/images/razorppay.png';
import linkedinLogo from '../assets/images/linkedin.png';
import instagramLogo from '../assets/images/instagram.png';
import twitterLogo from '../assets/images/twitter.png';
import facebookLogo from '../assets/images/facebook.png';

const Powered = () => {
  const technologies = [
  {
    id: 1,
    name: "Ayrshare",
    category: "Social API",
    logo: <img src={aryshareLogo} alt="Ayrshare"className="social-png" />
  },
  {
    id: 2,
    name: "Razorpay",
    category: "Payments",
    logo: <img src={razorpayLogo} alt="Razorpay" className="social-png" />
  },
  {
    id: 3,
    name: "LinkedIn",
    category: "Social Media",
    logo: <img src={linkedinLogo} alt="LinkedIn" className="social-png" />
  },
  {
    id: 4,
    name: "Instagram",
    category: "Social Media",
    logo: <img src={instagramLogo} alt="Instagram" className="social-png" />
  },
  {
    id: 5,
    name: "X",
    category: "Social Media",
    logo: <img src={twitterLogo} alt="X" className="social-png" />
  },
  {
    id: 6,
    name: "Facebook",
    category: "Social Media",
    logo: <img src={facebookLogo} alt="Facebook" className="social-png" />
  }
];

  return (
    <section className="powered-section pt-5 px-lg-5 px-2">
      <div className="powered-container">
        <h2 className="powered-title">Powered by industry-leading technologies</h2>
        
        <div className="powered-slider px-lg-4">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={true}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              480: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              640: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 5,
                spaceBetween: 20,
              },
              1200: {
                slidesPerView: 6,
                spaceBetween: 20,
              },
            }}
            className="powered-swiper"
          >
            {technologies.map((tech) => (
              <SwiperSlide key={tech.id}>
                <div className="powered-card">
                  <div className="powered-logo">
                    {tech.logo}
                  </div>
                  <h3 className="powered-name">{tech.name}</h3>
                  <p className="powered-category">{tech.category}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Powered;
