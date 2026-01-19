# UDA Cycling Club (UDACC)

Унадаг дугуйн клубын вэб систем - аялал зохион байгуулах, гишүүдийн явсан км-г бүртгэх.

## Tech Stack

**Backend:** Go 1.21+ / Fiber v2 / GORM / PostgreSQL
**Frontend:** Next.js 14 / React 18 / TailwindCSS / Leaflet

## Төслийн бүтэц

```
udacc/
├── cmd/api/main.go           # Backend entry point (port 8080)
├── internal/
│   ├── handlers/
│   │   ├── ride.go           # Аялал CRUD, start, complete, route
│   │   ├── participant.go    # Бүртгэл, ирц, км бүртгэх
│   │   ├── user.go           # Хэрэглэгчийн мэдээлэл
│   │   └── leaderboard.go    # Тэргүүлэгчид
│   ├── models/               # GORM models
│   ├── routes/routes.go      # API routes
│   ├── middleware/           # Auth, role checks
│   └── database/             # DB connection
├── pkg/gpx/parser.go         # GPX parse + elevation API + pass detection
├── uploads/                  # GPX файлууд хадгалагдана
└── web/                      # Next.js frontend (port 3001)
    └── src/
        ├── app/
        │   ├── rides/
        │   │   ├── page.tsx           # Аялалын жагсаалт
        │   │   ├── new/page.tsx       # Шинэ аялал үүсгэх
        │   │   └── [id]/
        │   │       ├── page.tsx       # Аялал дэлгэрэнгүй
        │   │       └── edit/page.tsx  # Аялал засах
        │   ├── users/[id]/page.tsx    # Тамирчны профайл
        │   ├── leaderboard/page.tsx   # Тэргүүлэгчид
        │   └── auth/login/page.tsx    # Нэвтрэх
        ├── components/
        │   ├── RouteMap.tsx           # Маршрут газрын зураг (wrapper)
        │   ├── RouteMapInner.tsx      # Leaflet map + markers + arrows
        │   ├── GPXUpload.tsx          # GPX файл оруулах (drag & drop)
        │   ├── MeetingPointPicker.tsx # Уулзах цэг сонгох
        │   ├── ElevationProfile.tsx   # Өндрийн график
        │   └── Navbar.tsx             # Navigation
        └── lib/
            ├── api.ts                 # API client (fetchAPI, api.*)
            └── auth.tsx               # Auth context + useAuth hook
```

## API Endpoints

### Rides
- `GET /api/v1/rides` - Жагсаалт (draft зөвхөн creator/admin-д)
- `GET /api/v1/rides/:id` - Дэлгэрэнгүй
- `POST /api/v1/rides` - Үүсгэх (multipart form + GPX)
- `PUT /api/v1/rides/:id` - Засах
- `DELETE /api/v1/rides/:id` - Устгах
- `POST /api/v1/rides/parse-gpx` - GPX файл parse (ride үүсгэхгүй)
- `POST /api/v1/rides/:id/gpx` - GPX файл upload
- `GET /api/v1/rides/:id/route` - Route points + passes (map-д)
- `POST /api/v1/rides/:id/publish` - Нийтлэх (draft → published)
- `POST /api/v1/rides/:id/start` - Эхлүүлэх (published → ongoing)
- `POST /api/v1/rides/:id/complete` - Дуусгах (ongoing → completed)

### Participants
- `POST /api/v1/rides/:id/register` - Бүртгүүлэх
- `DELETE /api/v1/rides/:id/register` - Бүртгэл цуцлах
- `GET /api/v1/rides/:id/participants` - Оролцогчид
- `PUT /api/v1/rides/:id/participants/:pid` - Ирц, явсан км засах

### Users
- `GET /api/v1/users/:id` - Хэрэглэгчийн мэдээлэл
- `GET /api/v1/users/:id/rides` - Хэрэглэгчийн аялалууд
- `GET /api/v1/leaderboard` - Тэргүүлэгчид (total_distance, ride_count)

### Auth
- `POST /api/v1/auth/login` - Нэвтрэх
- `POST /api/v1/auth/register` - Бүртгүүлэх
- `GET /api/v1/auth/me` - Одоогийн хэрэглэгч

## Ride Status Flow

```
draft → published → ongoing → completed
         ↓
      cancelled
```

## GPX Parser + Pass Detection

**File:** `pkg/gpx/parser.go`

### RouteStats struct
```go
type RouteStats struct {
    DistanceKm    float64    `json:"distance_km"`
    ElevationGain float64    `json:"elevation_gain"`
    MaxGradient   float64    `json:"max_gradient"`
    MaxDescent    float64    `json:"max_descent"`
    PassCount     int        `json:"pass_count"`
    Passes        []PassInfo `json:"passes,omitempty"`
}

type PassInfo struct {
    Lat        float64 `json:"lat"`
    Lng        float64 `json:"lng"`
    Elevation  float64 `json:"elevation"`
    DistanceKm float64 `json:"distance_km"`
}
```

### Pass Detection Algorithm
1. GPX файлаас бүх цэгүүдийг унших
2. Өндөр байхгүй бол Open-Elevation API-с авах (batch 100 points)
3. Local maxima олох (window size = 20 points)
4. Prominence >= 30м шүүх
5. Өндрөөр эрэмбэлэх (хамгийн өндрөөс)
6. Хамгийн багадаа 5км зайтай оргилуудыг сонгох
7. Route distance-р эрэмбэлэх (Даваа 1, 2, 3... дугаарлах)

### Constants
```go
const (
    minPassDistanceKm = 5.0   // Даваа хоорондын хамгийн бага зай
    peakWindowSize    = 20    // Local maxima олох цонхны хэмжээ
    minPeakProminence = 30.0  // Оргил гэж тооцох хамгийн бага өндрийн зөрүү
)
```

## Route Map Markers

**File:** `web/src/components/RouteMapInner.tsx`

| Marker | Өнгө | Зориулалт |
|--------|------|-----------|
| startIcon | Ногоон | Эхлэх цэг |
| endIcon | Улаан | Төгсөх цэг |
| meetingIcon | Цэнхэр | Уулзах газар |
| passIcon | Шар | Даваа (Даваа 1, Даваа 2...) |

Leaflet-arrowheads ашиглан замын чиглэлийг сумаар харуулна.

## Frontend API Client

**File:** `web/src/lib/api.ts`

```typescript
// Rides
api.rides.list()
api.rides.get(id)
api.rides.create(data)  // multipart form
api.rides.update(id, data)
api.rides.delete(id)
api.rides.parseGPX(file)
api.rides.uploadGPX(id, file)
api.rides.getRoute(id)  // Returns { points, passes }
api.rides.publish(id)
api.rides.start(id)
api.rides.complete(id)

// Participants
api.rides.register(id)
api.rides.unregister(id)
api.rides.getParticipants(id)
api.rides.updateParticipant(rideId, participantId, { attended, actual_distance_km })

// Users
api.users.get(id)
api.users.getRides(id)  // Returns { rides: [{ ride: {...}, final_distance_km, attended }] }

// Leaderboard
api.leaderboard.get()
```

## User Rides Response Structure

`GET /api/v1/users/:id/rides` хариу:
```json
{
  "rides": [
    {
      "ride": {
        "id": "uuid",
        "title": "Аялалын нэр",
        "start_time": "2026-01-19T10:00:00Z",
        "distance_km": 120,
        "status": "completed"
      },
      "final_distance_km": 115.5,
      "attended": true
    }
  ]
}
```

## Хэрэгжүүлсэн Feature-үүд

1. **GPX Upload + Auto Stats**
   - GPX файлаас distance, elevation_gain, max_gradient, max_descent тооцоолно
   - Open-Elevation API ашиглан өндөр авна (RideWithGPS GPX-д өндөр байхгүй үед)

2. **Pass Detection**
   - Оргилуудыг автоматаар олно (prominence >= 30м)
   - Хамгийн багадаа 5км зайтай
   - Газрын зураг дээр шар pin-ээр харуулна

3. **Route Map**
   - Leaflet + react-leaflet@4 (dynamic import, SSR disabled)
   - leaflet-arrowheads - чиглэлийн сум
   - Эхлэх/төгсөх/уулзах/даваа markers

4. **Meeting Point Picker**
   - Газрын зураг дээр дарж уулзах цэг сонгоно

5. **Ride Management**
   - Эхлүүлэх/Дуусгах товчууд (creator/leader-д)
   - Draft rides зөвхөн creator/admin-д харагдана
   - Edit page - аялал засах

6. **Attendance Tracking**
   - Ирц toggle (ирсэн/ирээгүй)
   - Явсан км оруулах (аялалаа бүрэн дуусгаагүй хүнд)

7. **User Profile**
   - Тамирчны статистик (нийт км, аялалын тоо)
   - Аялалуудын жагсаалт

8. **Leaderboard**
   - Тэргүүлэгчдийн жагсаалт
   - Тамирчин дээр дарахад профайл руу очно
   - Аялалын тоон дээр дарахад аялалуудыг харуулна

## Монгол хэл

UI бүхэлдээ Монгол хэлээр:
- "Аялал" = Ride
- "Оролцогч" = Participant
- "Ирц" = Attendance
- "Явсан км" = Actual distance
- "Даваа" = Pass (mountain pass)
- "Уулзах газар" = Meeting point
- "Тэргүүлэгчид" = Leaderboard

## Эхлүүлэх

```bash
# Backend (port 8080)
cd /Users/gobi/development/udacc
go build -o udacc ./cmd/api && ./udacc

# Frontend (port 3001)
cd /Users/gobi/development/udacc/web
npm run dev
```

## Environment

Backend environment variables (`.env` эсвэл системд):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token secret

## Дараагийн ажлууд (TODO)

- [ ] Strava integration
- [ ] Mobile responsive сайжруулах
- [ ] Push notification
- [ ] Ride photos upload
- [ ] Comments on rides
