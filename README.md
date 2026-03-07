# SDEMY Mobile (React Native + Expo)

This folder is a new mobile frontend.  
Your existing backend is unchanged.

## 1) Setup

```bash
cd SDEMY/mobile
cp .env.example .env
```

Set `.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:5000
EXPO_PUBLIC_CURRENCY=$
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

Use your machine IP (not `localhost`) so Android device/emulator can reach backend.

## 2) Install and run

```bash
npm install
npx expo start
```

## 3) Generate Expo APK

```bash
npm install -g eas-cli
eas login
eas init
eas build -p android --profile preview
```

`preview` profile in `eas.json` is configured for APK.

## Implemented mobile screens

- Home
- Courses list + search
- Course details + enroll trigger
- Enrollments + progress
- Player (YouTube lecture + mark complete)
- Settings (signed-in Clerk user + sign out)
- Auth screen (Clerk sign-in and sign-up with email verification)

## Notes

- This migration keeps backend endpoints as-is.
- Uses native Clerk auth via `@clerk/clerk-expo`.
- Protected API calls use Clerk `getToken()` automatically.
