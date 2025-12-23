# Profit Calculation System - Implementation Roadmap

## Overview
This document outlines what needs to be implemented to enable profit calculation for drivers and owners in the backend system.

## Current State

### ✅ What Exists
- **Revenue Tracking**: Total fare per trip is tracked in the `Trip` model
- **Driver Income Summary**: `buildDriverIncomeSummary()` function calculates total fare for drivers
- **Vehicle Revenue**: Owners can see total revenue per vehicle via `getVehicleSummary()`
- **Payment Tracking**: Payments are recorded with amounts in the `Payment` model
- **Relationships**: Driver-Vehicle-Owner relationships are established via `DriverVehicleAssignment` and `Vehicle.ownerId`

### ❌ What's Missing

## 1. Commission/Split Configuration

**Current State**: No commission rates or split percentages are configured.

**What's Needed**:
- Configuration system for commission rates:
  - Driver commission percentage (e.g., 70%)
  - Owner commission percentage (e.g., 20%)
  - Platform commission percentage (e.g., 10%)
- Support for different commission models:
  - Fixed percentage split
  - Tiered commission (based on revenue thresholds)
  - Per-vehicle or per-driver custom rates
- Environment variables or database configuration for commission rates

**Implementation Options**:
- Add to `config/constants.js` as environment variables
- Create a `CommissionRate` model for flexible configuration
- Store in `DriverVehicleAssignment` for per-assignment rates

## 2. Profit Calculation Logic

**Current State**: Only gross revenue (total fare) is calculated. No profit breakdown exists.

**What's Needed**:
- Service/utility function to calculate profit breakdown per trip:
  ```javascript
  calculateProfitBreakdown(tripFare, driverId, vehicleId) {
    // Returns:
    // - driverProfit
    // - ownerProfit  
    // - platformCommission
    // - totalFare
  }
  ```
- Logic to determine commission rates based on:
  - Driver-vehicle assignment
  - Vehicle owner
  - Default platform rates
- Handle edge cases:
  - Driver owns the vehicle (owner_driver role)
  - Multiple owners
  - Special commission agreements

## 3. Database Schema Updates

**Current State**: No profit-related fields exist in Payment or Trip models.

**What's Needed**:

### Payment Model Updates
Add fields to track profit breakdown:
- `driverProfit` (FLOAT) - Amount driver receives
- `ownerProfit` (FLOAT) - Amount owner receives
- `platformCommission` (FLOAT) - Platform fee
- `driverCommissionRate` (FLOAT) - Percentage used for driver
- `ownerCommissionRate` (FLOAT) - Percentage used for owner

### Trip Model Updates (Optional)
Consider adding profit fields to Trip for faster reporting:
- `driverProfit` (FLOAT)
- `ownerProfit` (FLOAT)
- `platformCommission` (FLOAT)

### New Models (Optional)
- `CommissionRate` model for flexible rate management
- `ProfitSummary` model for aggregated profit data

## 4. Payment Creation Updates

**Current State**: `createPayment()` only records the total fare amount.

**What's Needed**:
- Update `createPayment()` in `paymentController.js` to:
  1. Calculate profit breakdown when payment is created
  2. Store driver profit, owner profit, and platform commission
  3. Store commission rates used for audit trail
- Ensure profit calculation happens at payment time (not trip creation) to handle:
  - Cancellations
  - Refunds
  - Payment method differences

## 5. Profit Reporting Endpoints

**Current State**: 
- `/trips/driver/income` shows total fare (revenue), not profit
- Vehicle summary shows total revenue, not profit breakdown

**What's Needed**:

### Driver Profit Endpoints
- `GET /trips/driver/profit` - Driver's profit summary
  - Total profit (not revenue)
  - Profit breakdown by period (day/month)
  - Comparison to revenue
- `GET /trips/driver/:driverId/profit` - Admin view of driver profit

### Owner Profit Endpoints
- `GET /vehicles/profit` - Owner's profit from all vehicles
- `GET /vehicles/:vehicleId/profit` - Profit from specific vehicle
  - Profit breakdown by driver
  - Total owner profit vs total revenue
  - Commission rates applied

### Platform Profit Endpoints (Admin)
- `GET /admin/profit` - Platform-wide profit summary
- `GET /admin/profit/drivers` - Profit breakdown by driver
- `GET /admin/profit/owners` - Profit breakdown by owner

## 6. Migration Script

**What's Needed**:
- Database migration to add profit fields to Payment model
- Migration to backfill profit data for existing payments (if needed)
- Indexes on profit fields for efficient reporting queries

## Implementation Priority

### Phase 1: Foundation (Critical)
1. ✅ Commission configuration system
2. ✅ Profit calculation service/utility
3. ✅ Database schema updates
4. ✅ Update payment creation to calculate profit

### Phase 2: Reporting (High Priority)
5. ✅ Driver profit endpoints
6. ✅ Owner profit endpoints
7. ✅ Update existing income endpoints to show profit

### Phase 3: Advanced Features (Nice to Have)
8. ⬜ Platform profit endpoints
9. ⬜ Profit analytics and insights
10. ⬜ Commission rate management UI/API
11. ⬜ Profit export/reporting features

## Example Implementation Structure

```
utils/
  calculateProfit.js          # Profit calculation logic
  commissionConfig.js          # Commission rate configuration

models/
  Payment.js                   # Updated with profit fields
  CommissionRate.js            # Optional: Flexible commission model

controllers/
  profitController.js          # New: Profit reporting endpoints
  paymentController.js         # Updated: Calculate profit on payment creation

routes/
  profitRoutes.js             # New: Profit reporting routes
```

## Configuration Example

```javascript
// config/constants.js or config/commission.js
module.exports = {
  commission: {
    default: {
      driver: 0.70,    // 70%
      owner: 0.20,      // 20%
      platform: 0.10    // 10%
    },
    ownerDriver: {
      // When driver owns vehicle
      driver: 0.90,     // 90%
      platform: 0.10   // 10%
    }
  }
};
```

## Testing Considerations

- Unit tests for profit calculation logic
- Edge cases: owner_driver, refunds, cancellations
- Integration tests for profit reporting endpoints
- Data migration tests for backfilling profit data

## Notes

- Profit should be calculated at payment time, not trip creation time
- Consider handling refunds and how they affect profit calculations
- Audit trail: Store commission rates used for each payment
- Performance: Consider caching profit summaries for reporting

