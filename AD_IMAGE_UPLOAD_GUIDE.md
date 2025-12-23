# Advertisement Image Upload Guide

## Overview

Advertisement images can now be uploaded directly to the server. The system supports both:

1. **File Upload** - Upload image files directly (multipart/form-data)
2. **URL** - Provide image URL (application/json)

## Installation

Install multer (if not already installed):

```bash
npm install multer
```

## File Storage

- Images are saved to: `uploads/advertisements/`
- Directory is created automatically if it doesn't exist
- Files are named: `{sanitized-name}-{timestamp}-{random}.{ext}`
- Maximum file size: 5MB
- Allowed formats: JPEG, JPG, PNG, GIF, WebP

## API Usage

### Create Advertisement with File Upload

**Endpoint:** `POST /api/admin/advertisements`

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `image` (file) - Image file to upload
- `name` (string) - Advertisement name
- `link` (string) - Redirect URL
- `isActive` (boolean, optional) - Active status (default: true)
- `displayOrder` (number, optional) - Display order (default: 0)
- `startDate` (string, optional) - Start date (ISO format)
- `endDate` (string, optional) - End date (ISO format)
- `targetAudience` (string, optional) - "all", "riders", "drivers", "owners" (default: "all")

**Example (cURL):**

```bash
curl -X POST http://localhost:3001/api/admin/advertisements \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "name=Summer Sale" \
  -F "link=https://example.com/sale" \
  -F "targetAudience=all"
```

**Example (JavaScript/Fetch):**

```javascript
const formData = new FormData();
formData.append("image", fileInput.files[0]);
formData.append("name", "Summer Sale");
formData.append("link", "https://example.com/sale");
formData.append("targetAudience", "all");

fetch("http://localhost:3001/api/admin/advertisements", {
  method: "POST",
  headers: {
    Authorization: "Bearer ADMIN_TOKEN",
  },
  body: formData,
});
```

### Create Advertisement with URL

**Endpoint:** `POST /api/admin/advertisements`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "name": "Summer Sale",
  "image": "https://example.com/ad.jpg",
  "link": "https://example.com/sale",
  "targetAudience": "all"
}
```

### Update Advertisement with File Upload

**Endpoint:** `PUT /api/admin/advertisements/:id`

**Content-Type:** `multipart/form-data`

**Form Fields:** Same as create, all optional

**Note:** If you upload a new file, the old file (if it was a local upload) will be automatically deleted.

### Update Advertisement with URL

**Endpoint:** `PUT /api/admin/advertisements/:id`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "image": "https://example.com/new-ad.jpg",
  "name": "Updated Name"
}
```

## Image URLs

### Local Uploads

When an image is uploaded, it's stored locally and the URL format is:

```
http://localhost:3001/uploads/advertisements/filename.jpg
```

The system automatically converts local paths to full URLs when returning advertisement data.

### External URLs

You can still use external URLs (http:// or https://). These are stored as-is and returned as-is.

## Configuration

### Base URL

Set `BASE_URL` environment variable to configure the base URL for local uploads:

```env
BASE_URL=https://yourdomain.com
```

If not set, defaults to `http://localhost:${PORT}`

### File Size Limit

Current limit: 5MB (hardcoded in `uploadMiddleware.js`)

To change, modify:

```javascript
limits: {
  fileSize: 5 * 1024 * 1024, // 5MB
}
```

## Error Handling

### File Too Large

```json
{
  "message": "File too large. Maximum size is 5MB."
}
```

### Invalid File Type

```json
{
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

### Missing File Field

```json
{
  "message": "Unexpected file field. Expected field name: 'image'"
}
```

## File Cleanup

- When an advertisement is deleted, associated local image files are automatically deleted
- When an advertisement image is updated, old local files are automatically deleted
- External URLs are not affected

## Static File Serving

The server automatically serves uploaded files from `/uploads` directory:

```
GET /uploads/advertisements/filename.jpg
```

Make sure the `uploads/` directory is accessible and not blocked by your web server configuration.

## Security Notes

1. **File Validation**: Only image files (JPEG, PNG, GIF, WebP) are allowed
2. **File Size**: Limited to 5MB to prevent abuse
3. **Filename Sanitization**: Original filenames are sanitized to prevent path traversal
4. **Unique Filenames**: Timestamp + random number prevents filename conflicts
5. **Admin Only**: Only admins can upload images

## Mobile App Integration

### Upload Image from Mobile

```dart
// Flutter example
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> uploadAdImage(File imageFile) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('https://your-api.com/api/admin/advertisements'),
  );

  request.headers['Authorization'] = 'Bearer $adminToken';
  request.files.add(
    await http.MultipartFile.fromPath('image', imageFile.path),
  );
  request.fields['name'] = 'Ad Name';
  request.fields['link'] = 'https://example.com';

  var response = await request.send();
}
```

## Testing

### Test File Upload

```bash
# Create test image
echo "test" > test.jpg

# Upload
curl -X POST http://localhost:3001/api/admin/advertisements \
  -H "Authorization: Bearer TOKEN" \
  -F "image=@test.jpg" \
  -F "name=Test Ad" \
  -F "link=https://example.com"
```

### Test URL Upload

```bash
curl -X POST http://localhost:3001/api/admin/advertisements \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ad",
    "image": "https://example.com/image.jpg",
    "link": "https://example.com"
  }'
```

## Troubleshooting

### Images Not Displaying

1. Check if `BASE_URL` is set correctly
2. Verify `/uploads` directory is accessible
3. Check file permissions on `uploads/advertisements/`
4. Verify CORS settings allow image requests

### Upload Fails

1. Check file size (must be < 5MB)
2. Verify file format (JPEG, PNG, GIF, WebP only)
3. Check server disk space
4. Verify `uploads/advertisements/` directory exists and is writable
