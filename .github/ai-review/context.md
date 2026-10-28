# AI Review Context

ความรู้ฐานสำหรับ review ทุกครั้ง — **fixed format** 4 หัวข้อด้านล่าง (มนุษย์แก้เนื้อหาได้ แต่อย่าเปลี่ยนหัวข้อ) — ความจำรายวันอยู่ในไฟล์ `<date>-context.md`

## Architecture

- GitHub Action ตัวเดียว แบบ stateless — ทุกอย่างผ่าน GitHub REST API และ AI provider โดยตรง ไม่มี database
- `dist/index.js` เป็น build output จาก `src/index.ts` ด้วย @vercel/ncc
- นิยาม agent อยู่ใน `agents/<name>.md` (author/primary/specialist/checklist/combined), skills ใน `BUILT_IN_SKILLS` (src/index.ts)

## Skip Review

- `dist/` — generated output (เช็คแค่ว่า rebuild ตาม src หรือไม่ ไม่ต้อง review เนื้อใน)
- `package-lock.json` — dependency pinning อัตโนมัติ
- `docs/release/*.md` — release notes ข้อความล้วน

## Conventions

- Code comments ภาษาไทย เฉพาะ constraint ที่โค้ดมองไม่เห็น
- Commit message อังกฤษแบบ conventional commits
- คำตอบของ AI review เป็นภาษาไทย (`language: Thai`)

## Known Issues

- PR ทดสอบมักเกิน guideline 200–400 บรรทัด (เป็น PR รวมฟีเจอร์) — ทราบแล้ว ไม่ต้องรายงานซ้ำ
