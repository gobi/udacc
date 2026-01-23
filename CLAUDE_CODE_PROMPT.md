# UDA Cycling Club - Backend Development Prompt

## Project Overview

Build a complete backend API for **UDA Cycling Club**, a cycling club management system similar to https://www.ubmbc.com/. The system manages cycling rides, participants, attendance tracking, and statistics.

## Tech Stack

- **Language**: Go 1.22+
- **Framework**: Fiber v2
- **ORM**: GORM
- **Database**: PostgreSQL 16
- **Authentication**: JWT (access + refresh tokens)
- **File Processing**: GPX parsing for route data

## Project Structure

```
uda-cycling-club/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   └── database.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── ride.go
│   │   ├── participant.go
│   │   └── user.go
│   ├── middleware/
│   │   └── auth.go
│   ├── models/
│   │   ├── user.go
│   │   ├── ride.go
│   │   ├── ride_type.go
│   │   └── ride_participant.go
│   └── routes/
│       └── routes.go
├── pkg/
│   └── gpx/
│       └── parser.go
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

---

## Database Schema

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    last_name VARCHAR(100) NOT NULL,      -- Овог (эцэг/эхийн нэр)
    first_name VARCHAR(100) NOT NULL,     -- Нэр (өөрийн нэр)
    
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    strava_url VARCHAR(500),              -- Strava profile URL
    
    is_private BOOLEAN DEFAULT FALSE,     -- Хувийн мэдээлэл нуух эсэх
    is_ride_leader BOOLEAN DEFAULT FALSE, -- Аялал удирдах эрхтэй эсэх
    is_admin BOOLEAN DEFAULT FALSE,
    
    total_distance_km DECIMAL(10,2) DEFAULT 0,
    total_rides INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

### ride_types
```sql
CREATE TABLE ride_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed data:
-- 1. Жийлт
-- 2. Оройн жийлт  
-- 3. Өдрийн аялал
-- 4. Хоногийн аялал
-- 5. Олон хоногийн аялал
```

### rides
```sql
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    ride_type_id INTEGER NOT NULL REFERENCES ride_types(id),
    created_by_id UUID NOT NULL REFERENCES users(id),
    leader_id UUID REFERENCES users(id),  -- NULLABLE: Аялал эхлэхэд шийдэгдэнэ
    
    gpx_file_url VARCHAR(500),
    
    -- GPX-аас автоматаар тооцоолсон талбарууд
    distance_km DECIMAL(10,2) DEFAULT 0,      -- Замын урт (км)
    elevation_gain DECIMAL(10,2) DEFAULT 0,   -- Өндөр авалт (м)
    max_gradient DECIMAL(5,2) DEFAULT 0,      -- Их өгсөлт (%)
    max_descent DECIMAL(5,2) DEFAULT 0,       -- Их уруудалт (%)
    pass_count INTEGER DEFAULT 0,             -- Давааны тоо
    
    start_time TIMESTAMP,
    meeting_point_name VARCHAR(255),
    meeting_point_lat DECIMAL(10,8),
    meeting_point_lng DECIMAL(11,8),
    
    status VARCHAR(20) DEFAULT 'draft',  -- draft, published, ongoing, completed, cancelled
    bonus_percentage DECIMAL(5,2) DEFAULT 0,
    
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

### ride_participants
```sql
CREATE TABLE ride_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    attended BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    
    actual_distance_km DECIMAL(10,2),     -- Дундаас орхисон үед яг туулсан км (NULL = бүтэн маршрут)
    bonus_percentage DECIMAL(5,2),        -- Хувь бонус (NULL = аялалын default)
    final_distance_km DECIMAL(10,2) DEFAULT 0,  -- Эцсийн км (тооцоолсон)
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(ride_id, user_id)
);
```

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Member** (default) | Register for rides, view own stats |
| **Ride Leader** (`is_ride_leader=true`) | Create rides, upload GPX, manage attendance, complete rides, select self/others as leader |
| **Admin** (`is_admin=true`) | All permissions + manage users, assign roles |

---

## Core Business Logic

### Ride Lifecycle

```
1. CREATE (Ride Leader)
   └── Status: "draft"
   └── Upload GPX → Auto-calculate: distance, elevation, gradient, passes
   └── Set: title, description, type, start_time, meeting_point

2. PUBLISH (Ride Leader)
   └── Status: "published"
   └── Members can now register

3. START (Ride Leader - from mobile)
   └── Status: "ongoing"
   └── Select leader (can be self or another ride leader)
   └── Mark attendance for registered participants

4. COMPLETE (Ride Leader)
   └── Status: "completed"
   └── For each attended participant:
       - Set actual_distance_km if left early (NULL = full distance)
       - Set individual bonus_percentage (NULL = ride's default)
       - Calculate: final_distance_km = actual_km * (1 + bonus%)
   └── Update user statistics (total_distance_km, total_rides)
```

### GPX Processing

When GPX file is uploaded, automatically calculate:
- **distance_km**: Sum of Haversine distances between all points
- **elevation_gain**: Sum of positive elevation changes
- **max_gradient**: Maximum uphill percentage
- **max_descent**: Maximum downhill percentage (as positive value)
- **pass_count**: Number of peaks (up→down transitions with >50m change)

### Privacy Settings

When `user.is_private = true`:
- Name shows as initials only: "С.М***"
- Hide: phone, strava_url, avatar
- Show: statistics (km, rides), leaderboard rank

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/register        # Register new user
POST   /api/v1/auth/login           # Login, returns JWT
POST   /api/v1/auth/refresh         # Refresh token
GET    /api/v1/auth/me              # Get current user [Auth]
PUT    /api/v1/auth/me              # Update profile [Auth]
POST   /api/v1/auth/change-password # Change password [Auth]
```

### Users
```
GET    /api/v1/users                # List users (respects privacy)
GET    /api/v1/users/leaderboard    # Top users by distance
GET    /api/v1/users/statistics     # Overall stats
GET    /api/v1/users/ride-leaders   # List ride leaders
GET    /api/v1/users/:id            # Get user profile
GET    /api/v1/users/:id/rides      # User's completed rides
PUT    /api/v1/users/:id/role       # Update user role [Admin]
```

### Rides
```
GET    /api/v1/rides                # List rides (filter by status, type)
GET    /api/v1/rides/types          # Get ride types
GET    /api/v1/rides/:id            # Get ride details
POST   /api/v1/rides                # Create ride [RideLeader]
PUT    /api/v1/rides/:id            # Update ride [RideLeader]
DELETE /api/v1/rides/:id            # Delete ride [RideLeader]
POST   /api/v1/rides/:id/gpx        # Upload GPX [RideLeader]
POST   /api/v1/rides/:id/publish    # Publish ride [RideLeader]
POST   /api/v1/rides/:id/start      # Start ride [RideLeader]
POST   /api/v1/rides/:id/complete   # Complete ride [RideLeader]
```

### Participants
```
POST   /api/v1/rides/:id/register              # Register for ride [Auth]
DELETE /api/v1/rides/:id/register              # Unregister [Auth]
GET    /api/v1/rides/:id/participants          # List participants
PUT    /api/v1/rides/:id/participants/:pid     # Update participant [RideLeader]
POST   /api/v1/rides/:id/participants/:pid/attendance  # Mark attendance [RideLeader]
POST   /api/v1/rides/:id/participants/bulk-attendance  # Bulk attendance [RideLeader]
```

---

## Request/Response Examples

### Register
```json
// POST /api/v1/auth/register
{
    "email": "user@example.com",
    "password": "securepassword",
    "last_name": "Батбаяр",
    "first_name": "Дорж",
    "phone": "99112233"
}

// Response
{
    "token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "last_name": "Батбаяр",
        "first_name": "Дорж",
        ...
    }
}
```

### Create Ride
```json
// POST /api/v1/rides
{
    "title": "Богд уулын тойрог",
    "description": "Богд уулыг тойрон жийх аялал",
    "ride_type_id": 3,
    "start_time": "2024-03-15T08:00:00+08:00",
    "meeting_point_name": "Дүнжингарав",
    "meeting_point_lat": 47.9184,
    "meeting_point_lng": 106.9177
}
```

### Upload GPX
```bash
curl -X POST /api/v1/rides/{id}/gpx \
  -H "Authorization: Bearer {token}" \
  -F "gpx=@route.gpx"

# Response
{
    "message": "GPX uploaded successfully",
    "stats": {
        "distance_km": 45.7,
        "elevation_gain": 850,
        "max_gradient": 12.5,
        "max_descent": 15.2,
        "pass_count": 3
    }
}
```

### Start Ride (with leader selection)
```json
// POST /api/v1/rides/{id}/start
{
    "leader_id": "uuid-of-leader"  // Optional, defaults to current user
}
```

### Complete Ride
```json
// POST /api/v1/rides/{id}/complete
{
    "bonus_percentage": 10  // Optional: applies to all participants
}
```

### Update Participant (partial completion)
```json
// PUT /api/v1/rides/{id}/participants/{pid}
{
    "attended": true,
    "actual_distance_km": 32.5,  // Left early at 32.5km
    "bonus_percentage": 15,       // Individual bonus
    "notes": "Дугуй эвдэрсэн"
}
```

---

## Environment Variables

```env
PORT=3000
ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=uda_cycling
DB_SSLMODE=disable

JWT_SECRET=your-super-secret-key
JWT_EXPIRY_HOURS=24
JWT_REFRESH_EXPIRY_DAYS=7

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

---

## Implementation Notes

1. **Use GORM** for database operations with auto-migration
2. **UUID** for all primary keys (use `gen_random_uuid()`)
3. **Soft delete** for users and rides
4. **Timezone**: Asia/Ulaanbaatar
5. **GPX parsing**: Use `github.com/tkrajina/gpxgo` library
6. **Password hashing**: Use bcrypt
7. **Error handling**: Return consistent JSON error responses
8. **Validation**: Validate all inputs before processing
9. **Pagination**: Support `limit` and `offset` query params
10. **CORS**: Allow all origins for development

---

## Testing Checklist

- [ ] User registration and login
- [ ] JWT token generation and validation
- [ ] Ride CRUD operations
- [ ] GPX upload and parsing
- [ ] Ride lifecycle (draft → published → ongoing → completed)
- [ ] Participant registration and attendance
- [ ] Statistics calculation on ride completion
- [ ] Privacy filter on user data
- [ ] Role-based access control
- [ ] Leaderboard sorting

---

## Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Run server
go run cmd/api/main.go

# Run with hot reload (requires air)
air

# Run tests
go test ./...
```

---

Now implement this complete backend API following Go best practices and clean architecture principles.
