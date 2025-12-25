# File Upload Implementation for Product Images

## Overview

Implemented a complete file upload system for product images with local storage in the `/uploads` directory. Images can be uploaded directly from the admin panel or specified via URL.

## Backend Implementation

### Dependencies

```bash
npm install multer
npm install --save-dev @types/multer
```

### File Structure

```
backend/
├── uploads/                    # Uploaded files directory
├── src/
│   ├── middleware/
│   │   └── upload.middleware.ts   # Multer configuration
│   └── routes/
│       └── upload.routes.ts       # Upload API endpoints
```

### Multer Configuration

**File:** `backend/src/middleware/upload.middleware.ts`

**Features:**
- Disk storage in `uploads/` directory
- Unique filename generation: `originalname-timestamp-random.ext`
- File type validation (JPEG, PNG, GIF, WebP only)
- File size limit: 5MB
- Single and multiple file upload support

**Configuration:**
```typescript
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});
```

### API Endpoints

**File:** `backend/src/routes/upload.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | Admin | Upload single image |
| DELETE | `/api/upload/image/:filename` | Admin | Delete uploaded image |
| GET | `/api/upload/images` | Admin | List all uploaded images |

#### Upload Image

```bash
POST /api/upload/image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  image: <file>
```

Response:
```json
{
  "url": "/uploads/product-1699999999999-123456789.jpg",
  "filename": "product-1699999999999-123456789.jpg",
  "originalName": "product.jpg",
  "size": 245678,
  "mimetype": "image/jpeg"
}
```

#### Delete Image

```bash
DELETE /api/upload/image/:filename
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "message": "File deleted successfully",
  "filename": "product-1699999999999-123456789.jpg"
}
```

#### List Images

```bash
GET /api/upload/images
Authorization: Bearer <admin-token>
```

Response:
```json
[
  {
    "filename": "product-1699999999999-123456789.jpg",
    "url": "/uploads/product-1699999999999-123456789.jpg",
    "size": 245678,
    "createdAt": "2025-11-10T23:00:00.000Z"
  }
]
```

### Static File Serving

**File:** `backend/src/index.ts`

```typescript
// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));
```

Images are accessible at: `http://localhost:3000/uploads/filename.jpg`

### Security Features

1. **Authentication Required** - All upload endpoints require admin authentication
2. **File Type Validation** - Only image files allowed (JPEG, PNG, GIF, WebP)
3. **File Size Limit** - Maximum 5MB per file
4. **Path Traversal Prevention** - Filename validation prevents directory traversal attacks
5. **Unique Filenames** - Prevents filename collisions

## Frontend Implementation

### React Hook

**File:** `frontend/src/hooks/useUpload.ts`

**Hooks:**
- `useUploadImage()` - Upload image mutation
- `useDeleteImage()` - Delete image mutation
- `useUploadedImages()` - Fetch all uploaded images

**Usage:**
```typescript
const uploadImage = useUploadImage();

const handleUpload = async (file: File) => {
  const result = await uploadImage.mutateAsync(file);
  console.log('Uploaded:', result.url);
};
```

### UI Integration

**File:** `frontend/src/pages/admin/ProductsManagement.tsx`

**Features:**
1. **File Upload Button** - Click to select image file
2. **Image Preview** - Shows preview before and after upload
3. **Upload Progress** - Loading indicator during upload
4. **Remove Image** - Delete uploaded image
5. **URL Input** - Alternative option to enter image URL
6. **Validation** - Client-side file type and size validation

**User Flow:**
1. Admin opens product edit/create form
2. Clicks "Upload Image" button
3. Selects image file from computer
4. Image uploads automatically
5. Preview appears with remove button
6. Image URL saved to product on form submit

**Alternative Flow:**
1. Admin enters image URL in text field
2. Preview updates automatically
3. URL saved to product on form submit

## File Storage

### Directory Structure

```
backend/uploads/
├── product-1699999999999-123456789.jpg
├── vegetable-1699999999999-987654321.png
└── fruit-1699999999999-456789123.webp
```

### Filename Format

`{original-name}-{timestamp}-{random-number}.{extension}`

Example: `tomato-1699999999999-123456789.jpg`

### Storage Location

- **Development:** `backend/uploads/`
- **Production:** Configure via environment variable or cloud storage

## Environment Configuration

No additional environment variables required for local storage.

For production, consider:
- Cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
- CDN for image delivery
- Image optimization service

## Error Handling

### Backend Errors

| Error Code | Status | Description |
|------------|--------|-------------|
| INVALID_FILE_TYPE | 400 | File type not allowed |
| FILE_TOO_LARGE | 400 | File exceeds 5MB limit |
| NO_FILE | 400 | No file in request |
| INVALID_FILENAME | 400 | Invalid filename (security) |
| FILE_NOT_FOUND | 404 | File doesn't exist |
| UPLOAD_ERROR | 500 | Upload failed |
| DELETE_ERROR | 500 | Delete failed |

### Frontend Error Handling

```typescript
try {
  const result = await uploadImage.mutateAsync(file);
  setImageUrl(result.url);
} catch (error) {
  alert('Failed to upload image. Please try again.');
}
```

## Testing

### Manual Testing

1. **Upload Image**
   - [ ] Select valid image file (JPEG, PNG, GIF, WebP)
   - [ ] Image uploads successfully
   - [ ] Preview appears
   - [ ] URL saved to product

2. **File Validation**
   - [ ] Non-image file rejected
   - [ ] File > 5MB rejected
   - [ ] Error message displayed

3. **Remove Image**
   - [ ] Click remove button
   - [ ] Preview disappears
   - [ ] URL cleared from form

4. **URL Input**
   - [ ] Enter external image URL
   - [ ] Preview updates
   - [ ] URL saved to product

5. **Static File Access**
   - [ ] Uploaded image accessible at `/uploads/filename.jpg`
   - [ ] Image displays in product card
   - [ ] Image displays in product list

### API Testing

```bash
# Upload image
curl -X POST http://localhost:3000/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"

# List images
curl http://localhost:3000/api/upload/images \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete image
curl -X DELETE http://localhost:3000/api/upload/image/filename.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"

# Access uploaded image
curl http://localhost:3000/uploads/filename.jpg
```

## Production Considerations

### Cloud Storage Migration

For production, migrate to cloud storage:

1. **AWS S3**
   - Use `multer-s3` package
   - Configure S3 bucket and credentials
   - Update upload middleware

2. **Google Cloud Storage**
   - Use `@google-cloud/storage`
   - Configure GCS bucket
   - Update upload middleware

3. **Azure Blob Storage**
   - Use `@azure/storage-blob`
   - Configure container
   - Update upload middleware

### Image Optimization

Consider adding:
- Image resizing (sharp, jimp)
- Format conversion (WebP)
- Thumbnail generation
- Lazy loading
- Progressive loading

### CDN Integration

- CloudFlare
- AWS CloudFront
- Google Cloud CDN
- Azure CDN

### Backup Strategy

- Regular backups of uploads directory
- Sync to cloud storage
- Version control for images

## Maintenance

### Cleanup Old Files

Create a cleanup script to remove unused images:

```typescript
// backend/src/scripts/cleanup-uploads.ts
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

async function cleanupUnusedImages() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir);
  
  // Get all image URLs from database
  const products = await prisma.product.findMany({
    select: { imageUrl: true },
  });
  
  const usedFiles = products
    .map(p => p.imageUrl?.replace('/uploads/', ''))
    .filter(Boolean);
  
  // Delete unused files
  for (const file of files) {
    if (!usedFiles.includes(file)) {
      fs.unlinkSync(path.join(uploadsDir, file));
      console.log(`Deleted unused file: ${file}`);
    }
  }
}
```

### Monitor Storage Usage

```bash
# Check uploads directory size
du -sh backend/uploads

# Count files
ls backend/uploads | wc -l
```

## Troubleshooting

### Upload Fails

1. Check uploads directory exists and is writable
2. Verify file size < 5MB
3. Verify file type is image
4. Check admin authentication token

### Image Not Displaying

1. Verify file exists in uploads directory
2. Check static file serving is configured
3. Verify URL format: `/uploads/filename.jpg`
4. Check CORS settings for cross-origin requests

### Permission Errors

```bash
# Fix permissions on uploads directory
chmod 755 backend/uploads
```

## Future Enhancements

1. **Multiple Images per Product** - Gallery support
2. **Image Cropping** - Built-in image editor
3. **Drag & Drop** - Drag files to upload
4. **Bulk Upload** - Upload multiple images at once
5. **Image Library** - Browse and reuse uploaded images
6. **Image Metadata** - Alt text, captions, credits
7. **Image Variants** - Automatic thumbnail generation
8. **Progress Bar** - Show upload progress percentage
9. **Image Compression** - Automatic compression before upload
10. **WebP Conversion** - Convert all images to WebP format
