# BizReel — Business Short-Video Platform

A TikTok-style social app exclusively for businesses to share short-form video content.

## Features
- **Feed** — Business reels grid with Stories bar, trending topics & suggested accounts
- **Upload** — Post a reel with video upload, title, category, hashtags
- **Analytics** — Views, followers, engagement, leads, bar chart & top reels
- **Inbox** — Business partnership messages & notifications
- **Profile** — Business profile with stats, reel grid, and about page

## Stack
- **Expo** (React Native) — cross-platform mobile
- **React Navigation** — bottom tab + stack navigation
- **expo-linear-gradient** — UI accents

---

## How to Build the APK

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Expo account: https://expo.dev/signup (free)

### Step 1 — Install dependencies
```bash
cd BizReel
npm install
```

### Step 2 — Log in to Expo
```bash
eas login
```

### Step 3 — Configure EAS project
```bash
eas build:configure
```
This will give you a `projectId` — paste it into `app.json` under `extra.eas.projectId`.

### Step 4 — Build the APK (free, cloud-based)
```bash
# For a direct .apk file (installable on Android):
eas build --platform android --profile preview
```
EAS will build in the cloud (~10-15 min) and give you a download link for the APK.

### Step 5 — Install on Android
Download the APK from the link and:
- Enable "Install unknown apps" in Android Settings
- Open the APK file to install BizReel

---

## Test Locally (no build needed)
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

## Project Structure
```
BizReel/
├── App.js                  # Root navigation
├── app.json                # Expo config
├── eas.json                # Build profiles
├── src/
│   ├── data/index.js       # All mock data & colors
│   ├── screens/
│   │   ├── FeedScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── UploadScreen.js
│   │   ├── AnalyticsScreen.js
│   │   └── InboxScreen.js
│   └── components/
│       ├── ReelCard.js
│       ├── StoryBar.js
│       └── ReelModal.js
└── assets/                 # App icons & splash
```

## Customization
- Edit `src/data/index.js` to change colors, reels, or business data
- Replace emoji placeholders with real video thumbnails via `expo-image-picker`
- Connect a backend (Firebase / Supabase) for real user accounts and uploads
