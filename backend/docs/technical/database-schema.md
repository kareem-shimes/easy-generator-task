# Database Schema

## Overview

This document describes the MongoDB database schema, collections, indexes, and data models used in the EasyGenerator Authentication API.

## Database Technology

- **Database**: MongoDB
- **ODM**: Mongoose
- **Version**: MongoDB 6.0+ recommended

## Collections

### Users Collection

The primary collection storing user account information.

#### Schema Definition

```typescript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB auto-generated unique identifier |
| `email` | String | Yes | User's email address (unique, lowercase) |
| `name` | String | Yes | User's display name (min 3 characters) |
| `password` | String | Yes | Bcrypt hashed password (never plain text) |
| `createdAt` | Date | Yes (auto) | Account creation timestamp |
| `updatedAt` | Date | Yes (auto) | Last update timestamp |

#### Validation Rules

**Email**:
- Must be valid email format
- Automatically converted to lowercase
- Whitespace trimmed
- Unique across all users

**Name**:
- Minimum 3 characters
- Whitespace trimmed
- Required field

**Password** (before hashing):
- Minimum 8 characters
- At least one letter (a-z, A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

**Password** (stored):
- Bcrypt hash with salt rounds (10 by default)
- Never stored in plain text
- Excluded from API responses via entity transformation (never returned to clients)

#### Indexes

```javascript
// Unique index on email for fast lookups and uniqueness
db.users.createIndex({ "email": 1 }, { unique: true })

// Index on createdAt for sorting users by registration date
db.users.createIndex({ "createdAt": -1 })
```

**Index Benefits**:
- Fast email lookup during sign-in
- Prevents duplicate email addresses
- Efficient user listing queries

## Data Models (TypeScript)

### User Entity

```typescript
export class User {
  _id: string;
  email: string;
  name: string;
  password?: string;  // Optional as it's excluded by default
  createdAt: Date;
  updatedAt: Date;
}
```

### User DTOs

#### Sign-Up DTO

```typescript
export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/,
    { message: 'Password must contain at least one letter, one number, and one special character' }
  )
  @IsNotEmpty()
  password: string;
}
```

#### Sign-In DTO

```typescript
export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

#### User Response DTO

```typescript
export class UserResponseDto {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Password is never included in responses
}
```

## Sample Documents

### User Document Example

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "createdAt": "2025-10-29T10:30:00.000Z",
  "updatedAt": "2025-10-29T10:30:00.000Z"
}
```

### Query Response (Password Excluded)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "createdAt": "2025-10-29T10:30:00.000Z",
  "updatedAt": "2025-10-29T10:30:00.000Z"
}
```

## Database Operations

### Common Queries

#### Create User

```typescript
const user = await this.userModel.create({
  email: 'user@example.com',
  name: 'User Name',
  password: hashedPassword
});
```

#### Find User by Email

```typescript
const user = await this.userModel
  .findOne({ email: 'user@example.com' })
  .exec();
// Note: Password is included in the document but excluded 
// from API responses via UserEntity transformation
```

#### Find User by ID

```typescript
const user = await this.userModel
  .findById(userId)
  .exec();
```

#### Update User

```typescript
const updatedUser = await this.userModel
  .findByIdAndUpdate(
    userId,
    { name: 'New Name' },
    { new: true }
  )
  .exec();
```

## Database Configuration

### Connection String Format

```
mongodb://[username:password@]host[:port]/[database][?options]
```

### Example Connection Strings

**Local Development**:
```
mongodb://localhost:27017/easygenerator-auth
```

**Docker**:
```
mongodb://mongodb:27017/easygenerator-auth
```

**MongoDB Atlas (Cloud)**:
```
mongodb+srv://username:password@cluster.mongodb.net/easygenerator-auth?retryWrites=true&w=majority
```

### Connection Options

```typescript
MongooseModule.forRoot(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,  // Build indexes
  maxPoolSize: 10,  // Connection pool size
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
```

## Data Privacy & Security

### Password Storage
- **Never store plain text passwords**
- Use bcrypt with salt rounds (10)
- Password is available in database documents for authentication
- Always excluded from API responses via UserEntity transformation
- Never returned to clients in any endpoint response

### Email Privacy
- Store emails in lowercase for consistency
- Validate email format
- Ensure uniqueness via unique index

### Data Access
- Limit returned fields to necessary data
- Use projection to exclude sensitive fields
- Implement proper authorization checks

## Backup & Maintenance

### Recommended Practices

1. **Regular Backups**
   - Daily automated backups
   - Point-in-time recovery capability
   - Test restore procedures

2. **Index Maintenance**
   - Monitor index performance
   - Rebuild indexes if needed
   - Remove unused indexes

3. **Data Cleanup**
   - Remove test/temporary data
   - Archive old records if needed
   - Monitor database size

4. **Performance Monitoring**
   - Query performance tracking
   - Slow query identification
   - Connection pool monitoring

## Migration Strategy

### Schema Changes

When schema changes are needed:

1. Create migration script
2. Test in development environment
3. Backup production database
4. Apply migration during low-traffic period
5. Verify data integrity
6. Monitor for issues

### Example Migration (Adding a Field)

```typescript
// Add 'lastLoginAt' field to existing users
await db.collection('users').updateMany(
  { lastLoginAt: { $exists: false } },
  { $set: { lastLoginAt: null } }
);
```

## Future Enhancements

### Potential Schema Extensions

1. **User Roles**
   ```typescript
   role: {
     type: String,
     enum: ['user', 'admin', 'moderator'],
     default: 'user'
   }
   ```

2. **Email Verification**
   ```typescript
   emailVerified: {
     type: Boolean,
     default: false
   },
   verificationToken: {
     type: String,
     select: false
   }
   ```

3. **Account Status**
   ```typescript
   status: {
     type: String,
     enum: ['active', 'suspended', 'deleted'],
     default: 'active'
   }
   ```

4. **Login Tracking**
   ```typescript
   lastLoginAt: Date,
   loginCount: {
     type: Number,
     default: 0
   }
   ```

5. **Password Reset**
   ```typescript
   resetPasswordToken: String,
   resetPasswordExpires: Date
   ```
