import React, { createContext, useContext, useState } from "react";

const AyrshareConnectionContext = createContext();

export const useAyrshareConnection = () => {
  const context = useContext(AyrshareConnectionContext);
  if (!context) {
    throw new Error("useAyrshareConnection must be used within an AyrshareConnectionProvider");
  }
  return context;
};

export const AyrshareConnectionProvider = ({ children }) => {
  // Store platform loading states - persists across component remounts
  const [platformLoading, setPlatformLoading] = useState({});
  
  // Store popup window references - persists across component remounts
  const [popupWindowRefs, setPopupWindowRefs] = useState({});
  
  // Store publishing states - persists across component remounts
  const [publishing, setPublishing] = useState(false);
  const [publishingContentId, setPublishingContentId] = useState(null);
  
  // Store chat loading states - persists across component remounts
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [uploading, setUploading] = useState(false);

  const setPlatformLoadingState = (platform, isLoading) => {
    setPlatformLoading((prev) => {
      const updated = { ...prev };
      if (isLoading) {
        updated[platform] = true;
      } else {
        delete updated[platform];
      }
      return updated;
    });
  };

  const setPopupWindowRef = (platform, windowRef) => {
    setPopupWindowRefs((prev) => {
      const updated = { ...prev };
      if (windowRef) {
        updated[platform] = windowRef;
      } else {
        delete updated[platform];
      }
      return updated;
    });
  };

  const getPopupWindowRef = (platform) => {
    return popupWindowRefs[platform] || null;
  };

  const clearPlatformLoading = (platform) => {
    setPlatformLoadingState(platform, false);
    setPopupWindowRef(platform, null);
  };

  const clearAllPlatformLoading = () => {
    setPlatformLoading({});
    setPopupWindowRefs({});
  };
  
  const setPublishingState = (isPublishing, contentId = null) => {
    setPublishing(isPublishing);
    setPublishingContentId(contentId);
  };
  
  const clearPublishingState = () => {
    setPublishing(false);
    setPublishingContentId(null);
  };
  
  // Loading images helper functions
  const addLoadingImage = (contentId) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(contentId);
      return newSet;
    });
  };
  
  const removeLoadingImage = (contentId) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(contentId);
      return newSet;
    });
  };
  
  const clearAllLoadingImages = () => {
    setLoadingImages(new Set());
  };

  return (
    <AyrshareConnectionContext.Provider
      value={{
        platformLoading,
        setPlatformLoadingState,
        clearPlatformLoading,
        clearAllPlatformLoading,
        setPopupWindowRef,
        getPopupWindowRef,
        publishing,
        publishingContentId,
        setPublishingState,
        clearPublishingState,
        chatLoading,
        setChatLoading,
        loadingImages,
        addLoadingImage,
        removeLoadingImage,
        clearAllLoadingImages,
        uploading,
        setUploading,
      }}
    >
      {children}
    </AyrshareConnectionContext.Provider>
  );
};

