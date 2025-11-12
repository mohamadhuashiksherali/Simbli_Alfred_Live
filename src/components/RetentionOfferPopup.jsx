import React, { useEffect ,useRef} from 'react';
import './RetentionOfferPopup.css';
import confetti from 'canvas-confetti';
import gift from "../assets/giftboxpop.svg";

const RetentionOfferPopup = ({
  isOpen,
  onClose,
  onAcceptOffer,
  onContinueCancellation,
  offerAlreadyApplied = false
}) => {
  console.log('RetentionOfferPopup - offerAlreadyApplied:', offerAlreadyApplied);
  console.log('RetentionOfferPopup - isOpen:', isOpen);
  console.log('RetentionOfferPopup - Button should be disabled:', offerAlreadyApplied);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Create confetti instance with custom canvas
      const myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true
      });

       // Trigger confetti with extra papers
       myConfetti({
         particleCount: 50,
         spread: 55,
         origin: { y: 0.6 },
         colors: ['#7DDD7D', '#54C754', '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'],
         scalar: 0.8,
         gravity: 0.8,
         drift: 0.1
       });
    }
  }, [isOpen]);

  // Check retention status when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('RetentionOfferPopup - Popup opened, checking retention status...');
      console.log('RetentionOfferPopup - Current offerAlreadyApplied:', offerAlreadyApplied);
    }
  }, [offerAlreadyApplied]);
  
  if (!isOpen) return null;

  return (
    <div className="retention-offer-overlay">
      <canvas
        ref={canvasRef}
        className="retention-confetti-canvas"
      />
      <div className="retention-offer-container">
        <button 
          className="retention-offer-close"
          onClick={onClose}
          aria-label="Close"
        >
              <svg width="13" height="13" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 1L1 16M1 1L16 16" stroke="#545454" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
        </button>

        {/* Decorative Elements */}
        {!offerAlreadyApplied && (
          <>
        <div className="retention-offer-decorations">
          <div className="retention-gift-box">
            <img src={gift} alt="Gift box" />
          </div>
        </div>
          </>

        )}

        {/* Header */}
        <div className="retention-offer-header">
          {
            offerAlreadyApplied ? (<>
              <h1>Don't Forget Your Applied Discount!</h1>
              <p className="retention-offer-subtitle mt-2">
                Final Warning: Active Discount Will Be Lost.<br /> Before cancelling, please be aware of your current active retention offer.


              </p>
            </>) : (<>
          <h2 className="retention-offer-title">
            Wait! Before You Go...
          </h2>
          <p className="retention-offer-subtitle">
            Here's an exclusive offer just for you!
          </p>
          </>)
          }

        </div>

        {/* Offer Box */}
        <div className="retention-offer-box">
          {
            offerAlreadyApplied ? (<><div className="retention-offer-main-text">
              Discount Already Applied
            </div>
              <div className="retention-offer-description">
                Your 50% OFF for the next billing cycle is already active.
              </div> </>) : (<><div className="retention-offer-main-text">
                Claim 50% OFF for 1 Month
              </div>
                <div className="retention-offer-description">
                  Enjoy 50% OFF for your next billing cycle.
                </div></>)

          }

        </div>

        {/* Timer */}
        <div className="retention-offer-timer">

          {
            offerAlreadyApplied ? (<> <div className="retention-timer-icon">
              <svg width="16" height="16" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.7 9.5L18.7005 11.5L16.7 9.5M18.9451 11C18.9814 10.6717 19 10.338 19 10C19 5.02944 14.9706 1 10 1C5.02944 1 1 5.02944 1 10C1 14.9706 5.02944 19 10 19C12.8273 19 15.35 17.6963 17 15.6573M10 5V10L13 12" stroke="#505050" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

            </div>
              <span className="retention-timer-text">
                The offer will be permanently removed if you proceed with cancellation.
              </span></>) : (<> <div className="retention-timer-icon">
                <svg width="16" height="16" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.7 9.5L18.7005 11.5L16.7 9.5M18.9451 11C18.9814 10.6717 19 10.338 19 10C19 5.02944 14.9706 1 10 1C5.02944 1 1 5.02944 1 10C1 14.9706 5.02944 19 10 19C12.8273 19 15.35 17.6963 17 15.6573M10 5V10L13 12" stroke="#505050" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

              </div>
                <span className="retention-timer-text">
                  Offer valid for the next 24 hours
                </span></>)
          }

        </div>

        {/* Action Buttons */}
        <div className="retention-offer-actions">
          <button
            className={`retention-accept-btn `}
            onClick={offerAlreadyApplied ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose()
              // console.log('RetentionOfferPopup - Button clicked but offer already applied, preventing action');
              // alert('Retention offer has already been applied for this user!');
            } : (e) => {
              console.log('RetentionOfferPopup - Button clicked, offer not applied, proceeding with acceptance');
              onAcceptOffer(e);
            }}
            // disabled={offerAlreadyApplied}
            // style={offerAlreadyApplied ? {
            //   cursor: 'not-allowed',
            //   opacity: 0.6,
            // } : {}}
          >
            <div className="retention-check-icon">
             <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 11L10 13L14.5 8.5M16.9012 3.99851C17.1071 4.49653 17.5024 4.8924 18.0001 5.09907L19.7452 5.82198C20.2433 6.02828 20.639 6.42399 20.8453 6.92206C21.0516 7.42012 21.0516 7.97974 20.8453 8.47781L20.1229 10.2218C19.9165 10.7201 19.9162 11.2803 20.1236 11.7783L20.8447 13.5218C20.9469 13.7685 20.9996 14.0329 20.9996 14.2999C20.9997 14.567 20.9471 14.8314 20.8449 15.0781C20.7427 15.3249 20.5929 15.549 20.4041 15.7378C20.2152 15.9266 19.991 16.0764 19.7443 16.1785L18.0004 16.9009C17.5023 17.1068 17.1065 17.5021 16.8998 17.9998L16.1769 19.745C15.9706 20.2431 15.575 20.6388 15.0769 20.8451C14.5789 21.0514 14.0193 21.0514 13.5212 20.8451L11.7773 20.1227C11.2792 19.9169 10.7198 19.9173 10.2221 20.1239L8.47689 20.8458C7.97912 21.0516 7.42001 21.0514 6.92237 20.8453C6.42473 20.6391 6.02925 20.2439 5.82281 19.7464L5.09972 18.0006C4.8938 17.5026 4.49854 17.1067 4.00085 16.9L2.25566 16.1771C1.75783 15.9709 1.36226 15.5754 1.15588 15.0777C0.94951 14.5799 0.94923 14.0205 1.1551 13.5225L1.87746 11.7786C2.08325 11.2805 2.08283 10.7211 1.8763 10.2233L1.15497 8.47678C1.0527 8.2301 1.00004 7.96568 1 7.69863C0.99996 7.43159 1.05253 7.16715 1.15472 6.92043C1.25691 6.67372 1.40671 6.44955 1.59557 6.26075C1.78442 6.07195 2.00862 5.92222 2.25537 5.8201L3.9993 5.09772C4.49687 4.89197 4.89248 4.4972 5.0993 4.00006L5.82218 2.25481C6.02848 1.75674 6.42418 1.36103 6.92222 1.15473C7.42027 0.948422 7.97987 0.948422 8.47792 1.15473L10.2218 1.87712C10.7199 2.08291 11.2793 2.08249 11.7771 1.87595L13.523 1.15585C14.021 0.949662 14.5804 0.949703 15.0784 1.15597C15.5763 1.36223 15.972 1.75783 16.1783 2.25576L16.9014 4.00153L16.9012 3.99851Z" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

            </div>
            {offerAlreadyApplied ? 'Keep Discount & Stay' : 'Enjoy 50% OFF for 1 Month'}
          </button>
          <button 
            className="retention-continue-btn"
            onClick={onContinueCancellation}
          >
            Continue Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetentionOfferPopup;