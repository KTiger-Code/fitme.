# 🏋️ FitLife Tracker — Personal Fitness Trainer Web App

ระบบเทรนเนอร์ออกกำลังกายส่วนตัว พร้อมตารางออกกำลังกายรายวัน คำนวณแคลอรี่ ติดตามน้ำหนัก

## 🚀 วิธีติดตั้งและใช้งาน

### ขั้นตอนที่ 1: สร้าง Database (MySQL 8.0)

เปิด MySQL แล้วรัน:

```sql
mysql -u root -p

-- สร้าง Database + ตาราง
SOURCE d:/narongsak/Navapol1/backend/database/schema.sql;

-- เพิ่มข้อมูลเริ่มต้น (ท่าออกกำลังกาย 50+ ท่า, แผนสำเร็จรูป 3 แผน)
SOURCE d:/narongsak/Navapol1/backend/database/seed.sql;
```

### ขั้นตอนที่ 2: ตั้งค่า Backend

```bash
cd backend

# แก้ไฟล์ .env ตั้งค่า MySQL password
# DB_PASSWORD=your_password

# ติดตั้ง packages (ถ้ายังไม่ได้ติดตั้ง)
npm install

# เปิด server
npm run dev
```

Backend จะรันที่ http://localhost:5000

### ขั้นตอนที่ 3: เปิด Frontend

```bash
cd frontend

# วิธีที่ 1: ใช้ Live Server Extension ใน VS Code
# คลิกขวาที่ index.html > Open with Live Server

# วิธีที่ 2: ใช้ npx serve
npx serve -p 3000

# วิธีที่ 3: เปิดไฟล์ index.html ตรงๆ ในเบราว์เซอร์
```

Frontend จะรันที่ http://localhost:3000

## 📁 โครงสร้างโปรเจค

```
Navapol1/
├── backend/
│   ├── config/db.js              # MySQL connection
│   ├── middleware/auth.js        # JWT authentication
│   ├── controllers/
│   │   ├── auth.controller.js    # Register/Login
│   │   ├── exercise.controller.js
│   │   ├── plan.controller.js    # Workout plans
│   │   ├── workout.controller.js # Workout logging
│   │   ├── weight.controller.js  # Weight tracking
│   │   └── dashboard.controller.js
│   ├── routes/                   # API routes
│   ├── utils/calories.js         # BMR, TDEE, MET calculator
│   ├── database/
│   │   ├── schema.sql            # CREATE TABLE
│   │   └── seed.sql              # Seed data
│   ├── server.js                 # Express server
│   └── .env                      # Config
├── frontend/
│   ├── index.html                # Single Page App
│   └── js/
│       ├── api.js                # API helper
│       └── app.js                # App logic
└── FitLife-Tracker-Design.txt    # Design document
```

## 🔑 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Tailwind CSS, Vanilla JS, Chart.js |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| Auth | JWT + bcrypt |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | เข้าสู่ระบบ |
| GET | /api/auth/me | ข้อมูลตัวเอง |
| PUT | /api/auth/profile | แก้ไขโปรไฟล์ |
| GET | /api/exercises | คลังท่าออกกำลังกาย |
| GET | /api/plans | แผนของฉัน |
| GET | /api/plans/templates | แผนสำเร็จรูป |
| POST | /api/plans/:id/clone | คัดลอกแผน |
| POST | /api/plans/:id/activate | ใช้แผน |
| GET | /api/workouts/today | ตารางวันนี้ |
| POST | /api/workouts/complete | ✅ ติ๊กท่าเสร็จ |
| GET | /api/workouts/history | ประวัติ |
| POST | /api/weight | บันทึกน้ำหนัก |
| GET | /api/dashboard/summary | สรุป Dashboard |
| GET | /api/dashboard/achievements | รางวัล |
