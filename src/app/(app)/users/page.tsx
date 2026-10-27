"use client";
import { useEffect, useState } from "react";
import { Edit3, Eye, EyeOff, Plus, Search, X } from "lucide-react";
import { api, User } from "@/lib/api";
type UserForm = {
  id?: number;
  username: string;
  password: string;
  displayName: string;
  department: string;
  role: "admin" | "sender";
  status: "active" | "inactive";
};
const blank: UserForm = {
  username: "",
  password: "",
  displayName: "",
  department: "",
  role: "sender",
  status: "active",
};
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]),
    [search, setSearch] = useState(""),
    [form, setForm] = useState<UserForm | null>(null),
    [formError, setFormError] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [error, setError] = useState("");
  const load = () =>
    api<{ data: User[] }>("/admin/users")
      .then((r) => setUsers(r.data))
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function save() {
    if (!form) return;
    const username = form.username.trim();
    const displayName = form.displayName.trim();
    if (!displayName) return setFormError("กรุณากรอกชื่อที่แสดง");
    if (!form.id && username.length < 3)
      return setFormError("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร");
    if (!form.id && !/^[A-Za-z0-9._-]+$/.test(username))
      return setFormError(
        "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง",
      );
    if ((!form.id || form.password) && form.password.length < 8)
      return setFormError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    setFormError("");
    try {
      if (form.id) {
        const body = {
          displayName: form.displayName,
          department: form.department || null,
          role: form.role,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        };
        await api(`/admin/users/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else
        await api("/admin/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
      setForm(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "บันทึกผู้ใช้งานไม่สำเร็จ");
    }
  }
  function openForm(next: UserForm) {
    setForm(next);
    setFormError("");
    setShowPassword(false);
  }
  return (
    <>
      <header className="page-header action-header">
        <div>
          <p className="eyebrow">สิทธิ์การใช้งาน</p>
          <h1>ผู้ใช้งาน</h1>
          <p>จัดการบัญชีผู้ดูแลและผู้ส่งข้อความ</p>
        </div>
        <button
          className="primary-button"
          onClick={() => openForm({ ...blank })}
        >
          <Plus size={18} />
          เพิ่มผู้ใช้งาน
        </button>
      </header>
      <section className="panel">
        <div className="toolbar">
          <div className="search-box grow">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือหน่วยงาน…"
            />
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>ผู้ใช้งาน</th>
                <th>หน่วยงาน</th>
                <th>บทบาท</th>
                <th>สถานะ</th>
                <th>เข้าใช้ล่าสุด</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) =>
                  (u.displayName + u.username + (u.department || ""))
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="name-cell">
                        <span className="avatar small">{u.displayName[0]}</span>
                        <div>
                          <strong>{u.displayName}</strong>
                          <small>@{u.username}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.department || "—"}</td>
                    <td>
                      {u.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ส่งข้อความ"}
                    </td>
                    <td>
                      <span className={`status ${u.status}`}>
                        {u.status === "active" ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td>
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "ยังไม่เคย"}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() =>
                          openForm({
                            id: u.id,
                            username: u.username,
                            password: "",
                            displayName: u.displayName,
                            department: u.department || "",
                            role: u.role,
                            status: u.status,
                          })
                        }
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {form && (
        <div className="modal-backdrop">
          <div className="modal compact">
            <div className="modal-head">
              <h2>{form.id ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}</h2>
              <button className="icon-button" onClick={() => setForm(null)}>
                <X />
              </button>
            </div>
            <div className="two-fields">
              <label className="field">
                <span>ชื่อผู้ใช้</span>
                <input
                  disabled={!!form.id}
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>ชื่อที่แสดง</span>
                <input
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                />
              </label>
            </div>
            <label className="field">
              <span>หน่วยงาน</span>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </label>
            <div className="two-fields">
              <label className="field">
                <span>บทบาท</span>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as "admin" | "sender",
                    })
                  }
                >
                  <option value="sender">ผู้ส่งข้อความ</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </label>
              <label className="field">
                <span>สถานะ</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>
                {form.id ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}
              </span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setFormError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {formError && <div className="alert error">{formError}</div>}
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setForm(null)}
              >
                ยกเลิก
              </button>
              <button
                className="primary-button"
                disabled={
                  !form.displayName ||
                  (!form.id && (!form.username || form.password.length < 8))
                }
                onClick={save}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
