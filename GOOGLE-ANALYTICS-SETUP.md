# Google Analytics Setup Instructions

## Current Status:
- ✅ Google Analytics tracking code template added to all HTML files
- ⏳ Waiting for actual GA4 Measurement ID

## Setup Steps:

### 1. Create Google Analytics Account
1. Go to https://analytics.google.com/
2. Sign in with your Google account
3. Click "Start measuring"
4. Enter account name: "FreeGameHub"
5. Configure account settings
6. Click "Next"

### 2. Create Property
1. Property name: "FreeGameHub"
2. Time zone: Select your timezone
3. Currency: Select your currency
4. Click "Next"

### 3. Set Up Data Stream
1. Select platform: "Web"
2. Website URL: https://freegamehub.org
3. Stream name: "FreeGameHub Website"
4. Click "Create stream"

### 4. Get Measurement ID
1. After creating the stream, you'll see your Measurement ID
2. Format: `G-XXXXXXXXXX`
3. Copy this ID

### 5. Update Website Files
Replace `GA_MEASUREMENT_ID` with your actual Measurement ID in these files:
- index.html
- about.html
- privacy.html
- All game pages (solitaire.html, pyramid-solitaire.html, etc.)
- All guide pages
- All blog pages

Find and replace:
```
GA_MEASUREMENT_ID → G-XXXXXXXXXX
```

### 6. Set Up Goals/Events (Optional but Recommended)
In Google Analytics, configure custom events to track:
- Game plays (when user starts a game)
- Game completions (when user wins)
- Time spent playing
- Button clicks (New Game, Undo, etc.)

### 7. Verify Tracking
1. After deployment, visit your website
2. Open Google Analytics
3. Go to "Reports" > "Realtime"
4. You should see yourself as an active user
5. Click through different pages to verify tracking

## Important Notes:
- The tracking code is already in place, just needs the Measurement ID
- GA4 is the current version (Universal Analytics is deprecated)
- Data takes 24-48 hours to fully populate
- Set up Google Search Console at the same time for complete SEO tracking

