# BizReel — Business Short-Video Platform

A TikTok-style social app exclusively for businesses to share short-form video content.

## Features
- **Feed** — Business reels grid with Stories bar, trending topics & suggested accounts.
- **Upload** — Post a reel with video upload, title, category, and hashtags.
- **Analytics** — Views, followers, engagement, leads, bar chart & top reels.
- **Inbox** — Business partnership messages & notifications.
- **Live** — Agora-powered live streaming for businesses.
- **Profile** — Business profile with stats, reel grid, catalog, and about page.

## Stack
- **Expo SDK 52** (React Native)
- **Expo Router** — File-based routing
- **Supabase** — Authentication, Database & Storage
- **Agora** — Real-time Live Streaming
- **expo-av** — Video playback
- **expo-image** — High-performance image loading

---

## Database Setup (SQL)
To set up the backend, execute the contents of `MASTER_DATABASE_FINAL.sql` in your Supabase SQL Editor. This will create:
1. All necessary tables (profiles, posts, products, etc.).
2. Database functions for view counts and viewer counts.
3. RLS (Row Level Security) policies for data protection.
4. Triggers for automatic profile creation on signup.

---

## How to Build the APK

### 1. Build via GitHub Actions (Recommended)
This project is configured with GitHub Actions. Simply push your code to `main` or `master`, and the APK will be automatically built and available in the "Actions" tab.

### 2. Local Manual Build (No Expo EAS)
To build the APK locally without using Expo's managed services:
```bash
npm run build:android
```
The APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.

### 3. Managed Build (Expo EAS)
If you still wish to use EAS:
```bash
eas build --platform android --profile preview
```

---

## Local Development
```bash
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app or run `a` for Android Emulator.

## Project Structure
- `app/` — Expo Router screens (Tabs, Auth, Live).
- `components/` — Reusable UI components.
- `lib/` — Supabase client and notification helpers.
- `Context/` — Auth state management.
- `assets/` — App icons and splash screen.
