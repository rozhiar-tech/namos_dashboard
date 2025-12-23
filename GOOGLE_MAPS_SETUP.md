# Google Maps API Setup Guide

## Error: ApiTargetBlockedMapError

This error occurs when your Google Maps API key is blocked or restricted. Follow these steps to fix it:

## 1. Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and enable the following APIs for your project:

- **Maps JavaScript API** - Required for displaying the map
- **Places API** - Required for the search autocomplete
- **Geocoding API** - Required for reverse geocoding (address from coordinates)
- **Directions API** - Required for calculating routes and distances

## 2. Configure API Key Restrictions

### Option A: No Restrictions (For Development)

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under "Application restrictions", select **"None"** (not recommended for production)
4. Under "API restrictions", select **"Don't restrict key"** (for development) or select only the APIs listed above
5. Save the changes

### Option B: HTTP Referrer Restrictions (Recommended for Production)

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under "Application restrictions", select **"HTTP referrers (web sites)"**
4. Add your domains:
   - `http://localhost:3002/*` (for local development)
   - `http://localhost:3000/*` (alternative local port)
   - `https://your-domain.com/*` (your production domain)
   - `https://*.netlify.app/*` (if deploying to Netlify)
   - `https://*.vercel.app/*` (if deploying to Vercel)
5. Under "API restrictions", select **"Restrict key"** and choose:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
6. Save the changes

## 3. Set Environment Variable

Create or update your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important:**

- The variable name must start with `NEXT_PUBLIC_` to be accessible in the browser
- Restart your Next.js development server after adding the environment variable

## 4. Verify Billing

Make sure billing is enabled for your Google Cloud project. Google Maps APIs require a billing account (though they offer free credits).

## 5. Wait for Changes to Propagate

After changing API key restrictions, wait a few minutes for the changes to propagate before testing again.

## Common Issues

### Still Getting ApiTargetBlockedMapError?

- Check that your current domain matches the HTTP referrer restrictions
- Verify all required APIs are enabled
- Ensure billing is enabled
- Try using "None" restrictions temporarily to test if the issue is with restrictions

### API Key Not Working?

- Make sure the environment variable is set correctly
- Restart your development server
- Check the browser console for more specific error messages
- Verify the API key in Google Cloud Console matches the one in your `.env.local`
