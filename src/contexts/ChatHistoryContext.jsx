import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
// import { BASE_URL } from "../api/api";

const ChatHistoryContext = createContext();

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }
  return context;
};

export const ChatHistoryProvider = ({ children }) => {
  const [isClearing, setIsClearing] = useState(false);

  // Chat state management
  const [messages, setMessages] = useState(() => {
    // Load chat history from localStorage on context mount
    try {
      const savedMessages = localStorage.getItem("simbli_chat_messages");
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  });
// const [messages, setMessages] = useState([]);

  const [currentContent, setCurrentContent] = useState(null);
  const [publishSuccessMap, setPublishSuccessMap] = useState(() => {
    // Load publish success states from localStorage on context mount
    try {
      const savedSuccessMap = localStorage.getItem(
        "simbli_publish_success_map"
      );
      return savedSuccessMap ? JSON.parse(savedSuccessMap) : {};
    } catch (error) {
      console.error("Error loading publish success states:", error);
      return {};
    }
  });

  const [editingContent, setEditingContent] = useState(false);
  const [draftSuccessMap, setDraftSuccessMap] = useState(() => {
    try {
      const savedDraftMap = localStorage.getItem("draftSuccessMap");
      return savedDraftMap ? JSON.parse(savedDraftMap) : {};
    } catch (error) {
      console.error("Error loading draft success states:", error);
      return {};
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return localStorage.getItem("currentSessionId") || null;
  });


  // const transformContentHistoryResponse = async (apiResponse) => {
  //   console.log("apiResponse", apiResponse);
  //   const transformedMessages = [];

  //   apiResponse.forEach((sessionBlock) => {
  //     const { content_items, messages } = sessionBlock;
  //     console.log("content_items", content_items);
  //     console.log("content_items---", messages);

  //     messages.forEach((msg) => {
  //       // USER message
  //       if (msg.type === "user") {
  //         // Check if image_path exists and is not null/undefined/empty
  //         const hasImagePath = msg.image_path && typeof msg.image_path === 'string' && msg.image_path.trim() !== '';
  //         const imageUrl = hasImagePath ? `${BASE_URL}${msg.image_path}` : null;
          
  //         transformedMessages.push({
  //           id: msg.id,
  //           type: "user",
  //           content: msg.content,
  //           timestamp: msg.timestamp,
  //           hasImage: hasImagePath,
  //           imageUrl: imageUrl,
  //           imageKey: null,
  //         });
  //       }

  //       // AI message (find corresponding generated content)
  //       if (msg.type === "ai") {
  //         // Find the related content item based on generated_content_id
  //         let relatedContent = null;
  //         const contentId = msg?.metadata?.generated_content_id;

  //         console.log("content_items--------", contentId);
  //         if (contentId) {
  //           relatedContent = content_items.find(
  //             (item) => item.id.toString() === contentId.toString()
  //           );
  //           console.log("relatedContent", relatedContent);
  //         } else {
  //         //  If no contentId, check if msg.content is already a content object
  //           // Only use it if it's an object, not a string (conversational message)
  //           if (msg.content && typeof msg.content === "object" && !Array.isArray(msg.content)) {
  //             relatedContent = msg.content;
  //           }
  //         }

  //         // Ensure content structure matches localStorage format
  //         // original_platform should be inside content object, not at message level
  //         if (relatedContent) {
  //           // Preserve all content fields including original_platform from API
  //           // If original_platform is missing, set it to null (matches localStorage structure)
  //           const formattedContent = {
  //             ...relatedContent,
  //             original_platform: relatedContent.original_platform ?? null,
  //           };

  //           transformedMessages.push({
  //             id: msg.id,
  //             type: "ai",
  //             content: formattedContent,
  //             conversational: msg.conversational || null,
  //             timestamp: msg.timestamp,
  //             messageType: msg?.metadata?.message_type || null,
  //             suggestions: [
  //               "Generate content for another platform",
  //               "Create a different version",
  //               "Generate an image",
  //               "Fetch latest updates on a different topic",
  //             ],
  //           });
  //         } else {

  //           // If no content found (or msg.content is a string), create message with null content
  //           // Store conversational message in the conversational field
  //           const conversationalText = typeof msg.content === "string" 
  //             ? msg.content 
  //             : (msg.conversational || null);
  //           // If no content found, create message with null content (matches localStorage structure)
  //           transformedMessages.push({
  //             id: msg.id,
  //             type: "ai",
  //             content: conversationalText,
  //             conversational: msg.conversational || null,
  //             timestamp: msg.timestamp,
  //             messageType: msg?.metadata?.message_type || null,
  //             suggestions: [
  //               "Generate content for another platform",
  //               "Create a different version",
  //               "Generate an image",
  //               "Fetch latest updates on a different topic",
  //             ],
  //           });
  //         }
  //       }
  //     });
  //   });

  //   console.log("transformedMessages", transformedMessages);
  //   return transformedMessages;
  // };
  

  // const getAllChats = async()=>{
  //   try{
  //    const token = localStorage.getItem("access-token");
  //   const headers = token ? { Authorization: `Bearer ${token}` } : {};
  //    const response = await axios.get(`${BASE_URL}/content-history/sessions`,
  //     { headers }
  //    )
  //    console.log("response=>" , response)

  //    const trasformData = await transformContentHistoryResponse(response?.data?.sessions)
  //    // Set messages from database - this is the source of truth
  //    // The useEffect below will automatically save to localStorage for session persistence
  //    setMessages(trasformData)
  //   }catch(err){
  //     console.error("Error loading messages from database:", err)
  //     // On error, set empty messages
  //     // Don't clear localStorage here - let it persist as fallback
  //     setMessages([]);
  //   }
  // }
  
// useEffect(()=>{
// getAllChats()
// },[])

  // Save messages to localStorage whenever messages change
  // This is for session persistence only - initial load comes from API via getAllChats()
  // The API is the source of truth on mount, localStorage is just a cache
useEffect(() => {
    try {
      localStorage.setItem("simbli_chat_messages", JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }, [messages]);

  // Save publish success states to localStorage whenever they change
useEffect(() => {
    try {
      localStorage.setItem(
        "simbli_publish_success_map",
        JSON.stringify(publishSuccessMap)
      );
    } catch (error) {
      console.error("Error saving publish success states:", error);
    }
  }, [publishSuccessMap]);

  // Save draft success states to localStorage whenever they change
 useEffect(() => {
    try {
      localStorage.setItem("draftSuccessMap", JSON.stringify(draftSuccessMap));
    } catch (error) {
      console.error("Error saving draft success states:", error);
    }
  }, [draftSuccessMap]);

  // Save current session ID to localStorage whenever it changes
 useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("currentSessionId", currentSessionId);
    } else {
      localStorage.removeItem("currentSessionId");
    }
  }, [currentSessionId]);

  // Utility function to update publishSuccessMap for a specific content and platform
  const updatePublishSuccessMap = useCallback((contentId, platform, updateData) => {
    setPublishSuccessMap((prev) => {
      const newMap = { ...prev };
      
      // Ensure the contentId exists in the map
      if (!newMap[contentId]) {
        newMap[contentId] = {};
      }
      
      // Preserve existing data and merge with new data
      const existingData = newMap[contentId][platform] || {};
      newMap[contentId][platform] = {
        ...existingData,
        ...updateData,
        contentId,
        platform,
      };
      
      console.log(`Updated publishSuccessMap for contentId: ${contentId}, platform: ${platform}`, {
        existingData,
        updateData,
        finalData: newMap[contentId][platform]
      });
      
      return newMap;
    });
  }, []);

  const clearChatHistory = useCallback(async () => {
    if (isClearing) return; // Prevent multiple simultaneous clears

    setIsClearing(true);

    try {
      // Clear all state first
      setMessages([]);
      setCurrentContent(null);
      setPublishSuccessMap({});
      setEditingContent(false);
      setDraftSuccessMap({});
      setCurrentSessionId(null);

      // Clear localStorage caches
      localStorage.removeItem("simbli_chat_messages");
      localStorage.removeItem("simbli_publish_success_map");
      localStorage.removeItem("draftSuccessMap");
      // localStorage.removeItem("currentSessionId");

      // Also reset backend session so future messages don't reuse old context
      const token = localStorage.getItem("access-token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Get current session ID from localStorage if it exists
      const sessionId = localStorage.getItem("currentSessionId");

      if (sessionId) {
        try {
          await axios.delete(`/chat/sessions/${sessionId}`, { headers });
        } catch (error) {
          // ignore and fall back to clearing localStorage
        }
      }
    } catch (error) {
      // Clear session ID from localStorage even if API call fails
      localStorage.removeItem("currentSessionId");
    } finally {
      setIsClearing(false);
    }
  }, [isClearing]);

  const value = {
    // State
    messages,
    setMessages,
    currentContent,
    setCurrentContent,
    publishSuccessMap,
    setPublishSuccessMap,
    editingContent,
    setEditingContent,
    draftSuccessMap,
    setDraftSuccessMap,
    currentSessionId,
    setCurrentSessionId,

    // Functions
    clearChatHistory,
    updatePublishSuccessMap,
    // getAllChats, // Expose getAllChats so components can refresh messages from API
    isClearing,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
};
