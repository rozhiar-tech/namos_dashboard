# Token Expiration Configuration

## Frontend Changes Made

The frontend now handles token expiration gracefully:

1. **Automatic Token Cleanup**: When a 401 (Unauthorized) error is received, the frontend automatically:
   - Clears the stored token from localStorage
   - Redirects to the login page
   - Shows a message indicating the session expired

2. **Improved Error Handling**: The `apiRequest` function now detects 401 responses and handles them appropriately without showing generic "invalid token" errors.

3. **Better User Experience**: When redirected to login due to expired session, users see a clear message explaining they need to sign in again.

## Backend Token Expiration

**Important**: The actual token expiration time is controlled by your backend JWT configuration. The frontend cannot extend token expiration times.

To extend token expiration on your backend, you need to modify the JWT token generation in your backend code. Typically this is done when signing the token:

```javascript
// Example (adjust based on your backend framework)
jwt.sign(
  payload,
  secret,
  { expiresIn: '24h' } // or '7d', '30d', etc.
);
```

Common expiration options:
- `'1h'` - 1 hour
- `'24h'` - 24 hours (1 day)
- `'7d'` - 7 days
- `'30d'` - 30 days

## Current Behavior

- Tokens are stored in localStorage and persist across browser sessions
- When a token expires, users are automatically redirected to login
- The frontend gracefully handles expired tokens without showing errors

## Recommendation

For admin dashboards, a longer token expiration (e.g., 7-30 days) is often appropriate since admins need persistent access. Consider configuring your backend to use a longer expiration time for admin tokens.

