# UDA Cycling Club (UDACC)

Унадаг дугуйн клубын вэб систем - аялал зохион байгуулах, гишүүдийн явсан км-г бүртгэх.

## Tech Stack

**Backend:** Go + Fiber + GORM + SQLite
**Frontend:** Next.js 14 + React 18 + TailwindCSS

## Төслийн бүтэц

```
udacc/
├── cmd/main.go              # Backend entry point (port 8080)
├── internal/
│   ├── handlers/            # API handlers
│   │   ├── ride.go          # Аялал CRUD, start, complete
│   │   └── participant.go   # Бүртгэл, ирц, км бүртгэх
│   ├── models/              # GORM models
│   ├── routes/routes.go     # API routes
│   └── middleware/          # Auth, role checks
├── pkg/gpx/parser.go        # GPX файл parse + elevation API
└── web/                     # Next.js frontend (port 3001)
    └── src/
        ├── app/
        │   ├── rides/[id]/page.tsx  # Аялал дэлгэрэнгүй
        │   └── rides/new/page.tsx   # Шинэ аялал үүсгэх
        ├── components/
        │   ├── RouteMap.tsx         # Маршрут газрын зураг
        │   ├── RouteMapInner.tsx    # Leaflet map + arrows
        │   ├── GPXUpload.tsx        # GPX файл оруулах
        │   └── MeetingPointPicker.tsx # Уулзах цэг сонгох
        └── lib/
            ├── api.ts               # API client
            └── auth.tsx             # Auth context

```

## API Endpoints

### Rides
- `GET /api/v1/rides` - Жагсаалт (draft зөвхөн creator/admin-д)
- `POST /api/v1/rides` - Үүсгэх
- `POST /api/v1/rides/parse-gpx` - GPX файл parse (ride үүсгэхгүй)
- `POST /api/v1/rides/:id/gpx` - GPX файл upload
- `GET /api/v1/rides/:id/route` - Route points (map-д)
- `POST /api/v1/rides/:id/publish` - Нийтлэх (draft → published)
- `POST /api/v1/rides/:id/start` - Эхлүүлэх (published → ongoing)
- `POST /api/v1/rides/:id/complete` - Дуусгах (ongoing → completed)

### Participants
- `POST /api/v1/rides/:id/register` - Бүртгүүлэх
- `DELETE /api/v1/rides/:id/register` - Бүртгэл цуцлах
- `GET /api/v1/rides/:id/participants` - Оролцогчид
- `PUT /api/v1/rides/:id/participants/:pid` - Ирц, явсан км засах

## Ride Status Flow

```
draft → published → ongoing → completed
         ↓
      cancelled
```

## Хэрэгжүүлсэн Feature-үүд

1. **GPX Upload + Auto Stats**
   - GPX файлаас distance, elevation_gain, max_gradient, max_descent, pass_count тооцоолно
   - Open-Elevation API ашиглан өндөр авна (RideWithGPS GPX-д өндөр байхгүй)

2. **Route Map**
   - Leaflet + react-leaflet@4
   - leaflet-arrowheads - чиглэлийн сум
   - Эхлэх цэг (ногоон), төгсөх цэг (улаан), уулзах цэг (цэнхэр)

3. **Meeting Point Picker**
   - Газрын зураг дээр дарж уулзах цэг сонгоно

4. **Ride Management**
   - Эхлүүлэх/Дуусгах товчууд (creator/leader-д)
   - Draft rides зөвхөн creator/admin-д харагдана

5. **Attendance Tracking**
   - Ирц toggle (ирсэн/ирээгүй)
   - Явсан км оруулах (аялалаа бүрэн дуусгаагүй хүнд)

## Монгол хэл

UI бүхэлдээ Монгол хэлээр. Жишээ:
- "Аялал" = Ride
- "Оролцогч" = Participant
- "Ирц" = Attendance
- "Явсан км" = Actual distance

## Эхлүүлэх

```bash
# Backend
cd cmd && go run main.go

# Frontend
cd web && npm run dev
```

## Дараагийн ажлууд (TODO)

- [ ] Elevation profile график
- [ ] Strava integration
- [ ] Mobile responsive сайжруулах
- [ ] Push notification
