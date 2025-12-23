# User Profile, Favorite Places & Advertisements - Implementation Guide

## Overview

This implementation adds three major features:
1. **Full Profile Editing** - Users can edit ALL their information
2. **Favorite Places** - Save locations like Home, Work, etc. for quick ride booking
3. **Advertisements** - Admin-managed ads shown to users

## Database Migration

Run the migration script:

```bash
mysql -u your_user -p your_database < database_favorites_ads_migration.sql
```

## 1. Profile Editing

### Update Profile Endpoint

**Endpoint:** `PATCH /api/auth/profile`

**Auth Required:** Yes

**All Editable Fields:**
- `fullName` - Full name
- `email` - Email address
- `phone` - Phone number
- `age` - Age (16-120)
- `profileType` - "individual" or "company"
- `companyName` - Company name (if profileType is "company")
- `homeAddress` - Home address
- `city` - City
- `country` - Country
- `zipCode` - ZIP code
- `preferredLanguage` - Preferred language
- `emergencyContactName` - Emergency contact name
- `emergencyContactPhone` - Emergency contact phone
- `isSenior` - Senior status (boolean)
- `seniorIdDocument` - Senior ID document path
- **Driver-specific fields** (only if user is driver):
  - `carType` - Car type
  - `carModel` - Car model
  - `carRegistrationNumber` - Registration number
  - `carColor` - Car color
  - `seatCount` - Seat count (1-16)
  - `governmentIdNumber` - Government ID number

**Request Example:**
```json
PATCH /api/auth/profile
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+46701234567",
  "age": 30,
  "city": "Stockholm",
  "country": "Sweden",
  "homeAddress": "Storgatan 1",
  "zipCode": "11122",
  "preferredLanguage": "sv",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+46709876543"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

## 2. Favorite Places

### Get All Favorite Places

**Endpoint:** `GET /api/favorites`

**Auth Required:** Yes

**Response:**
```json
{
  "favorites": [
    {
      "id": 1,
      "userId": 1,
      "name": "Home",
      "address": "Storgatan 1, Stockholm",
      "latitude": 59.3293,
      "longitude": 18.0686,
      "isDefault": true,
      "placeType": "home",
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "userId": 1,
      "name": "Work",
      "address": "Kungsgatan 10, Stockholm",
      "latitude": 59.3346,
      "longitude": 18.0632,
      "isDefault": false,
      "placeType": "work",
      "createdAt": "2024-12-01T10:05:00Z",
      "updatedAt": "2024-12-01T10:05:00Z"
    }
  ]
}
```

### Create Favorite Place

**Endpoint:** `POST /api/favorites`

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Gym",
  "address": "Fitness Center, Drottninggatan 5",
  "latitude": 59.3314,
  "longitude": 18.0625,
  "isDefault": false,
  "placeType": "custom"
}
```

**Required Fields:**
- `name` - Name of the place
- `address` - Full address
- `latitude` - Latitude (-90 to 90)
- `longitude` - Longitude (-180 to 180)

**Optional Fields:**
- `isDefault` - Set as default location (boolean)
- `placeType` - "home", "work", or "custom" (default: "custom")

**Special Rules:**
- Only one "home" place per user
- Only one "work" place per user
- Setting `isDefault: true` unsets other defaults

**Response:**
```json
{
  "message": "Favorite place created",
  "favorite": {
    "id": 3,
    "userId": 1,
    "name": "Gym",
    "address": "Fitness Center, Drottninggatan 5",
    "latitude": 59.3314,
    "longitude": 18.0625,
    "isDefault": false,
    "placeType": "custom",
    "createdAt": "2024-12-01T10:10:00Z",
    "updatedAt": "2024-12-01T10:10:00Z"
  }
}
```

### Update Favorite Place

**Endpoint:** `PUT /api/favorites/:id`

**Auth Required:** Yes

**Request Body:** (same as create, all fields optional)

### Delete Favorite Place

**Endpoint:** `DELETE /api/favorites/:id`

**Auth Required:** Yes

### Get Single Favorite Place

**Endpoint:** `GET /api/favorites/:id`

**Auth Required:** Yes

## Using Favorite Places for Quick Ride Booking

When a user selects a favorite place, the mobile app can use it to pre-fill trip request:

```javascript
// User selects "Home" favorite place
const favorite = {
  address: "Storgatan 1, Stockholm",
  latitude: 59.3293,
  longitude: 18.0686
};

// Use current location as pickup, favorite as dropoff
POST /api/trips/request
{
  "pickupLocation": "Current Location",
  "pickupLat": currentLat,
  "pickupLng": currentLng,
  "dropoffLocation": favorite.address,
  "dropoffLat": favorite.latitude,
  "dropoffLng": favorite.longitude,
  ...
}
```

## 3. Advertisements

### Get Active Advertisements (User)

**Endpoint:** `GET /api/advertisements`

**Auth Required:** Yes

**Response:**
```json
{
  "advertisements": [
    {
      "id": 1,
      "name": "Special Offer",
      "image": "https://example.com/ad1.jpg",
      "link": "https://example.com/promo",
      "isActive": true,
      "displayOrder": 0,
      "targetAudience": "all",
      "clickCount": 42,
      "createdAt": "2024-12-01T09:00:00Z"
    }
  ]
}
```

**Features:**
- Only returns active advertisements
- Filters by user role (riders see rider ads, drivers see driver ads, etc.)
- Respects startDate and endDate
- Ordered by displayOrder

### Track Advertisement Click

**Endpoint:** `POST /api/advertisements/:id/click`

**Auth Required:** Yes

**Response:**
```json
{
  "message": "Click tracked",
  "advertisement": {
    "id": 1,
    "link": "https://example.com/promo"
  }
}
```

**Usage:** Call this when user clicks an ad, then redirect to `link`

### Admin: Get All Advertisements

**Endpoint:** `GET /api/admin/advertisements`

**Auth Required:** Admin only

### Admin: Create Advertisement

**Endpoint:** `POST /api/admin/advertisements`

**Auth Required:** Admin only

**Request Body:**
```json
{
  "name": "Summer Sale",
  "image": "https://example.com/summer-sale.jpg",
  "link": "https://example.com/summer-sale",
  "isActive": true,
  "displayOrder": 1,
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "targetAudience": "all"
}
```

**Fields:**
- `name` - Advertisement name/title (required)
- `image` - URL to image (required)
- `link` - URL to redirect (required)
- `isActive` - Active status (default: true)
- `displayOrder` - Display order, lower = first (default: 0)
- `startDate` - When to start showing (optional)
- `endDate` - When to stop showing (optional)
- `targetAudience` - "all", "riders", "drivers", or "owners" (default: "all")

### Admin: Update Advertisement

**Endpoint:** `PUT /api/admin/advertisements/:id`

**Auth Required:** Admin only

### Admin: Delete Advertisement

**Endpoint:** `DELETE /api/admin/advertisements/:id`

**Auth Required:** Admin only

## Mobile App Integration

### Profile Editing Flow

1. User opens profile screen
2. App fetches current profile: `GET /api/auth/profile`
3. User edits fields
4. App sends update: `PATCH /api/auth/profile`
5. App refreshes profile data

### Favorite Places Flow

1. User opens "Saved Places" screen
2. App fetches favorites: `GET /api/favorites`
3. User can:
   - Add new favorite (with current location or search)
   - Edit existing favorite
   - Delete favorite
   - Set as default
4. When booking ride, user selects favorite place
5. App pre-fills trip request with favorite location

### Advertisements Flow

1. App fetches ads: `GET /api/advertisements`
2. Display ads in carousel/banner
3. When user clicks ad:
   - Call `POST /api/advertisements/:id/click`
   - Open `link` in browser/webview

## Database Schema

### FavoritePlaces Table
- `id` - Primary key
- `userId` - Foreign key to Users
- `name` - Place name
- `address` - Full address
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `isDefault` - Default location flag
- `placeType` - "home", "work", or "custom"
- `createdAt`, `updatedAt` - Timestamps

### Advertisements Table
- `id` - Primary key
- `name` - Advertisement name
- `image` - Image URL
- `link` - Redirect URL
- `isActive` - Active status
- `displayOrder` - Display order
- `startDate` - Start date (optional)
- `endDate` - End date (optional)
- `clickCount` - Click counter
- `targetAudience` - Target audience
- `createdAt`, `updatedAt` - Timestamps

## Testing

### Test Profile Update
```bash
curl -X PATCH http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "city": "Gothenburg"
  }'
```

### Test Favorite Places
```bash
# Create favorite
curl -X POST http://localhost:3001/api/favorites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home",
    "address": "Storgatan 1",
    "latitude": 59.3293,
    "longitude": 18.0686,
    "placeType": "home"
  }'
```

### Test Advertisements
```bash
# Get ads
curl http://localhost:3001/api/advertisements \
  -H "Authorization: Bearer TOKEN"

# Track click
curl -X POST http://localhost:3001/api/advertisements/1/click \
  -H "Authorization: Bearer TOKEN"
```

## Notes

- Profile updates respect role-based phone/email sharing rules
- Favorite places are user-specific (deleted when user is deleted)
- Advertisements support date-based scheduling
- Click tracking helps measure ad performance
- Target audience filtering ensures relevant ads shown

