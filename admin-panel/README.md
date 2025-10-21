# ItsYouApp Admin Panel

Beautiful glassmorphism admin dashboard built with Next.js 15, React 19, and Tailwind CSS 4.

## Features

- **Glassmorphism Design** - Modern frosted glass UI with blur effects
- **Responsive Layout** - Works on all screen sizes
- **10 Dashboard Pages**:
  - Dashboard (Overview with stats and activity)
  - Messages (WhatsApp & Instagram monitoring)
  - SMS (Text message tracking)
  - Users (User management)
  - Photos (Shared photos gallery)
  - Music (Music library management)
  - Storage (Firebase storage monitoring)
  - Home Message (Customize app welcome message)
  - Analytics (Usage statistics and charts)
  - Settings (Admin preferences)

## Getting Started

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the login page.

### Build for Production

```bash
npm run build
npm start
```

## Design System

### Glassmorphism Classes

- `.glass` - Basic glass effect
- `.glass-card` - Card with glass effect
- `.glass-button` - Button with glass effect
- `.glass-input` - Input field with glass effect
- `.animated-gradient` - Animated gradient background
- `.float-animation` - Floating animation
- `.glow` - Blue glow effect
- `.glow-pink` - Pink glow effect

### Color Palette

- Primary: Blue (#3b82f6)
- Romantic: Pink (#ec4899)
- Background: Dark (#0a0a0a)
- Cards: Dark slate with transparency

## Current State

This is the **design phase** with placeholder data and functionality:

- ✅ Beautiful glassmorphism UI
- ✅ All pages with mock data
- ✅ Responsive layout
- ✅ Animations and transitions
- ⏳ Firebase integration (to be implemented)
- ⏳ Real authentication (to be implemented)
- ⏳ API endpoints (to be implemented)

## Next Steps

1. Review the design
2. Implement Firebase Admin SDK
3. Create API routes for data fetching
4. Add real authentication
5. Connect to mobile app data

## Tech Stack

- **Framework**: Next.js 15 (App Directory)
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4
- **TypeScript**: Type-safe development
- **Deployment**: Ready for Vercel

## Project Structure

```
admin-panel/
├── app/
│   ├── page.tsx                    # Login page
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout
│   │   ├── page.tsx                # Main dashboard
│   │   ├── messages/page.tsx       # Messages monitoring
│   │   ├── sms/page.tsx            # SMS monitoring
│   │   ├── users/page.tsx          # User management
│   │   ├── photos/page.tsx         # Photos gallery
│   │   ├── music/page.tsx          # Music library
│   │   ├── storage/page.tsx        # Storage monitoring
│   │   ├── home-message/page.tsx   # Home message editor
│   │   ├── analytics/page.tsx      # Analytics dashboard
│   │   └── settings/page.tsx       # Settings
│   └── globals.css                 # Global styles
├── components/
│   └── layout/
│       ├── Sidebar.tsx             # Navigation sidebar
│       └── Header.tsx              # Dashboard header
└── package.json
```

## Notes

- All data is currently mock/placeholder data
- Authentication is placeholder (navigates to dashboard after 1 second)
- Firebase will be integrated after design approval
- Built for testing and demonstration purposes
