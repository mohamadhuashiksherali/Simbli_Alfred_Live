// SweetAlert Utility Functions for Better Design

export const showInvalidCouponAlert = (message = "This coupon code is not valid") => {
  return Swal.fire({
    title: "Invalid Coupon",
    text: message,
    icon: "error",
    confirmButtonText: "Try Again",
    confirmButtonColor: "#e53e3e",
    customClass: {
      popup: 'swal-custom-popup',
      title: 'swal-custom-title',
      content: 'swal-custom-content',
      confirmButton: 'swal-custom-button'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    },
    buttonsStyling: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true
  });
};

export const showSuccessAlert = (title, text, confirmText = "Great!") => {
  return Swal.fire({
    title: title,
    text: text,
    icon: "success",
    confirmButtonText: confirmText,
    confirmButtonColor: "#38a169",
    customClass: {
      popup: 'swal-custom-popup swal-success-popup',
      title: 'swal-custom-title',
      content: 'swal-custom-content',
      confirmButton: 'swal-custom-button swal-success-button'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    },
    buttonsStyling: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true
  });
};

export const showWarningAlert = (title, text, confirmText = "Got it") => {
  return Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    confirmButtonText: confirmText,
    confirmButtonColor: "#ed8936",
    customClass: {
      popup: 'swal-custom-popup swal-warning-popup',
      title: 'swal-custom-title',
      content: 'swal-custom-content',
      confirmButton: 'swal-custom-button swal-warning-button'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    },
    buttonsStyling: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true
  });
};

export const showInfoAlert = (title, text, confirmText = "OK") => {
  return Swal.fire({
    title: title,
    text: text,
    icon: "info",
    confirmButtonText: confirmText,
    confirmButtonColor: "#3182ce",
    customClass: {
      popup: 'swal-custom-popup swal-info-popup',
      title: 'swal-custom-title',
      content: 'swal-custom-content',
      confirmButton: 'swal-custom-button swal-info-button'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    },
    buttonsStyling: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true
  });
};

export const showCustomAlert = (config) => {
  const defaultConfig = {
    customClass: {
      popup: 'swal-custom-popup',
      title: 'swal-custom-title',
      content: 'swal-custom-content',
      confirmButton: 'swal-custom-button'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    },
    buttonsStyling: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true
  };

  return Swal.fire({
    ...defaultConfig,
    ...config
  });
};


