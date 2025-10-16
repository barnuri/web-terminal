# Web Terminal - Implementation Tasks

## Overview
This document tracks all implementation tasks for the web terminal project, including authentication, UI improvements, and terminal persistence features.

**Last Updated:** October 15, 2025
**Status:** Core Features Complete - Ready for Testing

---

## Task Status Legend

- **TODO** - Task not yet started
- **IN PROGRESS** - Currently being worked on
- **BLOCKED** - Waiting on dependencies or external factors
- **COMPLETED** - Task finished
- **CANCELLED** - Task no longer relevant

---

## Current Sprint: Authentication & Mobile Improvements

### Phase 1: Backend Authentication Setup (COMPLETED ✓)

#### High Priority - Auth Module Structure (COMPLETED ✓)
- [x] Create auth module directory structure
  - **Files created:**
    - `server/src/auth/auth.module.ts`
    - `server/src/auth/auth.controller.ts`
    - `server/src/auth/auth.service.ts`
    - `server/src/auth/guards/jwt-auth.guard.ts`
    - `server/src/auth/guards/ws-auth.guard.ts`
    - `server/src/auth/strategies/google.strategy.ts`
    - `server/src/auth/strategies/github.strategy.ts`
  - **Completed:** October 15, 2025

#### High Priority - Install JWT Dependencies (COMPLETED ✓)
- [x] Install required JWT packages
  - **Packages installed:**
    - `@nestjs/jwt@^11.0.1`
    - `@types/jsonwebtoken@^9.0.10`
  - **Completed:** October 15, 2025

#### High Priority - Implement OAuth Strategies (COMPLETED ✓)
- [x] Google OAuth Strategy Implementation
  - **Location:** `server/src/auth/strategies/google.strategy.ts`
  - **Features:**
    - Extends PassportStrategy with 'google' identifier
    - Uses ConfigService for credentials
    - Extracts email, name, picture from profile
    - Returns standardized user object
  - **Completed:** October 15, 2025

- [x] GitHub OAuth Strategy Implementation
  - **Location:** `server/src/auth/strategies/github.strategy.ts`
  - **Features:**
    - Extends PassportStrategy with 'github' identifier
    - Uses ConfigService for credentials
    - Extracts email, name, picture from profile
    - Returns standardized user object
  - **Completed:** October 15, 2025

#### High Priority - Auth Service Implementation (COMPLETED ✓)
- [x] Create JWT token management service
  - **Location:** `server/src/auth/auth.service.ts`
  - **Methods implemented:**
    - `handleOAuthCallback(user)` - Generate JWT token
    - `verifyToken(token)` - Validate JWT token
    - `validateEmail(email)` - Check against allowlist
  - **Features:**
    - Checks AUTH_ENABLE config
    - Validates email against AUTH_ALLOWED_EMAILS
    - Signs JWT with proper expiration
    - Returns user payload on successful validation
  - **Completed:** October 15, 2025

#### High Priority - Auth Controller Implementation (COMPLETED ✓)
- [x] Create OAuth callback routes
  - **Location:** `server/src/auth/auth.controller.ts`
  - **Routes implemented:**
    - `GET /auth/google` - Initiate Google OAuth
    - `GET /auth/google/callback` - Handle Google callback
    - `GET /auth/github` - Initiate GitHub OAuth
    - `GET /auth/github/callback` - Handle GitHub callback
    - `GET /auth/logout` - Clear auth session
    - `GET /auth/status` - Check authentication status
  - **Features:**
    - Redirects to provider on login routes
    - Generates JWT on successful callback
    - Returns token to frontend with redirect
    - Proper error handling for unauthorized emails
  - **Completed:** October 15, 2025

#### High Priority - Auth Guards Implementation (COMPLETED ✓)
- [x] JWT Auth Guard
  - **Location:** `server/src/auth/guards/jwt-auth.guard.ts`
  - **Behavior:**
    - Checks if AUTH_ENABLE is true (skip if false)
    - Extracts JWT from Authorization header
    - Verifies token and attaches user to request
    - Rejects with 401 if invalid
  - **Completed:** October 15, 2025

- [x] WebSocket Auth Guard
  - **Location:** `server/src/auth/guards/ws-auth.guard.ts`
  - **Behavior:**
    - Checks if AUTH_ENABLE is true (skip if false)
    - Extracts JWT from handshake auth.token
    - Verifies token and attaches user to socket.data
    - Disconnects socket if invalid
  - **Completed:** October 15, 2025

#### High Priority - Integrate Auth into Gateway (COMPLETED ✓)
- [x] Update TerminalGateway with auth guard
  - **Location:** `server/src/terminal/terminal.gateway.ts`
  - **Changes:**
    - Added auth validation in `handleConnection` method
    - Checks user.email against allowlist
    - Disconnects unauthorized connections
    - Associates sessions with user ID if authenticated
  - **Features:**
    - Auth skipped when AUTH_ENABLE=false
    - Connections rejected when auth fails
    - Sessions tied to authenticated user
  - **Completed:** October 15, 2025

### Phase 2: Frontend Authentication UI (COMPLETED ✓)

#### High Priority - Auth Context Setup (COMPLETED ✓)
- [x] Create authentication context
  - **Location:** `client/src/contexts/AuthContext.tsx`
  - **State managed:**
    - `isAuthenticated: boolean`
    - `user: { email, name, picture } | null`
    - `token: string | null`
    - `isLoading: boolean`
  - **Methods:**
    - `login()` - Redirect to OAuth
    - `logout()` - Clear token
    - `checkAuth()` - Verify current token
  - **Completed:** October 15, 2025

#### High Priority - Login Page Component (COMPLETED ✓)
- [x] Create login page UI
  - **Location:** `client/src/components/Login.tsx`
  - **Elements:**
    - App branding/logo
    - "Sign in with Google" button
    - "Sign in with GitHub" button
    - Loading state
    - Error message display
  - **Styling:** Matches theme system
  - **Completed:** October 15, 2025

#### Medium Priority - OAuth Callback Handler (COMPLETED ✓)
- [x] Create callback page component
  - **Location:** `client/src/components/OAuthCallback.tsx`
  - **Behavior:**
    - Extracts token from URL params
    - Saves to localStorage
    - Updates AuthContext
    - Redirects to main app
    - Shows error if callback failed
  - **Completed:** October 15, 2025

#### Medium Priority - Protected Route Wrapper (COMPLETED ✓)
- [x] Implement route protection
  - **Implementation:** Integrated into `client/src/App.tsx`
  - **Behavior:**
    - Checks authentication status
    - Shows loading during check
    - Redirects to /login if not authenticated
    - Renders app if authenticated
  - **Completed:** October 15, 2025

#### High Priority - Update App.tsx with Auth (COMPLETED ✓)
- [x] Integrate authentication into app
  - **Location:** `client/src/App.tsx`
  - **Changes:**
    - Wrapped app with AuthProvider
    - Added route for /login and /auth/callback
    - Protected main app with auth check
    - Checks auth on app load
  - **Completed:** October 15, 2025

#### High Priority - Update Socket Connection with Token (COMPLETED ✓)
- [x] Add JWT to socket.io connection
  - **Location:** `client/src/components/Terminal.tsx`
  - **Changes:**
    - Gets token from AuthContext
    - Passes token in socket auth parameter
    - Handles authentication errors
    - Auto-disconnects on auth failure
  - **Completed:** October 15, 2025

### Phase 3: Mobile-Friendly UI Improvements

#### High Priority - Virtual Keyboard Component (COMPLETED ✓)
- [x] Create mobile keyboard helper with modifier key support
  - **Location:** `client/src/components/VirtualKeyboard.tsx`
  - **Keys to include:**
    - Tab (\\t)
    - Ctrl modifier (sticky/toggle)
    - Shift modifier (sticky/toggle)
    - Ctrl+C (\\x03)
    - Ctrl+D (\\x04)
    - Esc (\\x1b)
    - Arrow keys (↑ ↓ ← →)
    - Ctrl+Z, Ctrl+L
    - Letter keys (A-Z) with Ctrl support
  - **Features:**
    - Modifier keys (Ctrl, Shift) can be toggled on/off
    - Arrow key navigation
    - Send key combinations to terminal
    - Visual feedback for active modifiers
    - Long-press haptic feedback
  - **Styling:**
    - Min 44px touch targets
    - Fixed position at bottom
    - Collapsible on desktop
    - Themed colors
  - **Completed:** October 12, 2025

#### Medium Priority - Improve Terminal Keyboard Handling (COMPLETED ✓)
- [x] Fix Tab key capture in terminal
  - **Location:** `client/src/components/Terminal.tsx`
  - **Changes:**
    - Use `attachCustomKeyEventHandler`
    - Prevent default Tab behavior
    - Allow xterm.js to handle Tab
  - **Acceptance Criteria:**
    - Tab works for autocomplete
    - Doesn't change browser focus
  - **Completed:** October 12, 2025

#### Low Priority - Mobile Responsive Layout (COMPLETED ✓)
- [x] Optimize layout for mobile devices
  - **Files:** `client/src/App.css`, component styles
  - **Changes:**
    - Media queries for small screens
    - Adjust terminal font size on mobile
    - Make header stack vertically if needed
    - Improve tab bar for touch
    - Touch-friendly tap targets (44px minimum)
  - **Completed:** October 12, 2025

#### Low Priority - Touch Gesture Support (COMPLETED ✓)
- [x] Add mobile-specific interactions
  - **Features:**
    - Swipe to switch tabs
    - Long-press for haptic feedback
    - Pinch to zoom font size (8-24px range)
  - **Completed:** October 12, 2025

### Phase 3.5: Folder Shortcuts Feature

#### High Priority - Backend Configuration (COMPLETED ✓)
- [x] Add FOLDERS_SHORTCUTS environment variable
  - **Location:** `server/src/config/configuration.ts`, `server/.env.example`
  - **Format:** Comma-separated list of folder paths
  - **Example:** `FOLDERS_SHORTCUTS=/home/user/projects,/var/www,/etc`
  - **Completed:** October 12, 2025

#### High Priority - Backend Support for Custom CWD (COMPLETED ✓)
- [x] Update terminal service to support custom working directory
  - **Location:** `server/src/terminal/terminal.service.ts`
  - **Changes:**
    - Add `customCwd` parameter to `createSession`
    - Add `getFolderShortcuts()` method
    - Validate custom paths using existing `validatePath` method
  - **Completed:** October 12, 2025

#### High Priority - Gateway Socket Events (COMPLETED ✓)
- [x] Add folder shortcuts socket events
  - **Location:** `server/src/terminal/terminal.gateway.ts`
  - **Events:**
    - `create-session` now accepts optional `cwd` parameter
    - `get-folder-shortcuts` returns list of configured shortcuts
    - `folder-shortcuts` event emitted to client with shortcuts array
  - **Completed:** October 12, 2025

#### High Priority - FolderShortcuts UI Component (COMPLETED ✓)
- [x] Create folder shortcuts component
  - **Location:** `client/src/components/FolderShortcuts.tsx`, `.css`
  - **Features:**
    - Connects to WebSocket to get shortcuts
    - Displays folder name (last part of path)
    - Click to create new terminal in that folder
    - Collapsible with toggle button
    - Mobile-responsive design
  - **Styling:**
    - Fixed position top-right
    - Min 44px touch targets
    - Smooth animations
    - Themed colors
  - **Completed:** October 12, 2025

#### High Priority - Terminal Context Update (COMPLETED ✓)
- [x] Update TerminalContext to support custom cwd
  - **Location:** `client/src/contexts/TerminalContext.tsx`
  - **Changes:**
    - Add `cwd?: string` to TerminalTab interface
    - Update `addTab` to accept `cwd` and `title` parameters
    - Auto-generate title from folder name when cwd provided
  - **Completed:** October 12, 2025

#### High Priority - Terminal Component Integration (COMPLETED ✓)
- [x] Pass cwd to terminal sessions
  - **Location:** `client/src/components/Terminal.tsx`
  - **Changes:**
    - Add `cwd?: string` prop to TerminalProps
    - Pass cwd in `create-session` socket event
  - **Completed:** October 12, 2025

#### High Priority - Integration with TerminalTabs (COMPLETED ✓)
- [x] Integrate FolderShortcuts component
  - **Location:** `client/src/components/TerminalTabs.tsx`
  - **Changes:**
    - Import and render FolderShortcuts component
    - Pass tab.cwd to Terminal component
    - Handle folder selection to create new tab with cwd
  - **Completed:** October 12, 2025

### Phase 4: Terminal Persistence (COMPLETED ✓)

#### High Priority - Modify Session Lifecycle (COMPLETED ✓)
- [x] Remove auto-destroy on disconnect
  - **Location:** `server/src/terminal/terminal.gateway.ts:89-104`
  - **Changes:**
    - Sessions NOT destroyed in `handleDisconnect`
    - Updates `lastAccessedAt` timestamp via `updateSessionAccess`
    - Sets `expiresAt` based on timeout config
    - Keeps session in memory for reconnection
  - **Completed:** October 15, 2025

#### High Priority - Add Session Timeout Config (COMPLETED ✓)
- [x] Add timeout configuration
  - **Location:** `server/src/config/configuration.ts`
  - **Configuration:**
    ```typescript
    terminal: {
      sessionTimeout: parseInt(
        process.env.TERMINAL_SESSION_TIMEOUT || '1800000',
        10,
      ), // 30 minutes default
      maxSessions: parseInt(process.env.TERMINAL_MAX_SESSIONS || '10', 10),
    }
    ```
  - **Environment Variable:** TERMINAL_SESSION_TIMEOUT (in milliseconds)
  - **Default:** 30 minutes (1800000ms)
  - **Completed:** October 15, 2025

#### High Priority - Implement Session Cleanup (COMPLETED ✓)
- [x] Add periodic session cleanup
  - **Location:** `server/src/terminal/terminal.service.ts:26-32, 187-202`
  - **Implementation:**
    - Runs cleanup every 5 minutes via setInterval
    - Checks `expiresAt` against current time
    - Destroys expired sessions
    - Logs cleanup actions
    - Cleanup started on module init
    - Cleanup stopped on module destroy
  - **Completed:** October 15, 2025

#### Medium Priority - Update Session Interface (COMPLETED ✓)
- [x] Enhance session metadata
  - **Location:** `server/src/terminal/terminal.service.ts:8-16`
  - **Fields added:**
    - `userId: string | null`
    - `lastAccessedAt: Date`
    - `expiresAt: Date`
    - `createdAt: Date`
  - **Creation logic** populates all fields correctly
  - **Completed:** October 15, 2025

#### Medium Priority - Client Session Recovery (COMPLETED ✓)
- [x] Implement reconnection to existing sessions
  - **Changes:**
    - Stores sessionId in localStorage (`terminal-session-${sessionId}`)
    - Added `reconnect-session` socket event handler in gateway
    - Handles session not found gracefully with fallback
    - Creates new session if recovery fails
    - Client attempts reconnect on connect before creating new session
  - **Locations:**
    - `client/src/components/Terminal.tsx:73-114`
    - `server/src/terminal/terminal.gateway.ts:285-334`
  - **Completed:** October 15, 2025

---

## Backlog

### Features
- [ ] Multi-user session sharing (collaborative terminals)
- [ ] Session recording and playback
- [ ] File upload/download via terminal UI
- [ ] Terminal themes customization
- [ ] Command history search
- [ ] Split panes (multiple terminals visible)

### Bugs
- [ ] Check for memory leaks in long-running sessions
- [ ] Test terminal resize behavior on orientation change

### Technical Debt
- [ ] Add unit tests for auth service
- [ ] Add integration tests for OAuth flow
- [ ] Add E2E tests for terminal operations
- [ ] Implement proper logging system (Winston/Pino)
- [ ] Add rate limiting to auth endpoints

### Documentation
- [ ] Add OAuth setup guides to README
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Add troubleshooting section
- [ ] Document mobile usage

---

## Completed Tasks

### October 15, 2025
- [x] Implemented full OAuth authentication system (Google & GitHub)
- [x] Created auth module with JWT token management
- [x] Implemented auth guards for HTTP and WebSocket connections
- [x] Created Login UI component with OAuth buttons
- [x] Implemented OAuth callback handler
- [x] Created AuthContext for state management
- [x] Integrated authentication into terminal gateway
- [x] Implemented session persistence (sessions survive disconnections)
- [x] Added session timeout configuration (default 30 minutes)
- [x] Implemented automatic session cleanup (runs every 5 minutes)
- [x] Added session recovery/reconnection feature
- [x] Client-side localStorage session tracking
- [x] Server-side reconnect-session socket event handler
- [x] Updated session interface with persistence metadata

### October 12, 2025
- [x] Created comprehensive TODOS.md
- [x] Created AGENTS.md with best practices
- [x] Analyzed existing codebase structure
- [x] Identified auth configuration already in place
- [x] Planned implementation phases
- [x] Implemented Virtual Keyboard with modifier keys (Ctrl, Shift)
- [x] Fixed Tab key capture in terminal
- [x] Optimized mobile responsive layout (CSS media queries)
- [x] Added touch gesture support (swipe, long-press, pinch-to-zoom)
- [x] Implemented Folder Shortcuts feature (FOLDERS_SHORTCUTS env var)
- [x] Added backend support for custom working directory in terminals
- [x] Created FolderShortcuts UI component
- [x] Updated Terminal and TerminalContext to support custom cwd

---

## Implementation Order

1. **Backend Auth** (Phase 1) - Build authentication foundation
2. **Frontend Auth** (Phase 2) - Add login UI and token management
3. **Mobile UI** (Phase 3) - Improve mobile experience (can run parallel with #4)
4. **Persistence** (Phase 4) - Add session persistence (can run parallel with #3)
5. **Documentation** (Phase 5) - Update docs
6. **Testing** (Phase 6) - Comprehensive testing

---

## Notes

### Important Dates
- Target completion: TBD
- Production deployment: TBD

### Configuration
- Auth disabled by default (AUTH_ENABLE=false)
- OAuth packages already installed
- .env.example already has auth variables
- Configuration structure exists in config/configuration.ts

### Resources
- OAuth app setup required before testing
- Mobile device or emulator needed for mobile testing
- Consider ngrok for testing OAuth callbacks locally

---

**Maintained By:** Development Team
