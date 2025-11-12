import React, { useState } from "react";
import PricingPopup from "./PricingPopup";

const PricingPopupDemo = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <button onClick={openPopup} className="pricing-popup-trigger-btn">
        Open Pricing Popup
      </button>

      <PricingPopup
        isOpen={isPopupOpen}
        onClose={closePopup}
        credits={50}
        maxCredits={100}
      />
    </div>
  );
};

export default PricingPopupDemo;
