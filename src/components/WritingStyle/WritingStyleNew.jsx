
import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getAyrshareProfile, getLatestWritingStyleAnalysis, analyzeWritingStyle, updateCompanyDetails } from "../../api/api";
import "./WritingStyleNew.css";

const WritingStyleNew = ({ isAnalyzingWritingStyle }) => {
  const [isWritingStyleOpen, setIsWritingStyleOpen] = useState(false);
  const [isContentPerformanceOpen, setIsContentPerformanceOpen] =
    useState(true);
  const [isPatternsInsightsOpen, setIsPatternsInsightsOpen] = useState(true);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(true);
  
  // API integration state
  const [writingStyle, setWritingStyle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [ayrshareProfile, setAyrshareProfile] = useState(null);
  const [formattedStyle, setFormattedStyle] = useState(null);
  const [companyDetails, setCompanyDetails] = useState({
    company_name: "",
    role:"",
    company_description: "",
   
  });
  const [originalCompanyDetails, setOriginalCompanyDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleWritingStyle = () => {
    setIsWritingStyleOpen(!isWritingStyleOpen);
  };

  const toggleContentPerformance = () => {
    setIsContentPerformanceOpen(!isContentPerformanceOpen);
  };

  const togglePatternsInsights = () => {
    setIsPatternsInsightsOpen(!isPatternsInsightsOpen);
  };

  const toggleCompanyDetails = () => {
    setIsCompanyDetailsOpen(!isCompanyDetailsOpen);
  };

  const handleCompanyDetailsChange = (field, value) => {
    setCompanyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCompanyDetails = async () => {
    try {
      setIsSaving(true);

      const response = await updateCompanyDetails(companyDetails);
      
      // Success - immediately update UI to show Save button disappeared and Edit button shows
      setOriginalCompanyDetails({ ...companyDetails });
      setIsEditing(false);
      setError(null);
      
      console.log("Company details saved successfully:", response);
    } catch (error) {
      console.error("Error saving company details:", error);
      setError(error.response?.data?.detail || "Failed to save company details");
      // Keep isEditing true so user can continue editing on error
      setIsSaving(false);
      return; // Exit early on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    if (originalCompanyDetails) {
      setCompanyDetails({ ...originalCompanyDetails });
    }
  };

  const handleEditClick = () => {
    // Save current state as original when starting edit
    setOriginalCompanyDetails({ ...companyDetails });
    setIsEditing(true);
  };

  // Data fetching functions
  const fetchAyrshareProfile = async () => {
    try {
      const response = await getAyrshareProfile();
      if (response.data) {
        setAyrshareProfile(response.data);
      }
    } catch (error) {
      console.log("No Ayrshare profile found");
    }
  };

  const fetchWritingStyle = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLatestWritingStyleAnalysis("linkedin");
      if (response.data && response.data.status === "success") {
        setWritingStyle(response.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        setError("Failed to fetch writing style analysis");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWritingStyle = async () => {
    if (!ayrshareProfile?.profile_key) {
      setError("Please connect your Ayrshare profile first");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const response = await analyzeWritingStyle(
        ayrshareProfile.profile_key,
        "linkedin",
        12
      );

      if (response.data && response.data.status === "success") {
        setWritingStyle(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to analyze writing style");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatWritingStyle = (styleData) => {
    if (!styleData || !styleData.writing_style) return null;

    const { ai_analysis, metrics, content_patterns } = styleData.writing_style;
    
    if (!ai_analysis) return null;

    return {
      comprehensive_analysis: ai_analysis,
      metrics,
      content_patterns
    };
  };

  // useEffect hooks
  useEffect(() => {
    fetchAyrshareProfile();
    fetchWritingStyle();
  }, []);

  // Watch for isAnalyzingWritingStyle changes and refresh data when analysis completes
  useEffect(() => {
    console.log("isAnalyzingWritingStyle 11111111111111111", isAnalyzingWritingStyle);
    if (isAnalyzingWritingStyle) {
      console.log("Writing style analysis completed, refreshing data...");
      // Refresh both Ayrshare profile and writing style data
      fetchAyrshareProfile();
      fetchWritingStyle();
    }
  }, [isAnalyzingWritingStyle]);

  // Update formattedStyle whenever writingStyle changes
  useEffect(() => {
    const formatted = formatWritingStyle(writingStyle);
    setFormattedStyle(formatted);
    
    // Extract company details from API response if available
    // Only update if not currently editing and we don't already have company details loaded
    // This prevents overwriting saved values after editing
    if (writingStyle) {
      if (writingStyle?.writing_style?.company_details) {
        setCompanyDetails(writingStyle.writing_style.company_details);
        setOriginalCompanyDetails(writingStyle.writing_style.company_details);
      } else if (writingStyle?.company_details) {
        setCompanyDetails(writingStyle.company_details);
        setOriginalCompanyDetails(writingStyle.company_details);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writingStyle]); // Only trigger when writingStyle changes

  return (
    <div className="writing-style-container mt-4">
    <style>
      {

           `
           .header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
           `}
    </style>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="43"
              height="43"
              viewBox="0 0 43 43"
              fill="none"
            >
              <circle cx="21.5" cy="21.5" r="21.5" fill="#EFFBEF" />
              <path
                d="M31 28.1213L29.9999 29.2153C29.4695 29.7954 28.7502 30.1213 28.0002 30.1213C27.2501 30.1213 26.5308 29.7954 26.0004 29.2153C25.4693 28.6364 24.75 28.3114 24.0002 28.3114C23.2504 28.3114 22.5312 28.6364 22 29.2153M13 30.1213H14.6745C15.1637 30.1213 15.4083 30.1213 15.6385 30.066C15.8426 30.017 16.0376 29.9362 16.2166 29.8266C16.4184 29.7029 16.5914 29.5299 16.9373 29.184L29.5001 16.6213C30.3285 15.7929 30.3285 14.4497 29.5001 13.6213C28.6716 12.7929 27.3285 12.7929 26.5001 13.6213L13.9373 26.184C13.5914 26.5299 13.4184 26.7029 13.2947 26.9047C13.1851 27.0837 13.1042 27.2787 13.0553 27.4828C13 27.713 13 27.9576 13 28.4468V30.1213Z"
                stroke="#34C334"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="header-title5 pb-1">Writing Style Analysis</h1>
            <div>
              <p className="header-subtitle">
                AI-Powered Analysis to Optimize Your Writing Style Across All Connected Platforms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Writing Style Section */}
      <div className="writing-style-summary">
        <div className="summary-content">
          <div className="summary-text">
            <h3 className="summary-title">Your Writing Style</h3>
            <p className="summary-subtitle">
              Based on {writingStyle?.posts_analyzed || 12} recent LinkedIn posts
            </p>
          </div>
          <button 
            className="refresh-button" 
            onClick={handleAnalyzeWritingStyle}
            disabled={analyzing}
          >
            <span className="refresh-icon">
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </span>
            {analyzing ? "Analyzing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Writing Style Analysis Accordion */}
      <div className="accordion-section">
        <div className="accordion-header" onClick={toggleWritingStyle}>
          <h3 className="accordion-title">Writing Style Analysis</h3>
          <i
            className={`fa-solid fa-chevron-down accordion-icon ${
              isWritingStyleOpen ? "open" : ""
            }`}
          ></i>
        </div>
        {isWritingStyleOpen && (
          <div className="accordion-content ps-lg-5 pb-4">
            {((!formattedStyle && isAnalyzingWritingStyle) || loading) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#84E084]" />
                <span className="ml-2 text-[#515151]">Loading writing style...</span>
              </div>
            ) : !formattedStyle ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No writing style analysis available</p>
                <button
                  onClick={handleAnalyzeWritingStyle}
                  disabled={analyzing || !ayrshareProfile?.profile_key}
                  className="bg-[#84E084] text-white px-4 py-2 rounded-md hover:bg-[#6BC46B] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? "Analyzing..." : "Analyze Writing Style"}
                </button>
              </div>
            ) : (
              <div className="analysis-section">
                <p className="analysis-text">
                   {formattedStyle.comprehensive_analysis ? (
              <div className="text-gray-700 leading-relaxed">
                {formattedStyle.comprehensive_analysis.split('\n').map((line, index) => {
                  // Convert ### headers to bold headers
                  if (line.trim().startsWith('### ')) {
                    return (
                      <div key={index} className="font-bold text-lg text-gray-800 mt-6 mb-2">
                        {line.replace('### ', '')}
                      </div>
                    );
                  }
                  // Convert **bold** text to bold
                  if (line.includes('**')) {
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <div key={index} className="mb-2">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <span key={partIndex} className="font-bold text-gray-800 writingstyle-head" style={{fontWeight:"600 !important"}}>
                                {part.slice(2, -2)}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </div>
                    );
                  }
                  // Regular text
                  return (
                    <div key={index} className="mb-2">
                      {line}
                    </div>
                  );
                })}
              </div>
            ) : formattedStyle.sections && formattedStyle.sections.length > 0 ? (
              <>
                {formattedStyle.sections.map((section, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-[#84E084] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <h5 className="text-base font-semibold text-gray-800">
                        {section.title}
                      </h5>
                    </div>
                    <div className="ml-11">
                      <p className="text-gray-700 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Overall Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#84E084] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <h5 className="text-base font-semibold text-gray-800">
                      Overall Style Summary
                    </h5>
                  </div>
                  <div className="ml-11">
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {formattedStyle.sections[formattedStyle.sections.length - 1]?.content || 
                       "Your writing style combines professional insights with engaging storytelling, creating content that resonates with your LinkedIn audience."}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-600">No analysis available</p>
            )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Performance Metrics */}
      <div className="accordion-section">
        <div className="accordion-header" onClick={toggleContentPerformance}>
          <h3 className="accordion-title">Content Performance Metrics</h3>
          <i
            className={`fa-solid fa-chevron-down accordion-icon ${
              isContentPerformanceOpen ? "open" : ""
            }`}
          ></i>
        </div>
        {isContentPerformanceOpen && (
          <div className="accordion-content">
            {((!formattedStyle?.metrics && isAnalyzingWritingStyle) || loading) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#84E084]" />
                <span className="ml-2 text-[#515151]">Loading metrics...</span>
              </div>
            ) : !formattedStyle?.metrics ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No performance metrics available</p>
              </div>
            ) : (
              <div className="metrics-row">
                <div className="row g-2">
                  <div className="col-xl-4 col-lg-6 col-md-6 col-6">
                    <div className="metric-card">
                      <div className="metric-icon">
                        <svg
                         className="pattern-iconss"
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                          <path
                            d="M27.6364 18.962L27.9862 16.7798C28.0779 16.2037 28.0171 15.6129 27.8101 15.0692C27.6031 14.5256 27.2575 14.0491 26.8096 13.6898C26.3617 13.3304 25.828 13.1014 25.2643 13.0267C24.7007 12.9521 24.1278 13.0345 23.6058 13.2654C22.8844 13.5979 22.3048 14.1878 21.9746 14.9258L20.0332 18.962H15.1229C14.2947 18.962 13.5003 19.3 12.9147 19.9015C12.329 20.5031 12 21.3189 12 22.1696V31.7924C12 32.6431 12.329 33.459 12.9147 34.0605C13.5003 34.6621 14.2947 35 15.1229 35H34.9201L36.9833 23.1993L37 18.962H27.6364ZM14.0819 31.7924V22.1696C14.0819 21.8861 14.1916 21.6141 14.3868 21.4136C14.5821 21.2131 14.8468 21.1004 15.1229 21.1004H19.2868V32.8616H15.1229C14.8468 32.8616 14.5821 32.749 14.3868 32.5484C14.1916 32.3479 14.0819 32.076 14.0819 31.7924ZM34.9014 22.9181L33.163 32.8616H21.3688V21.0031L23.8869 15.7641C23.9721 15.6056 24.0928 15.4702 24.2389 15.369C24.3851 15.2677 24.5525 15.2036 24.7275 15.1817C24.9025 15.1599 25.0801 15.1811 25.2455 15.2435C25.411 15.3059 25.5597 15.4077 25.6794 15.5406C25.7817 15.6628 25.8565 15.8066 25.8984 15.9618C25.9403 16.1171 25.9484 16.2799 25.922 16.4387L25.1735 21.1004H34.9014V22.9181Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="metric-content">
                        <div className="pattern-value">{formattedStyle.metrics.average_likes || 0}</div>
                        <div className="pattern-label">Avg Likes</div>
                        <div className="pattern-sublabel">Per Post</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-6 col-md-6 col-6">
                    <div className="metric-card">
                      <div className="metric-icon">
                        <svg
                          className="pattern-iconss"
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                          <path
                            d="M32.1667 13H16.8333C15.8167 13 14.8416 13.4039 14.1228 14.1228C13.4039 14.8416 13 15.8167 13 16.8333V28.3333C13 29.35 13.4039 30.325 14.1228 31.0439C14.8416 31.7628 15.8167 32.1667 16.8333 32.1667H19.6125L23.878 35.7729C24.0511 35.9193 24.2704 35.9997 24.4971 35.9997C24.7238 35.9997 24.9432 35.9193 25.1162 35.7729L29.3875 32.1667H32.1667C33.1833 32.1667 34.1584 31.7628 34.8772 31.0439C35.5961 30.325 36 29.35 36 28.3333V16.8333C36 15.8167 35.5961 14.8416 34.8772 14.1228C34.1584 13.4039 33.1833 13 32.1667 13ZM34.0833 28.3333C34.0833 28.8417 33.8814 29.3292 33.522 29.6886C33.1625 30.0481 32.675 30.25 32.1667 30.25H29.3875C28.9345 30.2501 28.4962 30.4107 28.1503 30.7033L24.5 33.7863L20.8516 30.7033C20.5052 30.4103 20.0662 30.2497 19.6125 30.25H16.8333C16.325 30.25 15.8375 30.0481 15.478 29.6886C15.1186 29.3292 14.9167 28.8417 14.9167 28.3333V16.8333C14.9167 16.325 15.1186 15.8375 15.478 15.478C15.8375 15.1186 16.325 14.9167 16.8333 14.9167H32.1667C32.675 14.9167 33.1625 15.1186 33.522 15.478C33.8814 15.8375 34.0833 16.325 34.0833 16.8333V28.3333Z"
                            fill="white"
                          />
                          <path
                            d="M19.7083 19.7077H24.5C24.7542 19.7077 24.9979 19.6067 25.1776 19.427C25.3574 19.2473 25.4583 19.0035 25.4583 18.7493C25.4583 18.4952 25.3574 18.2514 25.1776 18.0717C24.9979 17.892 24.7542 17.791 24.5 17.791H19.7083C19.4542 17.791 19.2104 17.892 19.0307 18.0717C18.851 18.2514 18.75 18.4952 18.75 18.7493C18.75 19.0035 18.851 19.2473 19.0307 19.427C19.2104 19.6067 19.4542 19.7077 19.7083 19.7077Z"
                            fill="white"
                          />
                          <path
                            d="M29.2917 21.625H19.7083C19.4542 21.625 19.2104 21.726 19.0307 21.9057C18.851 22.0854 18.75 22.3292 18.75 22.5833C18.75 22.8375 18.851 23.0813 19.0307 23.261C19.2104 23.4407 19.4542 23.5417 19.7083 23.5417H29.2917C29.5458 23.5417 29.7896 23.4407 29.9693 23.261C30.149 23.0813 30.25 22.8375 30.25 22.5833C30.25 22.3292 30.149 22.0854 29.9693 21.9057C29.7896 21.726 29.5458 21.625 29.2917 21.625Z"
                            fill="white"
                          />
                          <path
                            d="M29.2917 25.459H19.7083C19.4542 25.459 19.2104 25.56 19.0307 25.7397C18.851 25.9194 18.75 26.1632 18.75 26.4173C18.75 26.6715 18.851 26.9152 19.0307 27.095C19.2104 27.2747 19.4542 27.3757 19.7083 27.3757H29.2917C29.5458 27.3757 29.7896 27.2747 29.9693 27.095C30.149 26.9152 30.25 26.6715 30.25 26.4173C30.25 26.1632 30.149 25.9194 29.9693 25.7397C29.7896 25.56 29.5458 25.459 29.2917 25.459Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="metric-content">
                        <div className="pattern-value">{formattedStyle.metrics.average_comments || 0}</div>
                        <div className="pattern-label">Avg Comments</div>
                        <div className="pattern-sublabel">Per Post</div>
                      </div>
                    </div>
                  </div>
                { /* <div className="col-xl-4 col-lg-6 col-md-6 col-6">
                    <div className="metric-card">
                      <div className="metric-icon">
                        <svg
                          className="pattern-iconss"
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                          <path
                            d="M30.9787 10C27.1064 10 23.9574 13.1396 23.9574 17.0003C23.9574 20.861 27.1064 24.0006 30.9787 24.0006C34.8509 24.0006 38 20.861 38 17.0003C38 13.1396 34.8509 10 30.9787 10ZM28.6219 22.331C28.6254 22.3042 28.6382 22.2797 28.6382 22.2505V21.6672C28.6382 20.3803 29.6879 19.3337 30.9787 19.3337C32.2694 19.3337 33.3191 20.3803 33.3191 21.6672V22.2505C33.3191 22.2785 33.3308 22.303 33.3355 22.331C32.6135 22.6495 31.8189 22.8339 30.9787 22.8339C30.1385 22.8339 29.3451 22.6495 28.6219 22.331ZM34.4858 21.6403C34.4706 19.7234 32.9049 18.1682 30.9775 18.1682C29.0502 18.1682 27.4844 19.7234 27.4692 21.6403C26.0556 20.5739 25.1264 18.9009 25.1264 17.0015C25.1264 13.7848 27.7512 11.1679 30.9775 11.1679C34.2038 11.1679 36.8286 13.7848 36.8286 17.0015C36.8286 18.9009 35.8995 20.5751 34.4858 21.6403ZM30.9775 12.3346C29.6868 12.3346 28.6371 13.3811 28.6371 14.668C28.6371 15.9549 29.6868 17.0015 30.9775 17.0015C32.2683 17.0015 33.318 15.9549 33.318 14.668C33.318 13.3811 32.2683 12.3346 30.9775 12.3346ZM30.9775 15.8347C30.3316 15.8347 29.8073 15.3121 29.8073 14.668C29.8073 14.024 30.3316 13.5013 30.9775 13.5013C31.6235 13.5013 32.1477 14.024 32.1477 14.668C32.1477 15.3121 31.6235 15.8347 30.9775 15.8347ZM28.2287 26.8532C27.2796 25.9058 25.6214 25.9058 24.6712 26.8532L20.2057 31.3054C19.2016 32.3064 17.5867 32.4044 16.6037 31.5247C16.0806 31.0557 15.7834 30.4117 15.7647 29.714C15.7459 29.0151 16.0081 28.3583 16.5043 27.8647L21.2191 23.164C21.6614 22.723 21.9048 22.1373 21.9048 21.5143C21.9048 20.8913 21.6614 20.3056 21.2191 19.8646L20.428 19.0747C19.5164 18.1658 18.0314 18.1658 17.1186 19.0747L12.5828 23.5969C9.30507 26.866 9.12251 32.1536 12.1756 35.3854C13.7355 37.0375 15.8454 37.9662 18.118 38H18.2467C20.4701 38 22.5566 37.1401 24.1317 35.5686L28.7728 30.9414C29.7546 29.9625 29.7546 28.3723 28.7728 27.3934L28.2287 26.8532ZM18.7721 19.5589C19.0717 19.5589 19.3725 19.6732 19.6006 19.8996L20.3917 20.6894C20.6129 20.91 20.7346 21.2028 20.7346 21.5143C20.7346 21.8258 20.6129 22.1187 20.3917 22.3392L19.8862 22.8432L17.4393 20.4036L17.9448 19.8996C18.173 19.6732 18.4726 19.5589 18.7721 19.5589ZM23.3032 34.7449C21.9224 36.1216 20.0605 36.8111 18.1332 36.8345C16.1813 36.8053 14.3674 36.0061 13.0252 34.5862C10.4016 31.8082 10.5736 27.2487 13.409 24.4218L16.6119 21.2285L19.0588 23.6681L15.6769 27.0399C14.9525 27.7621 14.5675 28.7223 14.5945 29.7443C14.6214 30.7652 15.0567 31.7056 15.8208 32.3916C17.2813 33.7007 19.5691 33.5886 21.033 32.1303L24.2897 28.8821L26.7355 31.3217L23.3032 34.7449ZM27.9443 30.1177L27.5628 30.498L25.1171 28.0584L25.4986 27.6781C26.0088 27.1729 26.8935 27.1682 27.4013 27.6781L27.9455 28.2194C28.4697 28.7421 28.4686 29.595 27.9443 30.1177Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="metric-content">
                        <div className="pattern-value">{formattedStyle.metrics.engagement_rate || 0}%</div>
                        <div className="pattern-label">Engagement Rate</div>
                        <div className="pattern-sublabel">Likes + Comments</div>
                      </div>
                    </div>
                  </div> */}
                  <div className="col-xl-4 col-lg-6 col-md-6 col-6">
                    <div className="metric-card">
                      <div className="metric-icon">
                        <svg
                         className="pattern-iconss"
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                          <path
                            d="M36 35C36 35.552 35.552 36 35 36H15C13.346 36 12 34.654 12 33V13C12 12.448 12.448 12 13 12C13.552 12 14 12.448 14 13V33C14 33.551 14.449 34 15 34H35C35.552 34 36 34.448 36 35ZM33 17H29C28.448 17 28 17.448 28 18C28 18.552 28.448 19 29 19H32.563L27.706 23.707C27.329 24.085 26.67 24.085 26.293 23.707C26.252 23.667 25.054 22.814 25.054 22.814C23.916 21.741 21.977 21.781 20.892 22.865L16.306 27.279C15.908 27.662 15.896 28.295 16.279 28.693C16.476 28.897 16.737 29 17 29C17.25 29 17.5 28.907 17.693 28.721L22.293 24.293C22.67 23.915 23.329 23.915 23.706 24.293C23.747 24.333 24.945 25.186 24.945 25.186C26.084 26.26 28.021 26.222 29.109 25.132L33.999 20.392V23.999C33.999 24.551 34.447 24.999 34.999 24.999C35.551 24.999 35.999 24.551 35.999 23.999V19.999C35.999 18.345 34.653 16.999 32.999 16.999L33 17Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="metric-content">
                        <div className="pattern-value">{writingStyle?.posts_analyzed || 0}</div>
                        <div className="pattern-label">Posts Analyzed</div>
                        <div className="pattern-sublabel">Recent Posts</div>
                      </div>
                    </div>
                  </div>
                  <div className="performance-insight">
                    Performance Insight: Building engagement -
                    focus on creating more interactive content.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Patterns & Insights */}
      <div className="accordion-section">
        <div className="accordion-header" onClick={togglePatternsInsights}>
          <h3 className="accordion-title">Content Patterns & Insights</h3>
          <i
            className={`fa-solid fa-chevron-down accordion-icon ${
              isPatternsInsightsOpen ? "open" : ""
            }`}
          ></i>
        </div>
        {isPatternsInsightsOpen && (
          <div className="accordion-content ps-lg-5 pb-4">
            {((!formattedStyle?.content_patterns && isAnalyzingWritingStyle) || loading) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#84E084]" />
                <span className="ml-2 text-[#515151]">Loading patterns...</span>
              </div>
            ) : !formattedStyle?.content_patterns ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No content patterns available</p>
              </div>
            ) : (
              <div className="characteristics-section">
                <h4 className="characteristics-title">
                  Writing Style Characteristics
                </h4>
                <div className="characteristics-list">
                  {formattedStyle.content_patterns.characteristics?.map((characteristic, index) => (
                    <div key={index} className="characteristic-item">
                      <span className="checkmark">
                        <svg
                          width="11"
                          height="8"
                          viewBox="0 0 11 8"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10 1L3.8125 7L1 4.27273"
                            stroke="#1F9C0E"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="charact-span">
                        {characteristic}
                      </span>
                    </div>
                  )) || (
                    <>
                      <div className="characteristic-item">
                        <span className="checkmark">
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 1L3.8125 7L1 4.27273"
                              stroke="#1F9C0E"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="charact-span">
                          Long-form content creator - you write detailed, comprehensive posts
                        </span>
                      </div>
                      <div className="characteristic-item">
                        <span className="checkmark">
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 1L3.8125 7L1 4.27273"
                              stroke="#1F9C0E"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="charact-span">
                          Emoji-friendly - you use visual elements to enhance your message
                        </span>
                      </div>
                      <div className="characteristic-item">
                        <span className="checkmark">
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 1L3.8125 7L1 4.27273"
                              stroke="#1F9C0E"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="charact-span">
                          Question-driven - you actively engage your audience with questions
                        </span>
                      </div>
                      <div className="characteristic-item">
                        <span className="checkmark">
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 1L3.8125 7L1 4.27273"
                              stroke="#1F9C0E"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="charact-span">
                          Occasional storyteller - you share stories when relevant
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="patterns-row">
              <div className="row">
                <div className="col-lg-9">
                  <div className="row g-2">
                    <div className=" col-lg-4 col-md-6 col-6">
                      <div className="pattern-card">
                        <div className="pattern-icon">
                          <svg
                            className="pattern-iconss"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                            <path
                              d="M15.833 13.0996H32.167C35.333 13.0998 37.9004 15.6327 37.9004 18.75V30.25C37.9004 33.3673 35.333 35.9002 32.167 35.9004H15.833C12.667 35.9002 10.0996 33.3673 10.0996 30.25V18.75C10.0996 15.6327 12.667 13.0998 15.833 13.0996ZM12.2334 30.25C12.2334 32.204 13.8543 33.7996 15.833 33.7998H32.167C34.1457 33.7996 35.7666 32.204 35.7666 30.25V20.9502H12.2334V30.25ZM15.833 23.4502H20.5C21.0878 23.4502 21.5664 23.9241 21.5664 24.5C21.5664 25.0759 21.0878 25.5498 20.5 25.5498H19.2334V30.25C19.2334 30.8258 18.7546 31.2996 18.167 31.2998C17.5792 31.2998 17.0996 30.8259 17.0996 30.25V25.5498H15.833C15.2454 25.5496 14.7666 25.0758 14.7666 24.5C14.7666 23.9242 15.2454 23.4504 15.833 23.4502ZM25.167 28.0498H32.167C32.7545 28.05 33.2332 28.524 33.2334 29.0996C33.2334 29.6754 32.7546 30.1502 32.167 30.1504H25.167C24.5792 30.1504 24.0996 29.6755 24.0996 29.0996C24.0998 28.5239 24.5793 28.0498 25.167 28.0498ZM25.167 23.4502H32.167C32.7546 23.4504 33.2334 23.9242 33.2334 24.5C33.2334 25.0758 32.7546 25.5496 32.167 25.5498H25.167C24.5792 25.5498 24.0996 25.0759 24.0996 24.5C24.0996 23.9241 24.5792 23.4502 25.167 23.4502ZM15.833 15.2002C13.8543 15.2004 12.2334 16.796 12.2334 18.75V18.8496H35.7666V18.75C35.7666 16.796 34.1457 15.2004 32.167 15.2002H15.833Z"
                              fill="white"
                              stroke="#3ABF62"
                              strokeWidth="0.2"
                            />
                          </svg>
                        </div>
                        <div className="pattern-content">
                          <div className="pattern-value">{formattedStyle?.content_patterns?.avg_post_length || 0}</div>
                          <div className="pattern-label">Avg Post Length</div>
                          <div className="pattern-sublabel">characters</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-6">
                      <div className="pattern-card">
                        <div className="pattern-icon">
                          <svg
                            className="pattern-iconss"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                            <path
                              d="M21.8857 11.3574C24.4851 10.8404 27.1794 11.1059 29.6279 12.1201C32.0765 13.1343 34.1692 14.852 35.6416 17.0557C37.1139 19.2592 37.9004 21.8498 37.9004 24.5L37.8955 24.832C37.8069 28.2643 36.4045 31.5369 33.9707 33.9707C31.4586 36.4829 28.0527 37.8965 24.5 37.9004L24.0039 37.8906C21.5275 37.7989 19.1215 37.0219 17.0557 35.6416C14.852 34.1692 13.1343 32.0765 12.1201 29.6279C11.1059 27.1794 10.8404 24.4851 11.3574 21.8857C11.8745 19.2864 13.1504 16.8984 15.0244 15.0244C16.8984 13.1504 19.2864 11.8745 21.8857 11.3574ZM24.5 13.1504C22.2553 13.1504 20.0608 13.8154 18.1943 15.0625C16.3279 16.3096 14.8727 18.0824 14.0137 20.1562C13.1547 22.2301 12.9303 24.5123 13.3682 26.7139C13.8061 28.9155 14.8873 30.9381 16.4746 32.5254C18.0619 34.1127 20.0844 35.1939 22.2861 35.6318C24.4877 36.0697 26.7699 35.8453 28.8438 34.9863C30.9176 34.1273 32.6904 32.6721 33.9375 30.8057C35.1846 28.9392 35.8496 26.7447 35.8496 24.5L35.8359 23.9375C35.694 21.1332 34.5173 18.4724 32.5225 16.4775C30.3947 14.3497 27.5092 13.1537 24.5 13.1504ZM30.1855 26.8506C30.457 26.8663 30.7108 26.9893 30.8916 27.1924C31.0724 27.3955 31.1652 27.6622 31.1494 27.9336C31.1356 28.171 31.0396 28.395 30.8799 28.5684L30.8076 28.6396C29.0396 30.1494 26.8219 31.0315 24.5 31.1494C22.1779 31.0315 19.9595 30.1497 18.1914 28.6396H18.1924C17.9896 28.4586 17.8669 28.204 17.8516 27.9326C17.8363 27.6613 17.9294 27.3951 18.1104 27.1924C18.2914 26.9896 18.546 26.8669 18.8174 26.8516C19.0547 26.8382 19.2881 26.9081 19.4785 27.0469L19.5576 27.1104L19.5596 27.1123C20.9508 28.2826 22.6792 28.9786 24.4932 29.0996V29.1006L24.5068 29.0996C26.3218 28.9785 28.0509 28.2819 29.4424 27.1104L29.4443 27.1084C29.6474 26.9276 29.9141 26.8348 30.1855 26.8506ZM20 20.0996C20.5702 20.0996 21.1173 20.3263 21.5205 20.7295C21.9237 21.1327 22.1504 21.6798 22.1504 22.25C22.1504 22.5162 22.0906 22.7049 21.9922 22.8418C21.8937 22.9787 21.7487 23.074 21.5586 23.1396C21.171 23.2735 20.6282 23.2754 20 23.2754C19.3718 23.2754 18.829 23.2735 18.4414 23.1396C18.2514 23.074 18.1063 22.9787 18.0078 22.8418C17.9094 22.7049 17.8496 22.5162 17.8496 22.25C17.8496 21.6798 18.0763 21.1327 18.4795 20.7295C18.8827 20.3263 19.4298 20.0996 20 20.0996ZM29 20.0996C29.5702 20.0996 30.1173 20.3263 30.5205 20.7295C30.9237 21.1327 31.1504 21.6798 31.1504 22.25C31.1504 22.5162 31.0906 22.7049 30.9922 22.8418C30.8937 22.9787 30.7486 23.074 30.5586 23.1396C30.171 23.2735 29.6282 23.2754 29 23.2754C28.3718 23.2754 27.829 23.2735 27.4414 23.1396C27.2514 23.074 27.1063 22.9787 27.0078 22.8418C26.9094 22.7049 26.8496 22.5162 26.8496 22.25C26.8496 21.6798 27.0763 21.1327 27.4795 20.7295C27.8827 20.3263 28.4298 20.0996 29 20.0996Z"
                              fill="white"
                              stroke="#3ABF62"
                              strokeWidth="0.2"
                            />
                          </svg>
                        </div>
                        <div className="pattern-content">
                          <div className="pattern-value">{formattedStyle?.content_patterns?.total_emojis || 0}</div>
                          <div className="pattern-label">Total Emojis</div>
                          <div className="pattern-sublabel">({formattedStyle?.content_patterns?.emoji_usage || 0} per post)</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-6">
                      <div className="pattern-card">
                        <div className="pattern-icon">
                          <svg
                            className="pattern-iconss"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                            <path
                              d="M33.8666 29.0832C33.7757 29.0602 32.5016 28.7442 30.3347 28.4752C30.2577 27.4142 30.2076 26.2242 30.2076 24.9242C30.2076 23.5642 30.2637 22.3212 30.3477 21.2202C32.1037 21.4542 33.1147 21.7032 33.1336 21.7072C33.2556 21.7382 34.5427 22.0172 34.9536 20.6182C35.1696 19.8812 34.6696 19.0012 33.8676 18.7982C33.7816 18.7762 32.6357 18.4922 30.6756 18.2342C30.8937 16.7392 31.1066 15.8882 31.1106 15.8712C31.3146 15.0692 30.8307 14.2522 30.0287 14.0472C29.2276 13.8422 28.4107 14.3242 28.2046 15.1272C28.1837 15.2072 27.9307 16.2112 27.6847 17.9382C26.5767 17.8622 25.3427 17.8122 23.9997 17.8122C22.6707 17.8122 21.4507 17.8602 20.3547 17.9342C20.5557 16.6272 20.7407 15.8882 20.7447 15.8722C20.9487 15.0702 20.4647 14.2532 19.6627 14.0482C18.8597 13.8432 18.0447 14.3252 17.8387 15.1282C17.8167 15.2122 17.5347 16.3292 17.2767 18.2402C15.3387 18.4972 14.2137 18.7792 14.1287 18.8012C13.3267 19.0062 12.8427 19.8222 13.0467 20.6242C13.2507 21.4262 14.0677 21.9132 14.8687 21.7082C14.8847 21.7042 15.6337 21.5182 16.9647 21.3172C16.8897 22.4042 16.8417 23.6132 16.8417 24.9262C16.8417 26.2542 16.8907 27.4732 16.9667 28.5672C15.2187 28.8122 14.2087 29.0652 14.1287 29.0852C13.3267 29.2902 12.8427 30.1062 13.0467 30.9082C13.2507 31.7102 14.0677 32.1992 14.8687 31.9922C14.8857 31.9882 15.7477 31.7742 17.2667 31.5572C17.5277 33.5092 17.8167 34.6432 17.8387 34.7272C18.0137 35.4032 18.7017 35.9922 19.6657 35.8022C20.4777 35.6422 20.9497 34.7772 20.7437 33.9752C20.7387 33.9572 20.4897 32.9672 20.2537 31.2352C21.3647 31.1522 22.6207 31.0972 23.9997 31.0972C25.3117 31.0972 26.5167 31.1482 27.5907 31.2252C27.8617 33.3802 28.1827 34.6382 28.2057 34.7272C28.3807 35.4032 29.0667 35.9842 30.0326 35.8022C30.8466 35.6492 31.3166 34.7772 31.1106 33.9752C31.1066 33.9582 30.8867 33.0862 30.6646 31.5492C32.2246 31.7692 33.1166 31.9892 33.1346 31.9932C33.2566 32.0242 34.5566 32.2902 34.9546 30.9042C35.1836 30.1092 34.6707 29.2872 33.8687 29.0842L33.8666 29.0832ZM23.9987 28.0962C22.5057 28.0962 21.1487 28.1562 19.9517 28.2472C19.8837 27.2452 19.8407 26.1322 19.8407 24.9252C19.8407 23.4612 19.9057 22.1312 20.0007 20.9702C21.1716 20.8762 22.5147 20.8122 23.9987 20.8122C25.2177 20.8122 26.3436 20.8562 27.3587 20.9242C27.2677 22.1102 27.2067 23.4522 27.2067 24.9252C27.2067 26.1062 27.2457 27.2002 27.3067 28.1972C26.2977 28.1352 25.1906 28.0962 23.9977 28.0962H23.9987Z"
                              fill="white"
                            />
                          </svg>
                        </div>
                        <div className="pattern-content">
                          <div className="pattern-value">{formattedStyle?.content_patterns?.total_hashtags || 0}</div>
                          <div className="pattern-label">Total Hashtags</div>
                          <div className="pattern-sublabel">({formattedStyle?.content_patterns?.hashtag_usage || 0} per post)</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-6">
                      <div className="pattern-card">
                        <div className="pattern-icon">
                          <svg
                            className="pattern-iconss"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                            <g clip-path="url(#clip0_1239_362)">
                              <path
                                d="M24 9C21.0333 9 18.1332 9.87973 15.6665 11.528C13.1997 13.1762 11.2771 15.5189 10.1418 18.2598C9.0065 21.0006 8.70945 24.0166 9.28823 26.9264C9.86701 29.8361 11.2956 32.5088 13.3934 34.6066C15.4912 36.7044 18.1639 38.133 21.0737 38.7118C23.9834 39.2906 26.9994 38.9935 29.7403 37.8582C32.4812 36.7229 34.8238 34.8003 36.4721 32.3336C38.1203 29.8668 39 26.9667 39 24C38.9957 20.0231 37.414 16.2103 34.6019 13.3981C31.7897 10.586 27.9769 9.0043 24 9ZM24 36.5C21.5277 36.5 19.111 35.7669 17.0554 34.3934C14.9998 33.0199 13.3976 31.0676 12.4515 28.7835C11.5054 26.4995 11.2579 23.9861 11.7402 21.5614C12.2225 19.1366 13.413 16.9093 15.1612 15.1612C16.9093 13.413 19.1366 12.2225 21.5614 11.7402C23.9861 11.2579 26.4995 11.5054 28.7836 12.4515C31.0676 13.3976 33.0199 14.9998 34.3934 17.0554C35.7669 19.111 36.5 21.5277 36.5 24C36.4964 27.3141 35.1782 30.4914 32.8348 32.8348C30.4914 35.1782 27.3141 36.4964 24 36.5Z"
                                fill="white"
                              />
                              <path
                                d="M24.8963 15.329C24.1754 15.1977 23.4345 15.2264 22.726 15.4131C22.0175 15.5998 21.3586 15.9399 20.7961 16.4094C20.2336 16.8789 19.7811 17.4663 19.4708 18.13C19.1604 18.7937 18.9997 19.5176 19 20.2503C19 20.5818 19.1317 20.8997 19.3661 21.1342C19.6005 21.3686 19.9185 21.5003 20.25 21.5003C20.5815 21.5003 20.8995 21.3686 21.1339 21.1342C21.3683 20.8997 21.5 20.5818 21.5 20.2503C21.4997 19.8825 21.5805 19.5192 21.7367 19.1862C21.893 18.8533 22.1207 18.5589 22.4038 18.3241C22.6868 18.0892 23.0182 17.9198 23.3743 17.8277C23.7304 17.7357 24.1024 17.7233 24.4638 17.7915C24.9576 17.8874 25.4116 18.1283 25.7678 18.4834C26.1241 18.8385 26.3664 19.2918 26.4638 19.7853C26.5621 20.3033 26.4942 20.8391 26.2697 21.3162C26.0452 21.7933 25.6756 22.1872 25.2138 22.4415C24.449 22.8846 23.817 23.5247 23.3837 24.295C22.9503 25.0654 22.7315 25.9379 22.75 26.8215V27.7503C22.75 28.0818 22.8817 28.3997 23.1161 28.6342C23.3505 28.8686 23.6685 29.0003 24 29.0003C24.3315 29.0003 24.6495 28.8686 24.8839 28.6342C25.1183 28.3997 25.25 28.0818 25.25 27.7503V26.8215C25.2343 26.3865 25.3335 25.9551 25.5376 25.5706C25.7417 25.1862 26.0434 24.8623 26.4125 24.6315C27.3181 24.1341 28.0474 23.3684 28.5001 22.4395C28.9528 21.5107 29.1066 20.4645 28.9403 19.4447C28.7741 18.4249 28.2961 17.4816 27.5719 16.7446C26.8477 16.0077 25.913 15.5131 24.8963 15.329Z"
                                fill="white"
                              />
                              <path
                                d="M25.25 31.5C25.25 30.8096 24.6904 30.25 24 30.25C23.3096 30.25 22.75 30.8096 22.75 31.5C22.75 32.1904 23.3096 32.75 24 32.75C24.6904 32.75 25.25 32.1904 25.25 31.5Z"
                                fill="white"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_1239_362">
                                <rect
                                  width="30"
                                  height="30"
                                  fill="white"
                                  transform="translate(9 9)"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                        </div>
                        <div className="pattern-text">
                          <div className="pattern-value">{formattedStyle?.content_patterns?.total_questions || 0}</div>
                          <div className="pattern-label"> Questions Asked</div>
                          <div className="pattern-sublabel">({formattedStyle?.content_patterns?.question_usage || 0} per post)</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-6">
                      <div className="pattern-card">
                        <div className="pattern-icon">
                          <svg
                            className="pattern-iconss"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                            <path
                              d="M14.0947 19.8496H17.3799C17.9302 19.8496 18.375 20.2913 18.375 20.833C18.3749 21.3747 17.9301 21.8164 17.3799 21.8164H14.0947C13.5447 21.8162 13.0997 21.3746 13.0996 20.833C13.0996 20.2914 13.5446 19.8498 14.0947 19.8496ZM30.5215 19.8496H33.8066C34.3569 19.8497 34.8018 20.2913 34.8018 20.833C34.8017 21.3746 34.3568 21.8164 33.8066 21.8164H30.5215C29.9712 21.8164 29.5264 21.3747 29.5264 20.833C29.5264 20.2913 29.9712 19.8496 30.5215 19.8496ZM30.2158 13.2441C30.605 12.8591 31.2348 12.8591 31.624 13.2441C32.0125 13.6286 32.0126 14.2494 31.624 14.6338L29.3008 16.9316C29.1069 17.1232 28.8525 17.2196 28.5977 17.2197C28.3426 17.2197 28.0875 17.1234 27.8936 16.9316C27.505 16.5472 27.505 15.9264 27.8936 15.542L30.2158 13.2441ZM16.2432 13.3271C16.6323 12.9426 17.2613 12.9425 17.6504 13.3271L19.9746 15.626C20.3631 16.0103 20.363 16.6312 19.9746 17.0156C19.5854 17.4006 18.9556 17.4006 18.5664 17.0156L16.2432 14.7168C15.8546 14.3324 15.8546 13.7116 16.2432 13.3271ZM23.9512 10.0996C24.5012 10.0998 24.9461 10.5415 24.9463 11.083V14.333C24.9463 14.8746 24.5013 15.3162 23.9512 15.3164C23.4009 15.3164 22.9561 14.8747 22.9561 14.333V11.083C22.9562 10.5414 23.401 10.0996 23.9512 10.0996ZM31.7188 30.4492L25.8027 28.2539C25.4143 28.1091 25.1574 27.7421 25.1572 27.333V20.9492C25.1572 20.3285 24.7333 19.7584 24.1709 19.666H24.1719C23.497 19.5396 22.8409 20.0424 22.7725 20.7012L22.7666 20.833V31.1172C22.7666 31.7378 22.4162 32.2909 21.8506 32.5605C21.2835 32.8293 20.628 32.7561 20.1367 32.3691L20.1357 32.3682C20.1348 32.3675 20.1335 32.3665 20.1318 32.3652C20.1282 32.3624 20.1223 32.3581 20.1152 32.3525C20.1011 32.3414 20.081 32.3244 20.0547 32.3037C20.002 32.2621 19.9263 32.2031 19.8359 32.1318C19.655 31.9891 19.4136 31.7982 19.1719 31.6074C18.9303 31.4168 18.6881 31.2261 18.5059 31.082C18.4147 31.01 18.3379 30.9488 18.2842 30.9062C18.2575 30.8851 18.2362 30.868 18.2217 30.8564C18.2145 30.8507 18.2088 30.8467 18.2051 30.8438L18.2061 30.8447L18.2031 30.8428L18.1104 30.7656C17.6621 30.4306 17.0306 30.4487 16.6064 30.8154L16.5195 30.8994C16.068 31.3756 16.0928 32.1248 16.5723 32.5723V32.5732L18.248 34.208L18.249 34.209C18.8915 34.8222 18.4552 35.9004 17.5576 35.9004C17.2994 35.9004 17.051 35.8009 16.8662 35.624L15.2031 34L15.2012 33.998C13.9327 32.8228 13.8644 30.8269 15.0635 29.5586V29.5576C16.2341 28.3168 18.1875 28.2335 19.4727 29.3398L19.4785 29.3447C19.4813 29.3469 19.4979 29.3598 19.5273 29.3828C19.559 29.4075 19.6038 29.4427 19.6572 29.4844C19.7642 29.5679 19.9063 29.6786 20.0479 29.7891C20.1895 29.8997 20.3315 30.011 20.4375 30.0938C20.4904 30.135 20.5346 30.1693 20.5654 30.1934C20.5808 30.2054 20.5933 30.2152 20.6016 30.2217C20.6053 30.2246 20.6083 30.2269 20.6104 30.2285C20.6114 30.2293 20.6127 30.23 20.6133 30.2305V30.2314H20.6143L20.7754 30.3574V20.834C20.7754 19.9083 21.1841 19.0342 21.8975 18.4346V18.4336C22.6085 17.8343 23.5546 17.5743 24.4873 17.7266H24.4883C25.9996 17.9698 27.1445 19.3534 27.1445 20.9492V26.6514L27.21 26.6758L32.417 28.6074C34.4073 29.3456 35.7719 31.1782 35.8955 33.2754L35.9004 33.3535V34.916C35.9002 35.4575 35.4553 35.8982 34.9053 35.8984C34.3551 35.8984 33.9104 35.4576 33.9102 34.916V33.333L33.9092 33.3271C33.8333 32.0673 32.9721 30.9131 31.7197 30.4492H31.7188Z"
                              fill="white"
                              stroke="#3ABF62"
                              stroke-width="0.2"
                            />
                          </svg>
                        </div>
                        <div className="pattern-text">
                          <div className="pattern-value">{formattedStyle?.content_patterns?.total_ctas || 0}</div>
                          <div className="pattern-label">Call-to-Actions</div>
                          <div className="pattern-sublabel">({formattedStyle?.content_patterns?.call_to_action_usage || 0} per post)</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-6">
                      <div className="pattern-card">
                        <div className="pattern-icon">
                          <svg
                            className="pattern-iconss"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="24" cy="24" r="24" fill="#3ABF62" />
                            <path
                              d="M19.3574 11.25H28.6426C33.1102 11.25 36.75 14.8898 36.75 19.3574V28.6426C36.75 33.1102 33.1102 36.75 28.6426 36.75H19.3574C14.8898 36.75 11.25 33.1102 11.25 28.6426V19.3574C11.25 14.8898 14.8898 11.25 19.3574 11.25ZM19.3574 14.4639C16.6565 14.4639 14.4639 16.6565 14.4639 19.3574V28.6426C14.4639 31.3435 16.6565 33.5361 19.3574 33.5361H28.6426C31.3435 33.5361 33.5361 31.3435 33.5361 28.6426V19.3574C33.5361 16.6565 31.3435 14.4639 28.6426 14.4639H19.3574Z"
                              fill="white"
                              stroke="#3ABF62"
                              stroke-width="0.5"
                            />
                          </svg>
                        </div>
                        <div className="pattern-text">
                          <div className="pattern-value">{formattedStyle?.content_patterns?.total_stories || 0}</div>
                          <div className="pattern-label">Story Elements</div>
                          <div className="pattern-sublabel">({formattedStyle?.content_patterns?.storytelling_usage || 0} per post)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Details Section */}
      <div className="accordion-section">
        <div className="accordion-header" onClick={toggleCompanyDetails}>
          <h3 className="accordion-title">Company Details</h3>
          <i
            className={`fa-solid fa-chevron-down accordion-icon ${
              isCompanyDetailsOpen ? "open" : ""
            }`}
          ></i>
        </div>
        {isCompanyDetailsOpen && (
          <div className="accordion-content ps-lg-5 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#84E084]" />
                <span className="ml-2 text-[#515151]">Loading company details...</span>
              </div>
            ) : (
              <div className="company-details-form" style={{ maxWidth: "800px" }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-gray-700 font-medium mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyDetails.company_name}
                      onChange={(e) => handleCompanyDetailsChange("company_name", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-gray-700 font-medium mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyDetails.role}
                      onChange={(e) => handleCompanyDetailsChange("role", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter Role"
                    />
                  </div>
                 
                  
                 
                  <div className="col-12">
                    <label className="form-label text-gray-700 font-medium mb-2">
                      Company Description
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={companyDetails.company_description}
                      onChange={(e) => handleCompanyDetailsChange("company_description", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter company description"
                      style={{ resize: "vertical" }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 d-flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={handleEditClick}
                      className="btn"
                      style={{ backgroundColor: "#84E084", borderColor: "#84E084" ,color:"black",fontSize:"13px"}}
                    >
                    Edit Details
                    </button>
                  ) : (
                    <>
                    <style>
                      {
                        `
                        .form-control{
                        font-size:14px;
                        }
                        `
                      }
                    </style>
                      <button
                        onClick={handleSaveCompanyDetails}
                        className="btn btn-success"
                        style={{  backgroundColor: "#84E084", borderColor: "#84E084" ,color:"black",fontSize:"13px" }}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="animate-spin me-2" style={{ display: "inline-block", width: "16px", height: "16px" }} />
                            Saving...
                          </>
                        ) : (
                          <>
                           Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn "
                        disabled={isSaving}
                         style={{  backgroundColor: "#EAEAEA", borderColor: "none !important" ,color:"black",fontSize:"13px" }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Why Connect Your Accounts */}
      <div className="connect-accounts-section">
        <div className="connect-header">
          <span className="connect-icon">
            <svg
              width="23"
              height="23"
              viewBox="0 0 23 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.3 16.3C11.5833 16.3 11.8208 16.2042 12.0125 16.0125C12.2042 15.8208 12.3 15.5833 12.3 15.3C12.3 15.0167 12.2042 14.7792 12.0125 14.5875C11.8208 14.3958 11.5833 14.3 11.3 14.3C11.0167 14.3 10.7792 14.3958 10.5875 14.5875C10.3958 14.7792 10.3 15.0167 10.3 15.3C10.3 15.5833 10.3958 15.8208 10.5875 16.0125C10.7792 16.2042 11.0167 16.3 11.3 16.3ZM10.3 12.3H12.3V6.3H10.3V12.3ZM11.3 22.6L7.95 19.3H3.3V14.65L0 11.3L3.3 7.95V3.3H7.95L11.3 0L14.65 3.3H19.3V7.95L22.6 11.3L19.3 14.65V19.3H14.65L11.3 22.6Z"
                fill="#84E084"
              />
            </svg>
          </span>
          <div>
            <h3 className="connect-title">Why Connect Your Accounts?</h3>
            <div>
              <p className="connect-description pb-0 mb-0">
                Connected accounts enable direct publishing from Simbli. Instead
                of copying and pasting, you can publish your AI generated
                content with a single click, including images and hashtags.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingStyleNew;
