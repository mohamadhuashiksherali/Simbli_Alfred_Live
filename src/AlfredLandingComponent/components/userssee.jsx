import React, { useEffect, useRef } from 'react';
import './userssee.css';


const UsersSee = () => {
  const carouselRef = useRef(null);

  useEffect(() => {
    // Wait for DOM to be ready and libraries to load
    const initOwlCarousel = () => {
      if (window.$ && window.$.fn.owlCarousel && carouselRef.current) {
        // Destroy existing carousel if it exists
        if (window.$('.testimonials-carousel').data('owl.carousel')) {
          window.$('.testimonials-carousel').trigger('destroy.owl.carousel');
        }

        // Initialize new carousel
        window.$('.testimonials-carousel').owlCarousel({
          items: 2.3,
          loop: true,
          margin: 30,
          nav: false,
          dots: true,
          dotsEach: 1,
          autoplay: true,
          autoplayTimeout: 5000,
          autoplayHoverPause: true,
          center: false,
          mouseDrag: true,
          touchDrag: true,
          pullDrag: true,
          freeDrag: false,
          responsive: {
            0: {
              items: 1,
              margin: 20,
              dotsEach: 1
            },
            768: {
              items: 1.3,
              margin: 25,
              dotsEach: 1
            },
            1024: {
              items: 2.3,
              margin: 30,
              dotsEach: 1
            }
          }
        });
      } else {
        // Retry if jQuery/Owl Carousel not loaded yet
        setTimeout(initOwlCarousel, 200);
      }
    };

    // Use a longer delay to ensure everything is loaded
    const timer = setTimeout(initOwlCarousel, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (window.$ && window.$('.testimonials-carousel').data('owl.carousel')) {
        window.$('.testimonials-carousel').trigger('destroy.owl.carousel');
      }
    };
  }, []);

  // Testimonials data array - you can easily add more cards here
  const testimonialsData = [
    {
      id: 1,
      name: "Sarah Jenkins",
      title: "Marketing Director,Zenith Agency",
      quote: "Alfred is our content scaling secret weapon.The AI drafting is surprisingly accurate and cutsour creation time by 60%. Scheduling across LinkedIn, Instagram, and Facebook is flawless and keeps our campaigns consistent.",
      avatar: "SJ",
      avatarColor: "#E94E9F"
    },
    {
      id: 2,
      name: "Marcus Chen",
      title: "Independent Consultant",
      quote: "I finally have an AI that understands my professional brand voice. It drafts tailored posts for all four platforms automatically, so I can stop wasting time on manual re-writes. Truly acreative assistant that never sleeps.",
      avatar: "MC",
      avatarColor: "#4285F4"
    },
    {
      id: 3,
      name: "Alicia Gomez",
      title: "Social Media Manager, Retail",
      quote: "The multi-platform scheduling is a game-changer for our small team. I can manage an entire week's content for Facebook, Twitter,and more in under an hour. It's incredibly reliable, and the publishing is always on time.",
      avatar: "AG",
      avatarColor: "#F9A825"
    },
    {
      id: 4,
      name: "Kevin O’Malley",
      title: "Founder, Tech Startup",
      quote: "It removed my biggest roadblock: the fear of content block. I give Alfred a single topic, and it drafts multiple variations for LinkedIn and Twitter instantly. This tool ensures we always maintain a professional and active presence.",
      avatar: "KM",
      avatarColor: "#F9A825"
    },
    {
      id: 5,
      name: "Chloe Davis",
      title: "E-commerce Store Owner",
      quote: "The drafting feature is intuitive and a huge budget saver. I no longer need a freelance copywriter for our daily Instagram and Facebook posts. We're posting more consistently, and the AI suggestions are always highly relevant.",
      avatar: "CD",
      avatarColor: "#F9A825"
    },
  
  ];

  return (

    <>


       {/* Testimonials Carousel */}
       <div className="testimonal-back py-5 ps-lg-5">
          <div className='testimonal-text-txt py-4 px-2'>
            <h6>Trusted by Professionals Worldwide</h6>
            <p>Join a thriving community of creators and businesses who are saving valuable time and accelerating their growth with Alfred's intelligent automation.</p>
          </div>
         <div ref={carouselRef} className="testimonials-carousel owl-carousel pt-lg-4 ps-3 ps-lg-5 pb-5">
           {testimonialsData.map((testimonial) => (
             <div key={testimonial.id} className='items '>
               <div className="testimonal-card px-lg-4 py-5 px-3">
                 <div className='avatar' style={{backgroundColor: testimonial.avatarColor}}>
                   {testimonial.avatar}
                 </div>
                 <div className="review d-flex mt-2">
                   <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M0 0H18V18H0V0Z" fill="#FF8800" />
                     <path d="M9.2999 12.0935L12.0374 11.3996L13.1814 14.9247L9.2999 12.0935ZM15.5998 7.53734H10.781L9.2999 3L7.81882 7.53734H3L6.8999 10.3498L5.41882 14.8871L9.31872 12.0747L11.7187 10.3498L15.5998 7.53734Z" fill="white" />
                   </svg>
                   <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M0 0H18V18H0V0Z" fill="#FF8800" />
                     <path d="M9.2999 12.0935L12.0374 11.3996L13.1814 14.9247L9.2999 12.0935ZM15.5998 7.53734H10.781L9.2999 3L7.81882 7.53734H3L6.8999 10.3498L5.41882 14.8871L9.31872 12.0747L11.7187 10.3498L15.5998 7.53734Z" fill="white" />
                   </svg>
                   <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M0 0H18V18H0V0Z" fill="#FF8800" />
                     <path d="M9.2999 12.0935L12.0374 11.3996L13.1814 14.9247L9.2999 12.0935ZM15.5998 7.53734H10.781L9.2999 3L7.81882 7.53734H3L6.8999 10.3498L5.41882 14.8871L9.31872 12.0747L11.7187 10.3498L15.5998 7.53734Z" fill="white" />
                   </svg>
                   <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M0 0H18V18H0V0Z" fill="#FF8800" />
                     <path d="M9.2999 12.0935L12.0374 11.3996L13.1814 14.9247L9.2999 12.0935ZM15.5998 7.53734H10.781L9.2999 3L7.81882 7.53734H3L6.8999 10.3498L5.41882 14.8871L9.31872 12.0747L11.7187 10.3498L15.5998 7.53734Z" fill="white" />
                   </svg>
                   <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M0 0H18V18H0V0Z" fill="#FF8800" />
                     <path d="M9.2999 12.0935L12.0374 11.3996L13.1814 14.9247L9.2999 12.0935ZM15.5998 7.53734H10.781L9.2999 3L7.81882 7.53734H3L6.8999 10.3498L5.41882 14.8871L9.31872 12.0747L11.7187 10.3498L15.5998 7.53734Z" fill="white" />
                   </svg>
                 </div>
                 <div className='testimonal-txt'>
                   <h5 className='pt-1 mb-0'>{testimonial.name}</h5>
                   <p>({testimonial.title})</p>
                   <h6>"{testimonial.quote}"</h6>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
    </>
  );
};

export default UsersSee;
