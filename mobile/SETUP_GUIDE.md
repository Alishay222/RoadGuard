# RoadGuard Mobile App - Setup & Usage Guide

## Overview

This is a complete React Native mobile app for RoadGuard, featuring:
- ✅ User authentication (Login/Register)
- ✅ Dashboard with traffic stats
- ✅ AI-powered chat assistant (NLU integration)
- ✅ Real-time incident & alert viewing
- ✅ Secure token storage
- ✅ Backend API integration

## Quick Start

### 1. Backend Setup (Prerequisites)

Make sure your FastAPI backend is running:

```powershell
cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` flag is **required** so the backend listens on all network interfaces (not just localhost), allowing mobile devices/emulators on your network to connect.

### 2. Mobile App Configuration

The API URL is configured in `services/api.ts`:

```typescript
const API_BASE_URL = 'http://192.168.100.6:8000';
```

**Important:** Change `192.168.100.6` to your computer's IP address on the network.

To find your IP:
- **Windows**: Run `ipconfig` in terminal and look for IPv4 Address
- The IP shown in Expo terminal (e.g., "exp://192.168.100.6:8082") is your correct IP

### 3. Start the Mobile App

```powershell
cd mobile
npm install  # (if not already done)
npm start
```

Then in the terminal, press:
- **`a`** for Android (emulator or physical device)
- **`w`** for Web (browser testing)
- **`i`** for iOS (if on Mac)

Or scan the QR code with Expo Go app on your phone.

### 4. Create a Test Account

1. Open the app
2. Click "Register here" on the login screen
3. Fill in name, email, and password
4. Tap "Create Account"
5. You'll be logged in and taken to the dashboard

## Features

### 🏠 Dashboard (Home Tab)
- Quick overview of statistics
- Recent incidents (last 7 days)
- Active alerts
- Quick action buttons
- Logout option

### 💬 Chat (Chat Tab)
- AI-powered traffic assistant
- Ask about traffic, incidents, safety tips
- Suggestions for quick queries
- Real-time NLU intent recognition
- Connected to your backend's NLU service

### ⚠️ Incidents & Alerts (Incidents Tab)
- View all traffic incidents
- Filter by city and incident type
- Toggle between incidents and alerts
- Real-time severity indicators
- Pull-to-refresh data

## API Endpoints Used

The app connects to these backend endpoints:

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/chat` - Chat with AI
- `GET /api/incidents` - Get incidents
- `GET /api/alerts` - Get alerts
- `GET /api/nlu/stats` - NLU statistics
- `GET /health` - Health check

## Architecture

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout with auth provider
│   ├── types.ts             # TypeScript types
│   ├── auth/
│   │   ├── _layout.tsx      # Auth navigation
│   │   ├── login.tsx        # Login screen
│   │   └── register.tsx     # Registration screen
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigation
│   │   ├── dashboard.tsx    # Home tab
│   │   ├── chat.tsx         # Chat tab
│   │   └── incidents.tsx    # Incidents tab
│   ├── context/
│   │   └── AuthContext.tsx  # Auth state management
│   └── screens/
│       ├── DashboardScreen.tsx
│       ├── ChatScreen.tsx
│       └── IncidentsScreen.tsx
├── services/
│   └── api.ts               # API client
└── package.json
```

## Environment Configuration

### For Local Testing (Web/Emulator)
If testing on web or emulator on the same machine:
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

### For Device Testing (Phone)
For testing on a physical phone on the same network:
```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000';
// Example: 'http://192.168.100.6:8000'
```

## Troubleshooting

### "Something went wrong" Error
1. Clear app cache: `npm start -- --reset-cache`
2. Check backend is running on port 8000
3. Verify API URL is correct in `services/api.ts`
4. Check internet connection

### Can't Connect to Backend
1. Verify backend is running: `http://YOUR_IP:8000/health` in browser
2. Check firewall settings (port 8000 may be blocked)
3. Ensure phone/emulator is on same network as computer
4. Update API_BASE_URL with correct IP

### Port 8081/8082 Already in Use
The app uses different ports. If you see "Port 8081 is being used", it will ask to use 8082.
Answer "Yes" when prompted.

### Login/Register Failing
1. Check backend database is connected
2. Verify backend is running with `--reload` flag
3. Check backend logs for errors
4. Ensure you're using valid email format

## Testing the Chat Feature

Try these queries to test the AI assistant:
- "What's the traffic situation?"
- "Tell me about incidents near me"
- "What are some safety tips?"
- "Emergency contact"
- "How do I handle a puncture?"

## Performance Tips

1. **Reduce list size**: Incidents/alerts limit set to 50 items by default
2. **Enable caching**: Backend caches API responses (1 hour)
3. **Use appropriate filters**: Filter by city to reduce results
4. **Close unused tabs**: Stop background data fetching

## Future Enhancements

- [ ] Real-time location tracking
- [ ] Push notifications for alerts
- [ ] Offline mode
- [ ] Dark mode support (partially done)
- [ ] Multi-language support
- [ ] Emergency quick call button
- [ ] Map integration
- [ ] Voice input for chat

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs
3. Check mobile app console (Metro Bundler output)
4. Verify network connectivity

## Security Notes

- Tokens are stored securely using Expo Secure Store
- All API calls use HTTPS (in production)
- No sensitive data logged
- Logout clears all stored credentials

---

**Last Updated**: April 2026
**App Version**: 1.0.0
