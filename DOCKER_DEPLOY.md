# Deploy Frontend แยกจาก Backend

ใช้ Docker Compose v2 และ Linux containers
ไฟล์ docker-compose.yml นี้ไม่ใช้ env_file และไม่ต้องมี .env
Frontend image กำหนด API เป็น /api ตอน build อยู่แล้ว

## เริ่มใช้งาน

Backend ต้องทำงานบนเครื่องเดียวกันและ publish พอร์ต 4025
ถ้า Backend อยู่คนละเครื่อง ให้เปลี่ยน BACKEND_ORIGIN ใน docker-compose.yml
เป็น http://IP-Backend:4025 โดยไม่ใส่ /api ต่อท้าย
ห้ามใช้ localhost เพราะใน container หมายถึง container นั้นเอง
ถ้า Backend bind host port แค่ 127.0.0.1 ต้องเปลี่ยน bind หรือเชื่อม Docker network
ให้ container web เข้าถึงได้; host.docker.internal ไม่สามารถข้ามข้อจำกัด bind นี้

บน server เข้าโฟลเดอร์ Line_Frontend:

```sh
git status --short
git pull origin main
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 web line_frontend
```

หากมี docker-compose.yml เดิมที่แก้เองหรือสร้างเอง ให้สำรองและเทียบกับไฟล์ใน repo
ก่อน pull อย่าเขียนทับ .env หรือ local changes แบบไม่ตรวจสอบ
ตั้งเครื่องมือ deploy ให้เรียก docker compose v2 ไม่ใช่ fallback docker-compose v1

เข้า http://IP-เซิร์ฟเวอร์:4024/login
หากต้องการเปลี่ยนพอร์ตเว็บ แก้ซ้ายของ ports: เช่น 4080:8080
อย่าเปลี่ยนพอร์ตภายใน 8080 โดยไม่แก้ nginx ให้ตรงกัน

ตั้ง Backend CORS_ORIGINS/CLIENT_WEB_URL ให้ตรง URL Frontend
ไม่ต้องเพิ่ม LINE token, JWT secret หรือรหัสฐานข้อมูลใน Frontend

## ตรวจสอบ

หาก build ผ่านแต่ container unhealthy ให้ตรวจ runtime และผล healthcheck:

```sh
docker compose logs --tail=100 line_frontend
docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q line_frontend)"
docker compose exec line_frontend node -e "console.log({host:process.env.HOSTNAME,port:process.env.PORT});fetch('http://127.0.0.1:3000/login').then(r=>console.log(r.status)).catch(console.error)"
```

Compose กำหนด HOSTNAME=0.0.0.0 และ PORT=3000 ชัดเจน
ให้ standalone server รับทุก interface และ healthcheck ใช้ loopback พอร์ตเดียวกัน
พอร์ต 4024 อยู่ที่ nginx ฝั่ง host ไม่ใช่ PORT ของ Next.js container
ถ้ายัง unhealthy ต้องดู error ใน runtime log ไม่ควรปิด healthcheck เพื่อฝืนเปิด nginx

- GET http://IP-เซิร์ฟเวอร์:4024/login ต้องแสดงหน้า Login
- POST /api/login จากเว็บต้องไป Backend 4025 ไม่ใช่ localhost ของผู้ใช้
- 502 จาก /api หมายถึง nginx เชื่อม Backend ไม่สำเร็จ ให้ตรวจ Backend และ firewall
- 401 จาก /api/login หมายถึงไปถึง Backend แล้ว ให้ตรวจบัญชี/รหัสผ่าน
- ทดสอบ Login รายการกลุ่ม Template ประวัติ และอัปโหลดรูป

พอร์ต 4024 มีเว็บและ API จัดการสำหรับใช้ภายใน ให้จำกัดการเข้าถึงตามเครือข่ายองค์กร
HTTPS สาธารณะสำหรับ LINE ให้ทีมเครือข่ายเปิดเฉพาะ Webhook กับรูปไป Backend
อย่าเปิดเว็บทั้งชุดออกสาธารณะโดยไม่กำหนดขอบเขต

เครื่องพัฒนาไม่มี Docker จึงต้องยืนยัน container/network บน server จริง
Next.js build ต้องเชื่อมอินเทอร์เน็ตเพื่อดาวน์โหลด Google font และ npm dependencies
