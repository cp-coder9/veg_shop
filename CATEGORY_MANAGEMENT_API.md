# Category Management API Implementation

## Overview

Implemented a full-stack category management system that syncs across all devices and admin users through a backend API and database.

## Database Schema

### New Table: `product_categories`

```sql
CREATE TABLE "product_categories" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT UNIQUE NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
```

### Relationship

- `products.category` → Foreign key to `product_categories.key`
- Prevents deletion of categories with products
- Cascade updates when category key changes

### Default Categories Seeded

1. vegetables → "Vegetables"
2. fruits → "Fruits"
3. dairy_eggs → "Dairy & Eggs"
4. bread_bakery → "Bread & Bakery"
5. pantry → "Pantry Items"
6. meat_protein → "Meat & Protein"

## Backend Implementation

### Service Layer

**File:** `backend/src/services/category.service.ts`

**Methods:**
- `getCategories(includeInactive)` - Get all categories
- `getCategoryByKey(key)` - Get single category with product count
- `createCategory(data)` - Create new category with validation
- `updateCategory(key, data)` - Update category details
- `deleteCategory(key)` - Delete category (prevents if has products)
- `seedDefaultCategories()` - Seed default categories

**Validation:**
- Category key must be lowercase letters and underscores only
- Key must be unique
- Cannot delete categories with products

### API Routes

**File:** `backend/src/routes/category.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Public | Get all active categories |
| GET | `/api/categories?includeInactive=true` | Public | Get all categories including inactive |
| GET | `/api/categories/:key` | Public | Get category by key with product count |
| POST | `/api/categories` | Admin | Create new category |
| PUT | `/api/categories/:key` | Admin | Update category |
| DELETE | `/api/categories/:key` | Admin | Delete category |
| POST | `/api/categories/seed` | Admin | Seed default categories |

**Error Codes:**
- `CATEGORY_NOT_FOUND` - Category doesn't exist
- `DUPLICATE_CATEGORY` - Key already exists
- `INVALID_KEY_FORMAT` - Key format invalid
- `CATEGORY_IN_USE` - Cannot delete category with products
- `INVALID_INPUT` - Missing required fields
- `INTERNAL_ERROR` - Server error

### Registration

**File:** `backend/src/index.ts`

```typescript
import categoryRoutes from './routes/category.routes.js';
app.use('/api/categories', categoryRoutes);
```

## Frontend Implementation

### React Hooks

**File:** `frontend/src/hooks/useCategories.ts`

**Hooks:**
- `useCategories(includeInactive)` - Fetch all categories
- `useCategory(key)` - Fetch single category
- `useCreateCategory()` - Create category mutation
- `useUpdateCategory()` - Update category mutation
- `useDeleteCategory()` - Delete category mutation
- `useSeedCategories()` - Seed categories mutation

**Types:**
```typescript
interface Category {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryDto {
  key: string;
  label: string;
  description?: string;
  sortOrder?: number;
}
```

### UI Integration

**File:** `frontend/src/pages/admin/ProductsManagement.tsx`

**Features:**
1. **Category Dropdown** - Shows all categories (default + custom)
2. **Add Category Option** - "+ Add New Category" at bottom of dropdown
3. **Add Category Modal** - Form to create new categories
4. **Real-time Sync** - Categories immediately available after creation
5. **Validation** - Client-side validation before API call

**Modal Fields:**
- **Category Key** (required) - Technical identifier, auto-formats to lowercase
- **Category Label** (required) - Display name
- **Description** (optional) - Category description

**User Flow:**
1. Admin opens product edit/create form
2. Clicks category dropdown
3. Selects "+ Add New Category"
4. Modal opens
5. Enters key (e.g., `herbs_spices`), label (e.g., "Herbs & Spices"), and optional description
6. Clicks "Add Category"
7. Category saved to database
8. Category immediately available in dropdown
9. New category auto-selected in form

## Migration

**File:** `backend/prisma/migrations/20251110225857_add_product_categories/migration.sql`

**Steps to Apply:**

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Apply migration
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

**Note:** If you encounter file lock errors with Prisma generate, close any running processes and try again.

## API Usage Examples

### Get All Categories

```bash
GET /api/categories
```

Response:
```json
[
  {
    "id": "uuid",
    "key": "vegetables",
    "label": "Vegetables",
    "description": null,
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

### Create Category

```bash
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "key": "herbs_spices",
  "label": "Herbs & Spices",
  "description": "Fresh and dried herbs and spices",
  "sortOrder": 7
}
```

Response:
```json
{
  "id": "uuid",
  "key": "herbs_spices",
  "label": "Herbs & Spices",
  "description": "Fresh and dried herbs and spices",
  "isActive": true,
  "sortOrder": 7,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Update Category

```bash
PUT /api/categories/herbs_spices
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "label": "Herbs, Spices & Seasonings",
  "description": "Fresh herbs, dried spices, and seasonings"
}
```

### Delete Category

```bash
DELETE /api/categories/herbs_spices
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "message": "Category deleted successfully"
}
```

Error (if has products):
```json
{
  "error": {
    "code": "CATEGORY_IN_USE",
    "message": "Cannot delete category with 5 products. Reassign products first."
  }
}
```

## Benefits

### Before (localStorage)
- ❌ Categories only on one browser
- ❌ Not shared between admins
- ❌ Lost when clearing browser data
- ❌ No validation or constraints
- ❌ No product relationship tracking

### After (Database API)
- ✅ Categories synced across all devices
- ✅ Shared between all admin users
- ✅ Persistent in database
- ✅ Full validation and constraints
- ✅ Tracks product relationships
- ✅ Prevents deletion of categories in use
- ✅ Audit logging for all changes
- ✅ Sortable and searchable

## Security

- Category creation/update/delete requires admin authentication
- JWT token validation on all admin endpoints
- Audit logging for all category operations
- Input validation prevents SQL injection
- Rate limiting on all API endpoints

## Future Enhancements

1. **Category Management Page** - Dedicated admin page to manage all categories
2. **Bulk Operations** - Import/export categories
3. **Category Icons** - Add icon field for visual representation
4. **Category Hierarchy** - Support for subcategories
5. **Category Analytics** - Track popular categories
6. **Soft Delete** - Archive instead of delete
7. **Category Images** - Banner images for category pages
8. **SEO Fields** - Meta descriptions for category pages

## Testing

### Manual Testing Checklist

- [ ] Create new category from product form
- [ ] Category appears in dropdown immediately
- [ ] Category syncs to other admin sessions
- [ ] Cannot create duplicate category keys
- [ ] Key validation works (lowercase, underscores)
- [ ] Cannot delete category with products
- [ ] Can delete empty category
- [ ] Category persists after page refresh
- [ ] Default categories are seeded
- [ ] Audit logs record category operations

### API Testing

```bash
# Get categories
curl http://localhost:3000/api/categories

# Create category (requires admin token)
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"test_category","label":"Test Category"}'

# Delete category
curl -X DELETE http://localhost:3000/api/categories/test_category \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Prisma Generate Fails
- Close all running processes (dev servers, terminals)
- Delete `node_modules/.prisma` folder
- Run `npx prisma generate` again

### Migration Fails
- Check database connection
- Ensure no other migrations are running
- Try `npx prisma migrate resolve --applied <migration_name>` if stuck

### Categories Not Showing
- Check browser console for API errors
- Verify backend is running
- Check authentication token is valid
- Ensure migration was applied

### Cannot Delete Category
- Check if category has products assigned
- Reassign products to different category first
- Or use soft delete (set isActive = false)
