# Admin Guest Trip Creation - Implementation Guide

## Overview

Admins can now create trips for:
1. **Guest riders** - People without user accounts (can't operate a phone)
2. **Existing users** - Registered users who need admin assistance

This solves the problem of serving individuals who cannot use the mobile app.

## Database Migration

Run the migration script first:

```bash
mysql -u your_user -p your_database < database_guest_rider_migration.sql
```

Or run manually:
```sql
ALTER TABLE Trips 
MODIFY COLUMN riderId INT NULL;

ALTER TABLE Trips 
ADD COLUMN guestRider JSON NULL AFTER riderId,
ADD COLUMN createdByAdmin INT NULL AFTER guestRider;

ALTER TABLE Trips 
ADD CONSTRAINT fk_trips_created_by_admin 
FOREIGN KEY (createdByAdmin) REFERENCES Users(id) ON DELETE SET NULL;
```

## API Endpoints

### 1. Create Trip for Guest Rider (No Account)

**Endpoint:** `POST /api/admin/trips/create-guest`

**Auth Required:** Admin only

**Request Body:**
```json
{
  "guestName": "John Doe",
  "guestPhone": "+46701234567",
  "guestEmail": "john@example.com",  // Optional
  "pickupLocation": "Stockholm Central Station",
  "dropoffLocation": "Arlanda Airport",
  "pickupLat": 59.3293,
  "pickupLng": 18.0686,
  "dropoffLat": 59.6519,
  "dropoffLng": 17.9186,
  "distanceKm": 40.5,
  "durationMin": 45,
  "rideMode": "immediate",  // or "scheduled", "senior_assist"
  "scheduledAt": "2024-12-15T14:00:00Z",  // Required if scheduled
  "vehicleTier": "comfort",  // Optional: "economy", "comfort", "suv"
  "passengerCount": 2,
  "includePets": false,
  "riderNotes": "Pick up at main entrance",
  "seniorAssist": {  // Optional, for senior_assist mode
    "doorToDoor": true,
    "mobilityHelp": false,
    "contactName": "Caretaker",
    "contactPhone": "+46701234568"
  },
  "driverId": 5,  // Optional: assign specific driver
  "vehicleId": 10  // Optional: assign specific vehicle
}
```

**Required Fields:**
- `guestName` - Guest rider's name
- `guestPhone` - Guest rider's phone number
- `pickupLocation` - Pickup address
- `dropoffLocation` - Dropoff address
- `pickupLat`, `pickupLng` - Pickup coordinates
- `dropoffLat`, `dropoffLng` - Dropoff coordinates

**Response (201):**
```json
{
  "message": "Guest trip created successfully",
  "trip": {
    "id": 123,
    "status": "requested",
    "fare": 850.00,
    "distance": 40.5,
    "durationMinutes": 45,
    "guestRider": {
      "name": "John Doe",
      "phone": "+46701234567",
      "email": "john@example.com"
    },
    "pickupLocation": "Stockholm Central Station",
    "dropoffLocation": "Arlanda Airport",
    "scheduledAt": null,
    "createdAt": "2024-12-01T10:30:00Z"
  },
  "nearbyDrivers": 5
}
```

### 2. Create Trip for Existing User

**Endpoint:** `POST /api/admin/trips/create-for-user`

**Auth Required:** Admin only

**Request Body:**
```json
{
  "riderId": 42,  // User ID
  "pickupLocation": "Stockholm Central Station",
  "dropoffLocation": "Arlanda Airport",
  "pickupLat": 59.3293,
  "pickupLng": 18.0686,
  "dropoffLat": 59.6519,
  "dropoffLng": 17.9186,
  "distanceKm": 40.5,
  "durationMin": 45,
  "rideMode": "immediate",
  "vehicleTier": "comfort",
  "passengerCount": 2,
  "includePets": false,
  "riderNotes": "Created by admin",
  "driverId": 5,  // Optional
  "vehicleId": 10  // Optional
}
```

**Required Fields:**
- `riderId` - User ID of existing rider
- Same trip details as guest trip

**Response (201):**
```json
{
  "message": "Trip created successfully for user",
  "trip": {
    "id": 124,
    "status": "requested",
    "fare": 850.00,
    "distance": 40.5,
    "durationMinutes": 45,
    "rider": {
      "id": 42,
      "name": "Jane Rider",
      "phone": "+46709876543"
    },
    "pickupLocation": "Stockholm Central Station",
    "dropoffLocation": "Arlanda Airport",
    "createdAt": "2024-12-01T10:30:00Z"
  },
  "nearbyDrivers": 5
}
```

## Features

### Guest Rider Support
- ✅ No user account required
- ✅ Stores guest name, phone, and optional email
- ✅ Tracks which admin created the trip
- ✅ Works with all ride modes (immediate, scheduled, senior_assist)

### Trip Assignment
- ✅ Can assign specific driver (optional)
- ✅ Can assign specific vehicle (optional)
- ✅ Auto-finds nearby drivers if not assigned
- ✅ Sends push notifications to nearby drivers

### Ride Modes
- **immediate** - Request now, find driver immediately
- **scheduled** - Book for future time
- **senior_assist** - Elderly assistance mode with special help

### Vehicle Tiers
- **economy** - Basic vehicles
- **comfort** - Premium vehicles (+10% fare)
- **suv** - Large vehicles (+20% fare)

## Use Cases

### Case 1: Elderly Person Without Phone
```
Admin creates trip with:
- guestName: "Erik Andersson"
- guestPhone: "+46701234567" (caretaker's phone)
- rideMode: "senior_assist"
- seniorAssist: { doorToDoor: true, mobilityHelp: true }
```

### Case 2: Person Calling Support
```
Admin creates trip with:
- guestName: "Maria Svensson"
- guestPhone: "+46709876543"
- rideMode: "immediate"
- riderNotes: "Called support, needs ride to hospital"
```

### Case 3: Scheduled Ride for Non-User
```
Admin creates trip with:
- guestName: "Lars Johansson"
- guestPhone: "+46701111111"
- rideMode: "scheduled"
- scheduledAt: "2024-12-15T14:00:00Z"
```

## Trip Lifecycle

1. **Created** - Admin creates trip (status: "requested" or "scheduled")
2. **Driver Assignment** - Auto-assigned or driver accepts
3. **Accepted** - Driver accepts trip
4. **In Progress** - Driver starts trip
5. **Completed** - Trip finished
6. **Payment** - Payment created (can be cash or card)

## Payment Handling

For guest riders:
- Payment can be created normally
- Guest rider info is stored in trip
- Payment can reference trip ID
- Cash payments work normally
- Card payments may need special handling (no Stripe customer)

## Database Schema Changes

### Trip Model Updates
- `riderId` - Now nullable (null for guest riders)
- `guestRider` - JSON field with guest info
- `createdByAdmin` - Admin user ID who created trip

### Example Guest Rider Data
```json
{
  "guestRider": {
    "name": "John Doe",
    "phone": "+46701234567",
    "email": "john@example.com"
  },
  "createdByAdmin": 1,
  "riderId": null
}
```

## Security

- ✅ Admin-only endpoints (protected by `requireAdmin` middleware)
- ✅ Validates all input data
- ✅ Transaction-safe (rolls back on error)
- ✅ Tracks which admin created trip (audit trail)

## Testing

1. **Test Guest Trip Creation:**
```bash
curl -X POST http://localhost:3001/api/admin/trips/create-guest \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Test Guest",
    "guestPhone": "+46701234567",
    "pickupLocation": "Test Pickup",
    "dropoffLocation": "Test Dropoff",
    "pickupLat": 59.3293,
    "pickupLng": 18.0686,
    "dropoffLat": 59.6519,
    "dropoffLng": 17.9186
  }'
```

2. **Test User Trip Creation:**
```bash
curl -X POST http://localhost:3001/api/admin/trips/create-for-user \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "riderId": 1,
    "pickupLocation": "Test Pickup",
    "dropoffLocation": "Test Dropoff",
    "pickupLat": 59.3293,
    "pickupLng": 18.0686,
    "dropoffLat": 59.6519,
    "dropoffLng": 17.9186
  }'
```

## Notes

- Guest riders cannot login or track trips themselves
- Admin dashboard should show guest rider trips
- Consider adding guest rider search/filter in admin dashboard
- Payment for guest trips works normally
- Guest rider info is stored in trip for reference

