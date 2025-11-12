import React, { useState, useEffect } from "react";
import { Settings, Loader2, RefreshCw, FileText } from "lucide-react";
import axios from "axios";
import { getAyrshareProfile, getLatestWritingStyleAnalysis, analyzeWritingStyle } from "../api/api";

const WritingStyleSettings = ({ isAnalyzingWritingStyle }) => {
  const [writingStyle, setWritingStyle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [ayrshareProfile, setAyrshareProfile] = useState(null);

  useEffect(() => {
    fetchAyrshareProfile();
    fetchWritingStyle();
  }, []);

  // Watch for isAnalyzingWritingStyle changes and refresh data when analysis completes
  useEffect(() => {
    if (isAnalyzingWritingStyle) {
      console.log("Writing style analysis completed, refreshing data...");
      // Refresh both Ayrshare profile and writing style data
      fetchAyrshareProfile();
      fetchWritingStyle();
    }
  }, [isAnalyzingWritingStyle]);

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
    if (!ayrshareProfile) {
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

    // For the new format, the AI analysis is a flowing narrative
    // We'll display it as a single comprehensive analysis
    return {
      comprehensive_analysis: ai_analysis,
      metrics,
      content_patterns
    };
  };

  // Use state for formattedStyle to ensure it updates when writingStyle changes
  const [formattedStyle, setFormattedStyle] = useState(null);

  // Update formattedStyle whenever writingStyle changes
  useEffect(() => {
    const formatted = formatWritingStyle(writingStyle);
    console.log("formatted 44444444444444444", {formatted,writingStyle});
    setFormattedStyle(formatted);
  }, [writingStyle]);

  useEffect(() => {
    console.log("formattedStyle 55555555555555555", formattedStyle);
  }, [formattedStyle]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 bg-[#EFFBEF] rounded-full text-round-file flex justify-center items-center">
          <FileText className="w-5 h-5 text-[#84E084]" />
        </div>
        <div>
          <h5 className="text-lg font-bold text-[#022C33] mb-0 write-anal">
            Writing Style Analysis
          </h5>
          <p className="text-[#515151] text-sm">
            AI-powered analysis of your LinkedIn writing style
          </p>
        </div>
      </div>

      {((!formattedStyle && isAnalyzingWritingStyle) || loading) && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#84E084]" />
          <span className="ml-2 text-[#515151]">Loading writing style...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !writingStyle && !error && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Writing Style Analysis Found
          </h3>
          <p className="text-gray-500 mb-4">
            Analyze your LinkedIn posts to discover your unique writing style
          </p>
          <button
            onClick={handleAnalyzeWritingStyle}
            disabled={analyzing || !ayrshareProfile}
            className="bg-[#84E084] text-[#021E22] font-inter px-6 py-2 rounded-md hover:bg-[#7DD07D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Analyze Writing Style
              </>
            )}
          </button>
          {!ayrshareProfile && (
            <p className="text-sm text-gray-500 mt-2">
              Please connect your LinkedIn account via Ayrshare first
            </p>
          )}
        </div>
      )}

      {formattedStyle && (
        <div className="space-y-6">
          {/* Analysis Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 write-anal">
                Your Writing Style
              </h3>
              <p className="text-sm text-gray-500">
                Based on {writingStyle.posts_analyzed} recent LinkedIn posts
              </p>
            </div>
            <button
              onClick={handleAnalyzeWritingStyle}
              disabled={analyzing}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>

          {/* Writing Style Analysis */}
          <div className="bg-gradient-to-r from-[#EFFBEF] to-[#EFFBEF] rounded-lg px-lg-5 py-4 border-l-4 border-[#84E084]">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center write-anal">
              <span className="text-blue-600 mr-2 "></span>
              Writing Style Analysis
            </h4>
            
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
                              <span key={partIndex} className="font-bold text-gray-800" style={{fontWeight:"600 !important"}}>
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
          </div>

          {/* Metrics */}
          {formattedStyle.metrics && (
            <div className="bg-[#EFFBEF] rounded-lg px-lg-5 py-4 ">
              <h4 className="text-lg font-semibold text-gray-800 write-anal mb-4 flex items-center">
                <span className="text-blue-600 mr-2 "></span>
                Content Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0e0e0e]">
                    {Math.round(formattedStyle.metrics.average_likes || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Likes</div>
                  <div className="text-xs text-gray-500 mt-1">per post</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0e0e0e]">
                    {Math.round(formattedStyle.metrics.average_comments || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Comments</div>
                  <div className="text-xs text-gray-500 mt-1">per post</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0e0e0e]">
                    {formattedStyle.metrics.average_engagement_rate || '0%'}
                  </div>
                  <div className="text-sm text-gray-600">Engagement Rate</div>
                  <div className="text-xs text-gray-500 mt-1">likes + comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0e0e0e]">
                    {formattedStyle.metrics.total_posts_analyzed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Posts Analyzed</div>
                  <div className="text-xs text-gray-500 mt-1">recent posts</div>
                </div>
              </div>
              
              {/* Engagement Performance Insight */}
              {formattedStyle.metrics.engagement_performance && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-[#0e0e0e]">Performance Insight:</span> {formattedStyle.metrics.engagement_performance}
                  </p>
                </div>
              )}    
            </div>
          )}

          {/* Content Patterns */}
          {formattedStyle.content_patterns && (
            <div className="bg-green-50 rounded-lg px-lg-5 py-4 ">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center write-anal">
                <span className="text-green-600 mr-2 "></span>
                Content Patterns & Insights
              </h4>
              
              {/* Writing Style Insights */}
              {formattedStyle.content_patterns.writing_style_insights && formattedStyle.content_patterns.writing_style_insights.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-gray-700 mb-3 write-analys">Writing Style Characteristics:</p>
                  <div className="space-y-2">
                    {formattedStyle.content_patterns.writing_style_insights.map((insight, index) => (
                      <div key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span className="text-sm text-gray-600">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Technical Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-[#0e0e0e]">
                    {Math.round(formattedStyle.content_patterns.avg_post_length || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Post Length</div>
                  <div className="text-xs text-gray-500 mt-1">characters</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#0e0e0e]">
                    {formattedStyle.content_patterns.total_emojis || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Emojis</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({formattedStyle.content_patterns.emoji_usage || 0} per post)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#0e0e0e]">
                    {formattedStyle.content_patterns.total_hashtags || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Hashtags</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({formattedStyle.content_patterns.hashtag_usage || 0} per post)
                  </div>
                </div>
              </div>
              
              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-[#0e0e0e]">
                    {formattedStyle.content_patterns.total_questions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Questions Asked</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({formattedStyle.content_patterns.question_usage || 0} per post)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#0e0e0e]">
                    {formattedStyle.content_patterns.total_ctas || 0}
                  </div>
                  <div className="text-sm text-gray-600">Call-to-Actions</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({formattedStyle.content_patterns.call_to_action_usage || 0} per post)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#0e0e0e]">
                    {formattedStyle.content_patterns.total_stories || 0}
                  </div>
                  <div className="text-sm text-gray-600">Story Elements</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({formattedStyle.content_patterns.storytelling_usage || 0} per post)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WritingStyleSettings;
