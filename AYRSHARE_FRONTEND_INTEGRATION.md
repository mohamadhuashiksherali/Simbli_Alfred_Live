# Ayrshare Frontend Integration

This document describes the frontend integration of Ayrshare social media management functionality into the Alfred application.

## Overview

The Ayrshare integration allows users to:
- Create and manage Ayrshare profiles
- Connect multiple social media accounts through Ayrshare
- Post content to multiple platforms simultaneously
- Schedule posts for future publication
- Manage all social media from a unified interface

## Components

### 1. API Service (`src/api/api.js`)

Added Ayrshare API functions:
- `createAyrshareProfile(title)` - Create a new Ayrshare profile
- `getAyrshareProfile()` - Get current user's Ayrshare profile
- `generateAyrshareJWT(profileKey, expiresIn, redirect)` - Generate JWT for account connection
- `postToAyrshare(profileKey, post, media, platforms)` - Post content immediately
- `scheduleAyrsharePost(profileKey, post, scheduledTime, media, platforms)` - Schedule a post
- `deleteAyrshareProfile(profileKey)` - Delete Ayrshare profile

### 2. AyrshareManager Component (`src/components/AyrshareManager.jsx`)

A comprehensive component for managing Ayrshare functionality:
- **Profile Management**: Create, view, and delete Ayrshare profiles
- **Account Connection**: Connect social media accounts through Ayrshare
- **Posting**: Post content immediately to connected platforms
- **Scheduling**: Schedule posts for future publication
- **Platform Selection**: Choose specific platforms for posts
- **Error Handling**: Comprehensive error and success messaging

### 3. Updated OnBoarding Component (`src/components/OnBoarding.jsx`)

Enhanced the existing OnBoarding component with:
- Proper API integration using the new service functions
- Better error handling and user feedback
- Improved UI with loading states and status messages
- Profile management capabilities

### 4. Social Connections Integration

Updated both `SocialConnections.jsx` and `SocialMedia.jsx` to include:
- Ayrshare as a platform option
- Integration of the AyrshareManager component
- Seamless integration with existing social media connection flows

## Features

### Profile Management
- Create Ayrshare profiles with custom titles
- View profile status and information
- Delete profiles when no longer needed

### Social Media Connection
- Generate secure JWT tokens for account connection
- Open Ayrshare connection window in popup
- Support for multiple social media platforms
- Real-time connection status updates

### Content Publishing
- Post content immediately to all connected platforms
- Select specific platforms for targeted posting
- Support for text content and media attachments
- Character count validation for platform-specific limits

### Post Scheduling
- Schedule posts for future publication
- DateTime picker for precise scheduling
- Platform-specific scheduling options
- Visual feedback for scheduled posts

### User Experience
- Responsive design with Tailwind CSS
- Loading states and progress indicators
- Error handling with user-friendly messages
- Success notifications and confirmations
- Tabbed interface for different functions

## Usage

### Accessing Ayrshare Features

1. **Through Dashboard**: Navigate to the "Social" tab in the main dashboard
2. **Through Social Connections**: Open the social connections modal
3. **Direct Component**: Import and use `AyrshareManager` component directly

### Basic Workflow

1. **Create Profile**: Click "Create Ayrshare Profile" to set up your account
2. **Connect Accounts**: Use "Connect Social Accounts" to link your social media
3. **Post Content**: Use the "Post Now" tab to publish content immediately
4. **Schedule Posts**: Use the "Schedule Post" tab to plan future content

### API Integration

The frontend communicates with the backend through the following endpoints:
- `POST /ayrshare/profiles` - Create profile
- `GET /ayrshare/profiles/me` - Get user profile
- `POST /ayrshare/profiles/generate-jwt` - Generate connection JWT
- `POST /ayrshare/post` - Post content
- `POST /ayrshare/schedule` - Schedule post
- `DELETE /ayrshare/profiles/{profileKey}` - Delete profile

## Error Handling

The integration includes comprehensive error handling:
- Network errors with retry suggestions
- Authentication errors with re-login prompts
- Validation errors with specific field guidance
- API errors with user-friendly messages
- Connection timeouts with fallback options

## Security

- JWT tokens are generated securely on the backend
- Connection windows use secure popup mechanisms
- User credentials are never stored in the frontend
- All API calls include proper authentication headers

## Browser Compatibility

- Modern browsers with ES6+ support
- Popup window support for OAuth flows
- Local storage for temporary state management
- Responsive design for mobile and desktop

## Future Enhancements

Potential improvements for future versions:
- Bulk posting capabilities
- Content templates and presets
- Analytics and performance tracking
- Advanced scheduling with recurring posts
- Media library integration
- Team collaboration features

## Troubleshooting

### Common Issues

1. **Connection Window Blocked**: Ensure popup blockers are disabled
2. **Profile Creation Failed**: Check backend Ayrshare configuration
3. **Posting Errors**: Verify social media account connections
4. **Scheduling Issues**: Ensure future dates are selected

### Debug Information

Enable browser developer tools to view:
- API request/response logs
- Error messages and stack traces
- Network connectivity issues
- Authentication token status

## Support

For technical support or questions about the Ayrshare integration:
1. Check the browser console for error messages
2. Verify backend Ayrshare service configuration
3. Ensure proper authentication tokens
4. Contact the development team for assistance
