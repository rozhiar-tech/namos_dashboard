# Namos Taxi Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://your-server:3001/api`  
**Last Updated:** December 2024

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Auth](#auth-endpoints)
   - [Trips](#trip-endpoints)
   - [Driver Location](#driver-location-endpoints)
   - [Payments](#payment-endpoints)
   - [Vehicles](#vehicle-endpoints)
   - [Reviews](#review-endpoints)
   - [Push Notifications](#push-notification-endpoints)
   - [Monitoring](#monitoring-endpoints)
   - [Admin](#admin-endpoints)
6. [WebSocket Events](#websocket-events)
7. [Data Models](#data-models)
8. [Flutter Integration Guide](#flutter-integration-guide)

---

## Overview

The Namos Taxi Backend provides RESTful APIs and real-time WebSocket communication for a taxi/ride-hailing application. It supports:

- **Riders**: Request trips, track drivers, manage payments
- **Drivers**: Accept/manage trips, update location, manage availability
- **Owners**: Manage vehicles and drivers
- **Admins**: Full system management

### Key Features

- Real-time driver tracking via WebSocket
- Scheduled ride support
- Senior assist and on-behalf ride modes
- Swedish tariff-based fare calculation
- Stripe payment integration
- Push notifications via Firebase
- Automatic trip timeout and driver reassignment

---

## Authentication

All protected endpoints require a JWT token in the Authorization header.

```
Authorization: Bearer <jwt_token>
```

### Token Structure

```json
{
  "id": 123,
  "role": "rider|driver|owner|owner_driver|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiry:** 7 days (configurable via `JWT_EXPIRY` env var)

### User Roles

| Role           | Description                        |
| -------------- | ---------------------------------- |
| `rider`        | Regular user who can request rides |
| `driver`       | Can accept and complete rides      |
| `owner`        | Vehicle fleet owner                |
| `owner_driver` | Owner who also drives              |
| `admin`        | Full system access                 |

---

## Error Handling

All errors follow this format:

```json
{
  "message": "Error description",
  "code": "error_code",
  "details": {}
}
```

### Common HTTP Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad Request - Invalid input          |
| 401  | Unauthorized - Invalid/missing token |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found                            |
| 409  | Conflict - Resource state conflict   |
| 429  | Too Many Requests - Rate limited     |
| 500  | Internal Server Error                |

---

## Rate Limiting

Rate limits are applied per IP address:

| Endpoint Type | Limit        | Window     |
| ------------- | ------------ | ---------- |
| Login         | 5 attempts   | 15 minutes |
| Registration  | 3 attempts   | 1 hour     |
| General API   | 100 requests | 1 minute   |
| Trip Request  | 5 requests   | 1 minute   |

Rate limit headers included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701234567
```

---

## API Endpoints

### Auth Endpoints

#### Register User (Rider)

```
POST /auth/register
```

**Rate Limited:** Yes (3/hour)

**Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+46701234567",
  "password": "SecurePass123!",
  "age": 25,
  "profileType": "individual",
  "companyName": "Company AB",
  "homeAddress": "Storgatan 1",
  "city": "Stockholm",
  "country": "Sweden",
  "preferredLanguage": "sv",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+46701234568",
  "isSenior": false
}
```

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (201):**

```json
{
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+46701234567",
    "role": "rider"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### Register Driver

```
POST /auth/register-driver
```

**Rate Limited:** Yes (3/hour)

**Additional Required Fields:**

```json
{
  "governmentIdNumber": "19900101-1234",
  "homeAddress": "Storgatan 1",
  "zipCode": "11122",
  "vehicleId": 5
}
```

---

#### Login (Rider)

```
POST /auth/login
```

**Rate Limited:** Yes (5/15min)

**Body:**

```json
{
  "phone": "+46701234567",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### Login (Driver)

```
POST /auth/login-driver
```

**Rate Limited:** Yes (5/15min)

**Body:**

```json
{
  "phone": "+46701234567",
  "password": "SecurePass123!",
  "vehicleId": 5
}
```

**Response (200):**

```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "session": {
    "id": 1,
    "vehicleId": 5,
    "vehicle": { ... },
    "status": "active"
  },
  "vehicles": [ ... ],
  "needsVehicleSelection": false
}
```

---

#### Get Profile

```
GET /auth/profile
```

**Auth Required:** Yes

**Response:**

```json
{
  "user": { ... },
  "canRide": true,
  "canDrive": true,
  "vehicles": [ ... ],
  "activeSession": { ... },
  "isAvailable": false
}
```

---

#### Update Profile

```
PATCH /auth/profile
```

**Auth Required:** Yes

**Body:**

```json
{
  "fullName": "New Name",
  "email": "newemail@example.com",
  "homeAddress": "New Address",
  "city": "Gothenburg"
}
```

---

#### Change Password

```
POST /auth/change-password
```

**Auth Required:** Yes

**Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

---

#### Upgrade Rider to Driver

```
POST /auth/upgrade-to-driver
```

**Auth Required:** Yes (rider only)

This solves the dual-account problem - a rider can upgrade to driver while keeping the same phone number and account.

**Body:**

```json
{
  "governmentIdNumber": "19900101-1234",
  "homeAddress": "Storgatan 1",
  "zipCode": "11122",
  "vehicleId": 5,
  "carType": "Sedan",
  "carModel": "Volvo S60",
  "carColor": "Black"
}
```

**Response (200):**

```json
{
  "message": "Account upgraded to driver successfully",
  "user": { ... },
  "token": "new_token_with_driver_role",
  "assignment": { ... },
  "note": "You can now use the driver app with this account."
}
```

---

#### Delete Account

```
DELETE /auth/account
```

**Auth Required:** Yes

---

### Trip Endpoints

#### Request Trip (Rider)

```
POST /trips/request
```

**Auth Required:** Yes

**Body:**

```json
{
  "pickupLocation": "Stockholm Central",
  "dropoffLocation": "Arlanda Airport",
  "pickupLat": 59.3293,
  "pickupLng": 18.0686,
  "dropoffLat": 59.6519,
  "dropoffLng": 17.9186,
  "distanceKm": 40.5,
  "durationMin": 45,
  "rideMode": "immediate",
  "scheduledAt": "2024-12-15T14:00:00Z",
  "vehicleTier": "comfort",
  "passengerCount": 2,
  "includePets": false,
  "riderNotes": "Pick up at main entrance",
  "largeVehicle": false,
  "onBehalfOf": {
    "name": "Jane Doe",
    "phone": "+46701234568"
  },
  "seniorAssist": {
    "doorToDoor": true,
    "mobilityHelp": false,
    "contactName": "Caretaker",
    "contactPhone": "+46701234569"
  }
}
```

**Ride Modes:**

- `immediate` - Request now (requires riderNotes)
- `scheduled` - Book for later (requires scheduledAt)
- `senior_assist` - Elderly assistance mode
- `on_behalf` - Booking for someone else

**Vehicle Tiers:**

- `economy` - Basic vehicles
- `comfort` - Premium vehicles (+10% fare)
- `suv` - Large vehicles (+20% fare)

**Response (201):**

```json
{
  "trip": {
    "id": 123,
    "status": "requested",
    "fare": 850.0,
    "distance": 40.5,
    "durationMinutes": 45,
    "driverId": 5,
    "vehicleType": "comfort",
    "pickupLocation": "Stockholm Central",
    "dropoffLocation": "Arlanda Airport",
    "createdAt": "2024-12-01T10:30:00Z"
  }
}
```

---

#### Accept Trip (Driver)

```
POST /trips/:tripId/accept
```

**Auth Required:** Yes (driver)

**Response (200):**

```json
{
  "ok": true
}
```

**WebSocket Event Emitted:** `trip_accepted`

---

#### Update Trip Status (Driver)

```
PATCH /trips/:tripId/status
```

**Auth Required:** Yes (driver)

**Body:**

```json
{
  "status": "in_progress"
}
```

**Valid Status Transitions:**

- `requested` → `accepted`, `cancelled`
- `scheduled` → `accepted`, `cancelled`
- `accepted` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`

---

#### Cancel Trip

```
PATCH /trips/:tripId/cancel
```

**Auth Required:** Yes (rider, driver, or admin)

**Body:**

```json
{
  "reason": "Change of plans"
}
```

---

#### Get Rider Trip History

```
GET /trips/rider?page=1&limit=20&status=completed
```

**Auth Required:** Yes

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status (optional)

**Response:**

```json
{
  "trips": [ ... ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

#### Get Driver Trip History

```
GET /trips/driver?page=1&limit=20
```

**Auth Required:** Yes (driver)

---

#### Get Driver Income

```
GET /trips/driver/income?from=2024-01-01&to=2024-12-31&groupBy=month
```

**Auth Required:** Yes (driver)

**Query Parameters:**

- `from` - Start date (ISO format)
- `to` - End date (ISO format)
- `groupBy` - `day` or `month`

**Response:**

```json
{
  "driver": { "id": 5, "name": "Driver Name" },
  "currency": "SEK",
  "range": { "from": "...", "to": "..." },
  "totals": {
    "trips": 150,
    "fare": 45000.0,
    "averageFare": 300.0,
    "distanceKm": 2500.5,
    "durationMin": 3000
  },
  "breakdown": [{ "period": "2024-01", "trips": 25, "fare": 7500.0 }]
}
```

---

### Driver Location Endpoints

#### Update Location

```
POST /location/update
```

**Auth Required:** Yes (driver)

**Body:**

```json
{
  "latitude": 59.3293,
  "longitude": 18.0686,
  "tripId": 123
}
```

---

#### Set Availability

```
POST /location/availability
```

**Auth Required:** Yes (driver)

**Body:**

```json
{
  "isAvailable": true
}
```

**Note:** Driver must have an active session (selected vehicle) before going online.

---

#### Toggle Availability

```
POST /location/toggle
```

**Auth Required:** Yes (driver)

---

#### Get Nearby Drivers

```
GET /location/nearby?latitude=59.3293&longitude=18.0686
```

**Auth Required:** Yes

**Response:**

```json
{
  "drivers": [
    {
      "driverId": 5,
      "latitude": 59.33,
      "longitude": 18.07,
      "isAvailable": true
    }
  ]
}
```

---

### Driver Session Endpoints

#### Get My Vehicles

```
GET /driver/vehicles
```

**Auth Required:** Yes (driver)

**Response:**

```json
{
  "vehicles": [
    {
      "id": 5,
      "label": "My Volvo",
      "plateNumber": "ABC123",
      "assignmentType": "assigned",
      "activeSession": null
    }
  ]
}
```

---

#### Start Session (Select Vehicle)

```
POST /driver/session
```

**Auth Required:** Yes (driver)

**Body:**

```json
{
  "vehicleId": 5
}
```

---

#### End Session

```
DELETE /driver/session
```

**Auth Required:** Yes (driver)

---

#### Get Active Session

```
GET /driver/session
```

**Auth Required:** Yes (driver)

---

### Payment Endpoints

#### Create Payment

```
POST /payments/create
```

**Auth Required:** Yes

**Body:**

```json
{
  "tripId": 123,
  "method": "card"
}
```

**Payment Methods:** `cash`, `card`, `wallet`, `stripe`

---

#### Get Payment by Trip

```
GET /payments/trip/:tripId
```

**Auth Required:** Yes

---

#### Confirm Cash Payment (Driver)

```
POST /payments/trip/:tripId/confirm-cash
```

**Auth Required:** Yes (driver)

---

#### Stripe Payment

```
POST /payments/stripe/create
```

**Auth Required:** Yes

---

### Monitoring Endpoints

#### Health Check (Public)

```
GET /monitoring/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-12-01T10:30:00Z",
  "uptime": 86400
}
```

---

#### Detailed Health Check (Public)

```
GET /monitoring/health/detailed
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 86400,
  "checks": {
    "database": { "status": "ok" },
    "memory": { "status": "ok", "heapUsed": "150MB" }
  }
}
```

---

#### Liveness Probe

```
GET /monitoring/live
```

Returns `200 OK` if server is running.

---

#### Readiness Probe

```
GET /monitoring/ready
```

Returns `200 Ready` if database is connected.

---

#### Realtime Stats (Admin)

```
GET /monitoring/stats
```

**Auth Required:** Yes (admin)

**Response:**

```json
{
  "realtime": {
    "activeTrips": 15,
    "availableDrivers": 8
  },
  "last24Hours": {
    "totalTrips": 250,
    "completedTrips": 230,
    "cancelledTrips": 20,
    "revenue": 75000.0
  },
  "tripsByStatus": {
    "requested": 5,
    "accepted": 3,
    "in_progress": 7
  }
}
```

---

### Admin Endpoints

All admin endpoints require `admin` role.

#### Get Stats

```
GET /admin/stats
```

#### Get All Users

```
GET /admin/users?page=1&limit=50&role=driver
```

#### Get All Trips

```
GET /admin/trips?page=1&limit=50&status=completed
```

#### Create Owner with Vehicles

```
POST /admin/owners
```

**Body:**

```json
{
  "fullName": "Fleet Owner",
  "phone": "+46701234567",
  "email": "owner@company.se",
  "password": "SecurePass123!",
  "age": 35,
  "vehicles": [
    {
      "label": "Car 1",
      "plateNumber": "ABC123",
      "make": "Volvo",
      "model": "XC60"
    }
  ]
}
```

#### Create Driver with Assignment

```
POST /admin/drivers
```

#### Promote Owner to Driver

```
POST /admin/drivers/promote
```

**Body:**

```json
{
  "ownerId": 10,
  "vehicleId": 5
}
```

---

## WebSocket Events

### Connection

Connect with JWT token:

```javascript
const socket = io("http://server:3001", {
  auth: { token: "jwt_token" },
});
```

### Client Events (Emit)

#### Join Trip Room

```javascript
socket.emit("join_trip", { tripId: 123 }, (response) => {
  console.log(response); // { ok: true, room: "trip_123" }
});
```

#### Leave Trip Room

```javascript
socket.emit("leave_trip", { tripId: 123 });
```

#### Driver Location Update (Driver App)

```javascript
// Driver broadcasts their location
socket.emit("driver_location", {
  lat: 59.3293,
  lng: 18.0686,
  tripId: 123, // Optional: if on a specific trip
  isAvailable: true, // Optional: availability status
});
```

#### Subscribe to Nearby Drivers (Rider App) ⭐ NEW

```javascript
// Rider subscribes to see nearby drivers on the map
socket.emit(
  "subscribe_nearby_drivers",
  {
    lat: 59.3293, // Rider's current latitude
    lng: 18.0686, // Rider's current longitude
    radius: 5000, // Optional: radius in meters (default: 5000m = 5km)
  },
  (response) => {
    if (response.ok) {
      // Initial list of nearby drivers
      console.log(response.drivers);
      // [
      //   { driverId: 5, lat: 59.33, lng: 18.07, distance: 450 },
      //   { driverId: 8, lat: 59.32, lng: 18.06, distance: 780 }
      // ]
    }
  }
);
```

#### Update Rider Location (Rider App) ⭐ NEW

```javascript
// Update your location to get fresh nearby drivers
socket.emit(
  "update_rider_location",
  {
    lat: 59.33,
    lng: 18.07,
  },
  (response) => {
    if (response.ok) {
      console.log(response.drivers); // Updated nearby drivers
    }
  }
);
```

#### Unsubscribe from Nearby Drivers (Rider App) ⭐ NEW

```javascript
socket.emit("unsubscribe_nearby_drivers", {}, (response) => {
  console.log(response); // { ok: true }
});
```

### Server Events (Listen)

#### trip_request (Driver)

```javascript
socket.on("trip_request", (data) => {
  // {
  //   tripId: "123",
  //   pickupLocation: "...",
  //   dropoffLocation: "...",
  //   pickupLat: 59.3293,
  //   pickupLng: 18.0686,
  //   estimatedFare: 350.00,
  //   expiresAt: 1701234567890,
  //   currency: "SEK"
  // }
});
```

#### trip_accepted

```javascript
socket.on("trip_accepted", (data) => {
  // {
  //   tripId: 123,
  //   driverId: 5,
  //   driverLocation: { lat: 59.33, lng: 18.07 }
  // }
});
```

#### driverLocationUpdate

```javascript
socket.on("driverLocationUpdate", (data) => {
  // {
  //   tripId: 123,
  //   driverLocation: { lat: 59.33, lng: 18.07 }
  // }
});
```

#### trip_status

```javascript
socket.on("trip_status", (data) => {
  // { tripId: 123, status: "in_progress" }
});
```

#### trip_cancelled

```javascript
socket.on("trip_cancelled", (data) => {
  // {
  //   tripId: 123,
  //   cancelledBy: "rider",
  //   reason: "Change of plans"
  // }
});
```

#### driverAvailabilityChanged

```javascript
socket.on("driverAvailabilityChanged", (data) => {
  // { driverId: 5, isAvailable: true }
});
```

#### nearby_driver_update ⭐ NEW (Rider receives real-time driver positions)

```javascript
socket.on("nearby_driver_update", (data) => {
  // Received when a nearby driver moves or changes availability
  // {
  //   driverId: 5,
  //   lat: 59.3295,
  //   lng: 18.0690,
  //   isAvailable: true,
  //   timestamp: 1701234567890
  // }

  // Update the driver marker on your map
  updateDriverMarker(data.driverId, data.lat, data.lng);
});
```

#### nearby_driver_offline ⭐ NEW (Rider receives when driver goes offline)

```javascript
socket.on("nearby_driver_offline", (data) => {
  // { driverId: 5 }

  // Remove the driver marker from your map
  removeDriverMarker(data.driverId);
});
```

---

## Data Models

### User

```typescript
interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "rider" | "driver" | "owner" | "owner_driver" | "admin";
  age: number;
  profileType: "individual" | "company";
  companyName?: string;
  homeAddress?: string;
  city?: string;
  country?: string;
  preferredLanguage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isSenior: boolean;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Trip

```typescript
interface Trip {
  id: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  status:
    | "requested"
    | "scheduled"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled";
  fare: number;
  distance?: number;
  durationMinutes?: number;
  vehicleType?: string;
  passengerCount?: number;
  allowPets: boolean;
  rideMode: "immediate" | "scheduled" | "senior_assist" | "on_behalf";
  scheduledAt?: string;
  riderNotes?: string;
  cancellationReason?: string;
  riderId: number;
  driverId?: number;
  vehicleId?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  rider?: User;
  driver?: User;
  vehicle?: Vehicle;
}
```

### Vehicle

```typescript
interface Vehicle {
  id: number;
  label: string;
  plateNumber: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vin?: string;
  seatCount?: number;
  ownerId: number;

  // Relations
  owner?: User;
}
```

### Payment

```typescript
interface Payment {
  id: number;
  tripId: number;
  riderId?: number;
  driverId?: number;
  method: "cash" | "card" | "wallet" | "stripe";
  amount: number;
  currency: string;
  status: "pending" | "pending_collection" | "paid" | "refunded" | "failed";
  paidAt?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}
```

---

## Flutter Integration Guide

### Recommended Packages

```yaml
dependencies:
  http: ^1.1.0
  socket_io_client: ^2.0.3
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  geolocator: ^10.1.0
  google_maps_flutter: ^2.5.0
  firebase_messaging: ^14.7.0
```

### Authentication Service Example

```dart
class AuthService {
  static const baseUrl = 'http://your-server:3001/api';

  Future<AuthResponse> login(String phone, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return AuthResponse.fromJson(data);
    } else if (response.statusCode == 429) {
      throw RateLimitException('Too many login attempts');
    }
    throw AuthException(jsonDecode(response.body)['message']);
  }

  Future<void> _saveToken(String token) async {
    final storage = FlutterSecureStorage();
    await storage.write(key: 'jwt_token', value: token);
  }

  Future<String?> getToken() async {
    final storage = FlutterSecureStorage();
    return storage.read(key: 'jwt_token');
  }
}
```

### Socket Service Example

```dart
class SocketService {
  Socket? _socket;

  Future<void> connect() async {
    final token = await AuthService().getToken();

    _socket = io('http://your-server:3001', <String, dynamic>{
      'transports': ['websocket'],
      'auth': {'token': token},
    });

    _socket!.onConnect((_) {
      print('Socket connected');
    });

    _socket!.onError((error) {
      print('Socket error: $error');
    });
  }

  void joinTrip(int tripId) {
    _socket?.emit('join_trip', {'tripId': tripId});
  }

  void onTripAccepted(Function(Map<String, dynamic>) callback) {
    _socket?.on('trip_accepted', (data) => callback(data));
  }

  void onDriverLocation(Function(Map<String, dynamic>) callback) {
    _socket?.on('driverLocationUpdate', (data) => callback(data));
  }

  void sendLocation(int tripId, double lat, double lng) {
    _socket?.emit('driver_location', {
      'tripId': tripId,
      'lat': lat,
      'lng': lng,
    });
  }
}
```

### ⭐ Nearby Drivers Service (Real-time Map) - Flutter Example

```dart
class NearbyDriversService {
  final SocketService _socket;
  final Map<int, DriverLocation> _nearbyDrivers = {};

  // Stream controller to notify UI of changes
  final _driversController = StreamController<Map<int, DriverLocation>>.broadcast();
  Stream<Map<int, DriverLocation>> get driversStream => _driversController.stream;

  NearbyDriversService(this._socket);

  /// Start watching for nearby drivers at rider's location
  Future<void> subscribeToNearbyDrivers(double lat, double lng, {int radius = 5000}) async {
    // Listen for real-time driver updates
    _socket._socket?.on('nearby_driver_update', (data) {
      final driverId = data['driverId'] as int;
      _nearbyDrivers[driverId] = DriverLocation(
        driverId: driverId,
        lat: data['lat'] as double,
        lng: data['lng'] as double,
        isAvailable: data['isAvailable'] as bool,
      );
      _driversController.add(Map.from(_nearbyDrivers));
    });

    // Listen for drivers going offline
    _socket._socket?.on('nearby_driver_offline', (data) {
      final driverId = data['driverId'] as int;
      _nearbyDrivers.remove(driverId);
      _driversController.add(Map.from(_nearbyDrivers));
    });

    // Subscribe and get initial list
    _socket._socket?.emitWithAck('subscribe_nearby_drivers', {
      'lat': lat,
      'lng': lng,
      'radius': radius,
    }, ack: (response) {
      if (response['ok'] == true) {
        final drivers = response['drivers'] as List;
        for (var driver in drivers) {
          _nearbyDrivers[driver['driverId']] = DriverLocation(
            driverId: driver['driverId'],
            lat: driver['lat'],
            lng: driver['lng'],
            isAvailable: true,
          );
        }
        _driversController.add(Map.from(_nearbyDrivers));
      }
    });
  }

  /// Update rider's location to get fresh nearby drivers
  void updateLocation(double lat, double lng) {
    _socket._socket?.emitWithAck('update_rider_location', {
      'lat': lat,
      'lng': lng,
    }, ack: (response) {
      if (response['ok'] == true) {
        // Optionally update the list
        final drivers = response['drivers'] as List?;
        if (drivers != null) {
          _nearbyDrivers.clear();
          for (var driver in drivers) {
            _nearbyDrivers[driver['driverId']] = DriverLocation(
              driverId: driver['driverId'],
              lat: driver['lat'],
              lng: driver['lng'],
              isAvailable: true,
            );
          }
          _driversController.add(Map.from(_nearbyDrivers));
        }
      }
    });
  }

  /// Stop watching for nearby drivers
  void unsubscribe() {
    _socket._socket?.emit('unsubscribe_nearby_drivers', {});
    _nearbyDrivers.clear();
    _driversController.add({});
  }

  void dispose() {
    _driversController.close();
  }
}

class DriverLocation {
  final int driverId;
  final double lat;
  final double lng;
  final bool isAvailable;

  DriverLocation({
    required this.driverId,
    required this.lat,
    required this.lng,
    required this.isAvailable,
  });
}
```

### Using Nearby Drivers in Flutter Widget

```dart
class HomeMapScreen extends StatefulWidget {
  @override
  _HomeMapScreenState createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends State<HomeMapScreen> {
  late NearbyDriversService _nearbyDriversService;
  final Set<Marker> _driverMarkers = {};

  @override
  void initState() {
    super.initState();
    _nearbyDriversService = NearbyDriversService(socketService);
    _setupNearbyDrivers();
  }

  void _setupNearbyDrivers() async {
    // Get rider's current location
    final position = await Geolocator.getCurrentPosition();

    // Subscribe to nearby drivers
    await _nearbyDriversService.subscribeToNearbyDrivers(
      position.latitude,
      position.longitude,
      radius: 5000, // 5km
    );

    // Listen for updates and update map markers
    _nearbyDriversService.driversStream.listen((drivers) {
      setState(() {
        _driverMarkers.clear();
        for (var entry in drivers.entries) {
          _driverMarkers.add(Marker(
            markerId: MarkerId('driver_${entry.key}'),
            position: LatLng(entry.value.lat, entry.value.lng),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
            infoWindow: InfoWindow(title: 'Driver ${entry.key}'),
          ));
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: LatLng(59.3293, 18.0686), // Stockholm
        zoom: 14,
      ),
      markers: _driverMarkers,
    );
  }

  @override
  void dispose() {
    _nearbyDriversService.unsubscribe();
    _nearbyDriversService.dispose();
    super.dispose();
  }
}
```

### API Client Example

```dart
class ApiClient {
  static const baseUrl = 'http://your-server:3001/api';
  final AuthService _auth = AuthService();

  Future<Map<String, String>> _headers() async {
    final token = await _auth.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Trip> requestTrip(TripRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/trips/request'),
      headers: await _headers(),
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 201) {
      return Trip.fromJson(jsonDecode(response.body)['trip']);
    }
    throw ApiException.fromResponse(response);
  }

  Future<List<Trip>> getRiderTrips({int page = 1, int limit = 20}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/trips/rider?page=$page&limit=$limit'),
      headers: await _headers(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['trips'] as List)
          .map((t) => Trip.fromJson(t))
          .toList();
    }
    throw ApiException.fromResponse(response);
  }
}
```

### Location Tracking Example (Driver)

```dart
class DriverLocationService {
  final ApiClient _api = ApiClient();
  final SocketService _socket = SocketService();
  StreamSubscription? _locationSubscription;

  Future<void> startTracking(int tripId) async {
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      await Geolocator.requestPermission();
    }

    _locationSubscription = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      ),
    ).listen((position) {
      // Send via HTTP
      _api.updateLocation(position.latitude, position.longitude, tripId);

      // Also send via Socket for real-time updates
      _socket.sendLocation(tripId, position.latitude, position.longitude);
    });
  }

  void stopTracking() {
    _locationSubscription?.cancel();
  }
}
```

---

## Environment Variables

Create a `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=namos_taxi
DB_USER=root
DB_PASS=password

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=production

# Fare Configuration (SEK)
FARE_START_FEE_DAY=55
FARE_PER_KM_DAY=19
FARE_PER_HOUR_DAY=800
FARE_START_FEE_OFF=55
FARE_PER_KM_OFF=21
FARE_PER_HOUR_OFF=900
FARE_AVG_SPEED=28
FARE_MINIMUM=0

# Trip Settings
TRIP_REQUEST_TIMEOUT_MS=45000
ARRIVAL_THRESHOLD_METERS=300
SCHEDULE_MIN_LEAD_MINUTES=10

# Driver Settings
DRIVER_FRESHNESS_MS=60000
NEARBY_SEARCH_RADIUS=0.05

# Rate Limiting
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_REG_MAX=3
RATE_LIMIT_API_MAX=100

# Scheduler
SCHEDULER_INTERVAL_MS=60000
SCHEDULER_LOOKAHEAD_MINUTES=15
SCHEDULER_MAX_ATTEMPTS=3

# Firebase (for push notifications)
FIREBASE_CREDENTIALS_FILE=/path/to/firebase-credentials.json
# OR
FIREBASE_CREDENTIALS={"type":"service_account",...}

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Support

For questions or issues, contact the backend development team.

**Repository:** https://github.com/rozhiar-tech/namos_backend
