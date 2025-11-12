import { useState, useEffect } from "react";
import {
  createAyrshareProfile,
  getAyrshareProfile,
  searchAyrshareProfileByTitle,
  generateAyrshareJWT,
  getAyrshareConnectedAccounts,
  postToAyrshare,
  deleteAyrshareProfile,
} from "../api/api.js";
import {
  saveProfileToStorage,
  loadProfileFromStorage,
  clearProfileFromStorage,
} from "../utils/ayrshareStorage.js";

function AyrshareOnboarding() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [postText, setPostText] = useState("Hello from Alfred! 🚀");
  // No need for profile title input - will auto-load default profile

  // Mock connected platforms data (in real app, this would come from Ayrshare API)
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    linkedin: { connected: false, username: "", profileUrl: "" },
    twitter: { connected: false, username: "", profileUrl: "" },
    instagram: { connected: false, username: "", profileUrl: "" },
    facebook: { connected: false, username: "", profileUrl: "" },
  });

  // Auto-load default profile on component mount
  useEffect(() => {
    loadStoredProfile();
    if (!profile) {
      loadDefaultProfile();
    }
  }, []);

  // Load connected accounts when profile is available
  useEffect(() => {
    if (profile) {
      loadConnectedAccounts();
    }
  }, [profile]);

  // Load profile from localStorage
  const loadStoredProfile = () => {
    const profileData = loadProfileFromStorage();
    if (profileData) {
      console.log("Profile loaded from storage", profileData);
      setProfile(profileData);
      setSuccess("Profile loaded from storage");
    }
  };

  // Load default profile automatically
  const loadDefaultProfile = async () => {
    try {
      setLoading(true);
      setSuccess("Loading default profile...");

      // Search for the default profile by title
      const response = await searchAyrshareProfileByTitle(
        "Alfred Social Profile"
      );
      if (response.data) {
        setProfile(response.data);
        saveProfileToStorage(response.data);
        setSuccess(
          "Default profile loaded successfully! You can now connect your social accounts."
        );
      }
    } catch (err) {
      console.log("Default profile not found, will be created during signup");
      setError(
        "Default profile not available. Profile will be created during user signup."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load connected accounts from Ayrshare
  const loadConnectedAccounts = async () => {
    try {
      const response = await getAyrshareConnectedAccounts();
      if (response.data && response.data.accounts) {
        const accounts = response.data.accounts;
        console.log("Connected accounts 1111:", accounts);
        const updatedPlatforms = { ...connectedPlatforms };

        // Update connected status for each platform
        accounts.forEach((account) => {
          const platformKey = account.platform.toLowerCase();
          console.log(
            ` Connected accounts Processing account for ${platformKey}:`,
            {
              username: account.username,
              user_image: account.user_image,
              platform_image: account.platform_image,
              display_name: account.display_name,
            }
          );
          if (updatedPlatforms[platformKey]) {
            updatedPlatforms[platformKey] = {
              connected: true,
              username: account.username,
              profileUrl: account.profile_url,
              displayName: account.display_name,
              userImage: account.user_image || account.platform_image,
              platformName: account.platform_name,
            };
            console.log(
              `Updated platform ${platformKey} with userImage:`,
              account.user_image || account.platform_image
            );
          }
        });

        setConnectedPlatforms(updatedPlatforms);
        console.log("Final connectedPlatforms state:", updatedPlatforms);
      }
    } catch (err) {
      console.log("Could not load connected accounts:", err);
      // Don't show error to user, just use default state
    }
  };

  const disconnectPlatform = async (platform) => {
    try {
      setLoading(true);
      setError(null);

      // Call the disconnect API
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "https://backend-alfred.simbli.ai"
        }/ayrshare/profiles/disconnect-social`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            profile_key: profile?.profile_key,
            platform: platform.toLowerCase(),
          }),
        }
      );

      if (response.ok) {
        // Update local state to remove the connection
        const updatedPlatforms = { ...connectedPlatforms };
        const platformKey = platform.toLowerCase();
        if (updatedPlatforms[platformKey]) {
          updatedPlatforms[platformKey] = {
            connected: false,
            username: "",
            profileUrl: "",
            displayName: "",
            userImage: "",
            platformName: "",
          };
        }
        setConnectedPlatforms(updatedPlatforms);
        setSuccess(`${platform} account disconnected successfully`);

        // Reload connected accounts to ensure UI is in sync
        await loadConnectedAccounts();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Failed to disconnect ${platform}`);
      }
    } catch (err) {
      console.error(`Error disconnecting ${platform}:`, err);
      setError(`Failed to disconnect ${platform}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Profile will be created automatically during user signup
  // No manual profile creation needed

  // Connect individual social platform
  const connectPlatform = async (platform) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Generate platform-specific JWT
      const platformKey = platform.toLowerCase();
      const response = await generateAyrshareJWT(
        profile.profile_key,
        10,
        null,
        platformKey
      );
      const jwt = response.data.jwt;
      const connectUrl =
        response.data.url || `https://app.ayrshare.com/connect?jwt=${jwt}`;

      // Open connection window
      const connectWindow = window.open(
        connectUrl,
        "_blank",
        "width=800,height=600"
      );

      // Check if window was closed (basic check)
      const checkClosed = setInterval(() => {
        if (connectWindow.closed) {
          clearInterval(checkClosed);
          setSuccess(
            `${platform} connection window closed. Please refresh to check your connected accounts.`
          );
          // Reload connected accounts after connection
          setTimeout(() => {
            loadConnectedAccounts();
          }, 2000);
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to connect ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect social platform - COMMENTED OUT (duplicate function)
  // const disconnectPlatform = async (platform) => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     setSuccess(null);

  //     // For now, just show a message - actual disconnect would need Ayrshare API
  //     setSuccess(`${platform} disconnected successfully!`);

  //     // TODO: Implement actual disconnect API call when available
  //     console.log(`Disconnect ${platform} - API not available yet`);

  //   } catch (err) {
  //     const errorMessage = err.response?.data?.detail || err.response?.data?.message || `Failed to disconnect ${platform}`;
  //     setError(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // 3. Post message
  const postMessage = async () => {
    if (!postText.trim()) {
      setError("Please enter a message to post");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await postToAyrshare(profile.profile_key, postText, null, [
        "linkedin",
        "twitter",
        "instagram",
        "facebook",
      ]);
      setSuccess("Message posted successfully to all connected platforms!");
      setPostText("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to post message");
    } finally {
      setLoading(false);
    }
  };

  // Delete profile
  const deleteProfile = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your Ayrshare profile? This will disconnect all social accounts."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteAyrshareProfile(profile.profile_key);
      setProfile(null);
      clearProfileFromStorage();
      setSuccess("Profile deleted successfully");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Ayrshare Social Media Integration
      </h2>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Profile Status */}
      {profile ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Profile Active</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-sm text-blue-600">
                <strong>Profile Key:</strong> {profile.profile_key}
              </p>
              <p className="text-sm text-blue-600">
                <strong>Title:</strong> {profile.title}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600">
                <strong>Status:</strong>{" "}
                {profile.is_active ? "Active" : "Inactive"}
              </p>
              <p className="text-sm text-blue-600">
                <strong>Created:</strong>{" "}
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-600">
            No Ayrshare profile found. Create one to get started!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {!profile ? (
          <div className="space-y-4">
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-600 text-lg font-semibold mb-2">
                🚀 Ayrshare Profile
              </div>
              <p className="text-gray-600 mb-4">
                Your Ayrshare profile will be automatically created during
                signup.
              </p>
              {loading ? (
                <div className="text-blue-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Loading default profile...</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Profile management is handled automatically by the system.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Social Platform Connection Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Connect Your Social Media Accounts
              </h3>
              <p className="text-gray-600 text-sm">
                Connect individual social media platforms to start posting.
                Click on any platform below to connect.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* LinkedIn */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        in
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">
                          LinkedIn
                        </h4>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        connectedPlatforms.linkedin.connected
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {connectedPlatforms.linkedin.connected
                        ? "Connected"
                        : "Not Connected"}
                    </div>
                  </div>

                  {connectedPlatforms.linkedin.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {connectedPlatforms.linkedin.userImage ? (
                          <img
                            src={connectedPlatforms.linkedin.userImage}
                            alt="Profile"
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              console.log(
                                "LinkedIn image failed to load:",
                                connectedPlatforms.linkedin.userImage
                              );
                              e.target.style.display = "none";
                            }}
                            onLoad={() => {
                              console.log(
                                "LinkedIn image loaded successfully:",
                                connectedPlatforms.linkedin.userImage
                              );
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                            {connectedPlatforms.linkedin.username
                              ? connectedPlatforms.linkedin.username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600">
                            Connected as:{" "}
                            <span className="font-medium">
                              @{connectedPlatforms.linkedin.username}
                            </span>
                          </p>
                          {connectedPlatforms.linkedin.displayName && (
                            <p className="text-xs text-gray-500">
                              {connectedPlatforms.linkedin.displayName}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => disconnectPlatform("LinkedIn")}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-3 rounded text-xs transition duration-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectPlatform("LinkedIn")}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-1 px-3 rounded text-xs transition duration-200"
                    >
                      {loading ? "Connecting..." : "Connect LinkedIn"}
                    </button>
                  )}
                </div>

                {/* Twitter */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        𝕏
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">
                          Twitter
                        </h4>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        connectedPlatforms.twitter.connected
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {connectedPlatforms.twitter.connected
                        ? "Connected"
                        : "Not Connected"}
                    </div>
                  </div>

                  {connectedPlatforms.twitter.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {connectedPlatforms.twitter.userImage ? (
                          <img
                            src={connectedPlatforms.twitter.userImage}
                            alt="Profile"
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              console.log(
                                "Twitter image failed to load:",
                                connectedPlatforms.twitter.userImage
                              );
                              e.target.style.display = "none";
                            }}
                            onLoad={() => {
                              console.log(
                                "Twitter image loaded successfully:",
                                connectedPlatforms.twitter.userImage
                              );
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                            {connectedPlatforms.twitter.username
                              ? connectedPlatforms.twitter.username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600">
                            Connected as:{" "}
                            <span className="font-medium">
                              @{connectedPlatforms.twitter.username}
                            </span>
                          </p>
                          {connectedPlatforms.twitter.displayName && (
                            <p className="text-xs text-gray-500">
                              {connectedPlatforms.twitter.displayName}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => disconnectPlatform("Twitter")}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-3 rounded text-xs transition duration-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectPlatform("Twitter")}
                      disabled={loading}
                      className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium py-1 px-3 rounded text-xs transition duration-200"
                    >
                      {loading ? "Connecting..." : "Connect Twitter"}
                    </button>
                  )}
                </div>

                {/* Instagram */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        📷
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">
                          Instagram
                        </h4>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        connectedPlatforms.instagram.connected
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {connectedPlatforms.instagram.connected
                        ? "Connected"
                        : "Not Connected"}
                    </div>
                  </div>

                  {connectedPlatforms.instagram.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {connectedPlatforms.instagram.userImage ? (
                          <img
                            src={connectedPlatforms.instagram.userImage}
                            alt="Profile"
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              console.log(
                                "Instagram image failed to load:",
                                connectedPlatforms.instagram.userImage
                              );
                              e.target.style.display = "none";
                            }}
                            onLoad={() => {
                              console.log(
                                "Instagram image loaded successfully:",
                                connectedPlatforms.instagram.userImage
                              );
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                            {connectedPlatforms.instagram.username
                              ? connectedPlatforms.instagram.username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600">
                            Connected as:{" "}
                            <span className="font-medium">
                              @{connectedPlatforms.instagram.username}
                            </span>
                          </p>
                          {connectedPlatforms.instagram.displayName && (
                            <p className="text-xs text-gray-500">
                              {connectedPlatforms.instagram.displayName}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => disconnectPlatform("Instagram")}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-3 rounded text-xs transition duration-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectPlatform("Instagram")}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-300 disabled:to-pink-300 text-white font-medium py-1 px-3 rounded text-xs transition duration-200"
                    >
                      {loading ? "Connecting..." : "Connect Instagram"}
                    </button>
                  )}
                </div>

                {/* Facebook */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        f
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">
                          Facebook
                        </h4>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        connectedPlatforms.facebook.connected
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {connectedPlatforms.facebook.connected
                        ? "Connected"
                        : "Not Connected"}
                    </div>
                  </div>

                  {connectedPlatforms.facebook.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {connectedPlatforms.facebook.userImage ? (
                          <img
                            src={connectedPlatforms.facebook.userImage}
                            alt="Profile"
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              console.log(
                                "Facebook image failed to load:",
                                connectedPlatforms.facebook.userImage
                              );
                              e.target.style.display = "none";
                            }}
                            onLoad={() => {
                              console.log(
                                "Facebook image loaded successfully:",
                                connectedPlatforms.facebook.userImage
                              );
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                            {connectedPlatforms.facebook.username
                              ? connectedPlatforms.facebook.username
                                  .charAt(0)
                                  .toUpperCase()
                              : "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600">
                            Connected as:{" "}
                            <span className="font-medium">
                              {connectedPlatforms.facebook.username}
                            </span>
                          </p>
                          {connectedPlatforms.facebook.displayName && (
                            <p className="text-xs text-gray-500">
                              {connectedPlatforms.facebook.displayName}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => disconnectPlatform("Facebook")}
                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-3 rounded text-xs transition duration-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectPlatform("Facebook")}
                      disabled={loading}
                      className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium py-1 px-3 rounded text-xs transition duration-200"
                    >
                      {loading ? "Connecting..." : "Connect Facebook"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Test Post</h3>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows="3"
              />
              <button
                onClick={postMessage}
                disabled={loading || !postText.trim()}
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                {loading ? "Posting..." : "Post to Social Media"}
              </button>
            </div>

            <button
              onClick={deleteProfile}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {loading ? "Deleting..." : "Delete Profile"}
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside text-gray-600 space-y-1">
          <li>Create an Ayrshare profile to get started</li>
          <li>
            Connect your social media accounts (Twitter, LinkedIn, Facebook,
            etc.)
          </li>
          <li>
            Post messages that will be shared across all connected platforms
          </li>
        </ol>
      </div>
    </div>
  );
}

export default AyrshareOnboarding;
