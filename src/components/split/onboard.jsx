import { useState, useEffect, useRef } from "react";
import soc1 from "../assets/soc1.png";
import soc2 from "../assets/soc2.png";
import soc3 from "../assets/soc3.png";
import soc4 from "../assets/soc4.png";
import soc5 from "../assets/soc5.png";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/simbli-light.png";
import '../App.css';
import './onboard.css'
import linkedinIcon from '../assets/socon1.png';
import twitterIcon from '../assets/socon2.png';
import instagramIcon from '../assets/socon3.png';
import facebookIcon from '../assets/socon4.png';
import on1 from '../assets/on1.png'
import {
  getAyrshareProfile,
  generateAyrshareJWT,
  getAyrshareConnectedAccounts,
  checkAyrsharePlatformConnection,
  syncAyrshareConnections,
} from "../../api/api.js";
import { loadProfileFromStorage } from "../../utils/ayrshareStorage.js";




const Onboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [platformLoading, setPlatformLoading] = useState({});
    const [recentlyDisconnected, setRecentlyDisconnected] = useState({});

    const availablePlatforms = [
        {
            id: "linkedin",
            name: "LinkedIn",
            icon: linkedinIcon,
            description: "Professional Network",
        },
        {
            id: "twitter",
            name: "X",
            icon: twitterIcon,
            description: "Microblogging Platform",
        },
        {
            id: "instagram",
            name: "Instagram",
            icon: instagramIcon,
            description: "Photo & Video Sharing",
        },
        {
            id: "facebook",
            name: "Facebook",
            icon: facebookIcon,
            description: "Social Network",
        },
    ];

    useEffect(() => {
        loadProfile();
    }, []);

    // Refresh connected accounts when loading state changes
    useEffect(() => {
        if (profile) {
            loadConnectedAccounts();
        }
    }, [profile, platformLoading]);

    // Handle redirect from Ayrshare connection
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ayrshareSuccess = urlParams.get("ayrshare_success");
        const ayrshareConnected = urlParams.get("ayrshare_connected");
        const platform = urlParams.get("platform");

        if (
            (ayrshareSuccess === "true" || ayrshareConnected === "true") &&
            platform
        ) {
            // Remove the URL parameters
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);

            // Refresh connected accounts
            if (profile) {
                loadConnectedAccounts();
            }

            // Show success message
            setSuccess(
                `${
                    platform.charAt(0).toUpperCase() + platform.slice(1)
                } connected successfully!`
            );

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }
    }, [profile]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            // Try to load from localStorage first
            const storedProfile = loadProfileFromStorage();
            if (storedProfile) {
                setProfile(storedProfile);
                await loadConnectedAccounts();
                return;
            }

            // If no stored profile, try to get default profile from API
            const response = await getAyrshareProfile();
            if (response.data) {
                setProfile(response.data);
                await loadConnectedAccounts();
            }
        } catch (err) {
            console.log("Could not load profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadConnectedAccounts = async () => {
        if (!profile) return;

        try {
            const response = await getAyrshareConnectedAccounts();
            if (response.data && response.data.accounts) {
                // Filter out invalid accounts (empty usernames, user_ids, display_names)
                const validAccounts = response.data.accounts.filter((account) => {
                    const hasValidData =
                        account.is_active &&
                        (account.username || account.user_id || account.display_name);

                    if (!hasValidData) {
                        console.log(
                            `Filtering out invalid account for ${account.platform}:`,
                            account
                        );
                    }

                    return hasValidData;
                });

                setConnectedAccounts(validAccounts);
            }
        } catch (err) {
            console.log("Could not load connected accounts:", err);
        }
    };

    const connectPlatform = async (platform) => {
        if (!profile) {
            setError("No profile found. Please create a profile first.");
            return;
        }

        try {
            setPlatformLoading((prev) => ({ ...prev, [platform]: true }));
            setError(null);
            setSuccess(null);

            // Generate platform-specific JWT with allowedSocial parameter
            const platformKey = platform.toLowerCase();
            const allowedSocial = [platformKey]; // Only allow the specific platform

            const response = await generateAyrshareJWT(
                profile.profile_key,
                10,
                allowedSocial
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

            // Show instruction to user
            setSuccess(
                `Please complete the connection in the popup window. We'll automatically detect when it's successful!`
            );
            setTimeout(() => setSuccess(null), 5000);

            // Start polling to check if platform is connected
            let pollInterval = null;
            let isPolling = true;
            let pollAttempts = 0;
            const maxPollAttempts = 150; // 5 minutes with 2-second intervals

            const startPolling = () => {
                // Add a delay before starting polling to avoid false positives from recent disconnections
                setTimeout(() => {
                    pollInterval = setInterval(async () => {
                        try {
                            pollAttempts++;
                            console.log(`Polling attempt ${pollAttempts} for ${platformKey}`);

                            // Check if platform was recently disconnected (within last 10 seconds)
                            const recentlyDisconnectedTime =
                                recentlyDisconnected[platformKey];
                            if (
                                recentlyDisconnectedTime &&
                                Date.now() - recentlyDisconnectedTime < 10000
                            ) {
                                console.log(
                                    `${platformKey} was recently disconnected, skipping poll`
                                );
                                return;
                            }

                            const response = await checkAyrsharePlatformConnection(
                                platformKey
                            );
                            if (response.data.is_connected) {
                                console.log(
                                    `${platformKey} connection detected, closing popup`
                                );

                                // Stop polling
                                isPolling = false;
                                clearInterval(pollInterval);

                                // Clear recently disconnected flag
                                setRecentlyDisconnected((prev) => {
                                    const newState = { ...prev };
                                    delete newState[platformKey];
                                    return newState;
                                });

                                // Close popup if still open
                                if (connectWindow && !connectWindow.closed) {
                                    connectWindow.close();
                                }

                                // Show success message
                                setSuccess(
                                    `${
                                        platform.charAt(0).toUpperCase() + platform.slice(1)
                                    } connected successfully!`
                                );
                                setTimeout(() => setSuccess(null), 3000);

                                // Sync connections and refresh connected accounts
                                setTimeout(async () => {
                                    try {
                                        await syncAyrshareConnections();
                                    } catch (err) {
                                        console.log("Failed to sync connections:", err);
                                    }
                                    loadConnectedAccounts();
                                }, 1000);
                            } else if (pollAttempts >= maxPollAttempts) {
                                // Stop polling after max attempts
                                console.log(`Max polling attempts reached for ${platformKey}`);
                                isPolling = false;
                                clearInterval(pollInterval);
                            }
                        } catch (err) {
                            console.log(`Polling error for ${platformKey}:`, err);
                            pollAttempts++;
                            if (pollAttempts >= maxPollAttempts) {
                                isPolling = false;
                                clearInterval(pollInterval);
                            }
                        }
                    }, 2000); // Poll every 2 seconds
                }, 3000); // Wait 3 seconds before starting polling
            };

            // Start polling with delay
            startPolling();

            // Check if window was closed manually
            const checkClosedInterval = setInterval(() => {
                if (connectWindow.closed) {
                    clearInterval(checkClosedInterval);
                    if (isPolling) {
                        clearInterval(pollInterval);
                        isPolling = false;
                    }
                    // Sync connections and reload accounts when window is closed
                    setTimeout(async () => {
                        try {
                            await syncAyrshareConnections();
                        } catch (err) {
                            console.log("Failed to sync connections:", err);
                        }
                        loadConnectedAccounts();
                    }, 2000);
                }
            }, 1000);

            // Auto-close popup after 5 minutes if no success detected
            const autoCloseTimeout = setTimeout(() => {
                if (!connectWindow.closed) {
                    console.log("Auto-closing popup after timeout");
                    connectWindow.close();
                }
                if (isPolling) {
                    clearInterval(pollInterval);
                    isPolling = false;
                }
                clearInterval(checkClosedInterval);
                setTimeout(async () => {
                    try {
                        await syncAyrshareConnections();
                    } catch (err) {
                        console.log("Failed to sync connections:", err);
                    }
                    loadConnectedAccounts();
                }, 1000);
            }, 5 * 60 * 1000); // 5 minutes
        } catch (err) {
            setError(err.response?.data?.detail || `Failed to connect ${platform}`);
        } finally {
            setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
        }
    };

    const isPlatformConnected = (platformId) => {
        return connectedAccounts.some((account) => {
            const isPlatformMatch =
                account.platform.toLowerCase() === platformId.toLowerCase();
            const hasValidData =
                account.is_active &&
                (account.username || account.user_id || account.display_name);
            return isPlatformMatch && hasValidData;
        });
    };

    const getConnectedAccount = (platformId) => {
        const account = connectedAccounts.find(
            (account) => account.platform.toLowerCase() === platformId.toLowerCase()
        );

        // Only return account if it has valid data
        if (
            account &&
            account.is_active &&
            (account.username || account.user_id || account.display_name)
        ) {
            return account;
        }

        return null;
    };

    const handleOnboard = (platform) => {
        console.log(`Onboarding with ${platform}`);
        connectPlatform(platform);
    };

    return (
        <div className="container-fluid px-4 px-lg-0 Login-hero overflow-hidden">
            {/* Header with logo and social icons */}
            <div className="container top-nv d-flex justify-content-between align-items-center pt-4 px-2 px-lg-0">
                <img src={logo} className="logo" alt="Simbli" />
                <div className="d-flex gap-3">
                    <img src={soc1} className="nv-icon-soc" alt="YouTube" />
                    <img src={soc2} className="nv-icon-soc" alt="X" />
                    <img src={soc3} className="nv-icon-soc" alt="Instagram" />
                    <img src={soc4} className="nv-icon-soc" alt="Facebook" />
                    <img src={soc5} className="nv-icon-soc" alt="LinkedIn" />
                </div>
            </div>

            <div className="container d-flex flex-column align-items-center justify-content-center mt-5 pt-lg-4 p-0">
                <div className="Login_form-overlay py-4 px-lg-5 px-3 col-lg-10">
                    <div className="text-share">
                        <div className="text-share-img me-2">
                            <img src={on1} alt=""></img>
                        </div>
                        <div className="text-share-text ">
                            <div className="text-left ">
                                <h1 className="onboard-title mb-1">Continue with Your Network</h1>
                                <p className="onboard-subtitle mb-0 mt-1">Build connections—sign in with your social account.</p>
                            </div>

                            <div className="email-display mt-2">
                                <div className="email-box d-flex align-items-center justify-content-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="me-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="email-text">Demo2025@gmail.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="alert alert-success mt-3" role="alert">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger mt-3" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="row g-3 mt-4">
                        {availablePlatforms.map((platform) => {
                            const isConnected = isPlatformConnected(platform.id);
                            const connectedAccount = getConnectedAccount(platform.id);
                            const isLoading = platformLoading[platform.name];

                            return (
                                <div key={platform.id} className="col-12 col-md-3">
                                    <div className={`social-card ${isConnected ? 'socs-connected' : 'socs1'}`}>
                                        <div className="social-icon">
                                            <img src={platform.icon} alt={platform.name} />
                                        </div>
                                        <h6 className="social-name">{platform.name}</h6>
                                        
                                        {isConnected && connectedAccount ? (
                                            <>
                                                {/* Connected Status */}
                                                <div className="connection-status">
                                                    <div className="status-indicator">
                                                        <div className="status-dot connected"></div>
                                                        <span className="status-text">Connected</span>
                                                    </div>
                                                    <div className="account-info">
                                                        <p className="account-name">
                                                            {connectedAccount.display_name || 
                                                             connectedAccount.username || 
                                                             "User"}
                                                        </p>
                                                        <p className="account-status">Active</p>
                                                    </div>
                                                </div>
                                                <button className="onboard-btn connected" disabled>
                                                    ✓ Connected
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Not Connected Status */}
                                                <div className="connection-status">
                                                    <div className="status-indicator">
                                                        <div className="status-dot disconnected"></div>
                                                        <span className="status-text">Not Connected</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="onboard-btn"
                                                    onClick={() => handleOnboard(platform.name)}
                                                    disabled={isLoading || !profile}
                                                >
                                                    {isLoading ? "Connecting..." : "Connect"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Onboard;