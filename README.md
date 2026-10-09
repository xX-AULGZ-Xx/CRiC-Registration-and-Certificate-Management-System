# Registration and Certificate Management System
### ระบบลงทะเบียน ออกเกียรติบัตร และประเมินความพึงพอใจ (Standalone System)

ระบบบริหารจัดการกิจกรรม, การลงทะเบียนผู้เข้าร่วม, การเช็คชื่อหน้างานด้วย QR Code, การทำแบบประเมินความพึงพอใจตามเกณฑ์มาตรฐาน Likert Scale ($\bar{X}$, S.D.), และการออกแบบ/ออกเกียรติบัตรออนไลน์ (พร้อมระบบตรวจสอบความถูกต้องด้วย QR Code)

---

## 🌟 ฟังก์ชันหลัก (Key Features)

1. **การจัดการกิจกรรม (Event Management)**:
   - สร้าง แก้ไข และปิดรับสมัครกิจกรรม/หลักสูตรอบรม
   - รองรับการระบุรหัสโครงการอ้างอิง (Project Ref Code)
   - ลิงก์และ QR Code ประชาสัมพันธ์หน้าลงทะเบียนและแบบประเมิน
2. **ระบบลงทะเบียนและเช็คชื่อ (Registration & Check-in)**:
   - ผู้เข้าร่วมลงทะเบียนผ่านหน้าเว็บสาธารณะ (ไม่ต้องสมัครสมาชิก)
   - บัตรลงทะเบียนประจำตัวพร้อม QR Code สำหรับเช็คชื่อ
   - ระบบเช็คชื่อหน้างานด่วน (Quick Check-in) ด้วยเบอร์โทร, เลขบัตร 13 หลัก หรือ ID
3. **ระบบประเมินความพึงพอใจ (Satisfaction Evaluation)**:
   - ฟอร์มประเมินหลายตอน (ข้อมูลทั่วไป, ระดับความพึงพอใจ 5 ระดับ, ข้อเสนอแนะปลายเปิด)
   - การประมวลผลสถิติอัตโนมัติ: ค่าเฉลี่ย ($\bar{X}$), ส่วนเบี่ยงเบนมาตรฐาน (S.D.) และระดับการแปลผล
   - เชื่อมโยงสิทธิ์การรับเกียรติบัตรอัตโนมัติทันทีหลังตอบแบบประเมิน
4. **ระบบออกแบบและออกเกียรติบัตร (Certificate Studio)**:
   - Interactive Visual Designer: จัดวางบล็อกชื่อ, กิจกรรม, เลขที่เกียรติบัตร และ QR Code แบบ Drag & Drop
   - เลือกฟอนต์ไทยสวยงามมาตรฐาน (สารบรรณ, ชาร์ม, ศรีศักดิ์, พร้อมท์, คณิต ฯลฯ)
   - อัปโหลดภาพพื้นหลังเกียรติบัตรขนาด A4 แนวนอน
   - ระบบสร้างเลขที่เกียรติบัตรอัตโนมัติ (Running Number)
   - ดาวน์โหลดเอกสาร PDF (A4 แนวนอน Full-bleed) และภาพ PNG คมชัดสูง
5. **ระบบตรวจสอบและค้นหาเกียรติบัตรสาธารณะ (Public Search & Verification)**:
   - **หน้าค้นหาเกียรติบัตร**: ค้นหาย้อนหลังด้วยเบอร์โทร, เลขบัตร หรือชื่อ
   - **หน้าตรวจสอบความถูกต้อง (Verification Portal)**: สแกน QR Code บนเกียรติบัตรเพื่อยืนยันเอกสารจริง

---

## 🏗 โครงสร้างโปรเจกต์ (Monorepo)

```
Registration and Certificate Management System/
├── apps/
│   ├── api/             # Backend: Node.js Express, TypeScript, Prisma ORM
│   └── web/             # Frontend: Next.js 15 (App Router), Tailwind CSS
├── storage/             # จัดเก็บภาพพื้นหลังเกียรติบัตรและลายเซ็น
├── package.json         # Root package script
└── pnpm-workspace.yaml  # pnpm workspace config
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
pnpm install
```

### 2. ซิงค์ฐานข้อมูลและ Seed ข้อมูลเริ่มต้น
```bash
pnpm db:generate
pnpm --filter api exec prisma db push
pnpm db:seed
```

### 3. รันเซิร์ฟเวอร์ในโหมด Development
```bash
pnpm dev
```
- **Frontend Web**: [http://localhost:3006](http://localhost:3006)
- **Backend API**: [http://localhost:5060](http://localhost:5060)

---

## 🔑 บัญชีผู้ใช้เริ่มต้น (Default Seed Accounts)

| บัญชี | Username | Password | บทบาท (Role) |
|---|---|---|---|
| **ผู้ดูแลระบบ (Admin)** | `admin` | `admin1234` | ดูแลระบบทั้งหมด |
| **ผู้จัดกิจกรรม (Organizer)** | `organizer` | `password1234` | สร้างและจัดการกิจกรรม |
