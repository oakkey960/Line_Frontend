"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Hospital, LockKeyhole, UserRound } from "lucide-react";
import { api, getToken, saveUser, setToken, User } from "@/lib/api";
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (getToken()) router.replace("/compose");
  }, [router]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api<{ token: string; user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setToken(result.token);
      saveUser(result.user);
      router.replace("/compose");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-glow" />
        <div className="hero-content">
          <span className="hero-icon">
            <Hospital size={34} />
          </span>
          <p>ระบบสื่อสารภายในที่เรียบง่ายและตรวจสอบย้อนหลังได้</p>
          <h1>
            ส่งข้อมูลถึงทีมที่ต้องรับรู้
            <br />
            อย่างชัดเจนในครั้งเดียว
          </h1>
          <div className="hero-points">
            <span>กลุ่ม LINE</span>
            <span>ข้อความต้นแบบ</span>
            <span>ประวัติการส่ง</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-logo">
            <span>
              <Hospital size={26} />
            </span>
            <div>
              <strong>PPK LINE CHATBOT</strong>
              <small>LINE Messaging Center</small>
            </div>
          </div>
          <div className="login-heading">
            <h2>ยินดีต้อนรับ</h2>
            <p>เข้าสู่ระบบเพื่อจัดการและส่งประกาศ</p>
          </div>
          <label>
            ชื่อผู้ใช้
            <div className="input-wrap">
              <UserRound size={18} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>
          </label>
          <label>
            รหัสผ่าน
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button wide" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
          <p className="login-note">สำหรับบุคลากรที่ได้รับอนุญาตเท่านั้น</p>
        </form>
      </section>
    </main>
  );
}
