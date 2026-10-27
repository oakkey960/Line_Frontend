"use client";
import { useEffect, useState } from "react";
import { Edit3, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { api, MessageTemplate } from "@/lib/api";
const blank = { name: "", content: "", status: "active" as const };
export default function TemplatesPage() {
  const [items, setItems] = useState<MessageTemplate[]>([]),
    [search, setSearch] = useState(""),
    [form, setForm] = useState<{
      id?: number;
      name: string;
      content: string;
      status: "active" | "inactive";
    } | null>(null),
    [error, setError] = useState("");
  const load = () =>
    api<{ data: MessageTemplate[] }>("/templates")
      .then((r) => setItems(r.data))
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function save() {
    if (!form) return;
    try {
      if (form.id)
        await api(`/templates/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      else
        await api("/templates", { method: "POST", body: JSON.stringify(form) });
      setForm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ผิดพลาด");
    }
  }
  async function remove(id: number) {
    if (!confirm("ปิดใช้งานข้อความต้นแบบนี้หรือไม่")) return;
    try {
      await api(`/templates/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ปิดใช้งานไม่สำเร็จ");
    }
  }
  async function restore(id: number) {
    try {
      await api(`/templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active" }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปิดใช้งานไม่สำเร็จ");
    }
  }
  return (
    <>
      <header className="page-header action-header">
        <div>
          <p className="eyebrow">เนื้อหาที่ใช้บ่อย</p>
          <h1>ข้อความต้นแบบ</h1>
          <p>เตรียมข้อความไว้ใช้ซ้ำและแก้ไขก่อนส่งได้</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setForm({ ...blank })}
        >
          <Plus size={18} />
          เพิ่มข้อความต้นแบบ
        </button>
      </header>
      <section className="panel">
        <div className="toolbar">
          <div className="search-box grow">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาข้อความต้นแบบ…"
            />
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="template-grid">
          {items
            .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
            .map((item) => (
              <article className="template-card" key={item.id}>
                <div>
                  <span className={`status ${item.status}`}>
                    {item.status === "active" ? "ใช้งาน" : "ปิดใช้"}
                  </span>
                  <h2>{item.name}</h2>
                  <p>{item.content}</p>
                </div>
                <div className="card-actions">
                  <button onClick={() => setForm({ ...item })}>
                    <Edit3 size={17} />
                    แก้ไข
                  </button>
                  {item.status === "active" ? (
                    <button
                      className="danger-link"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 size={17} />
                      ปิดใช้
                    </button>
                  ) : (
                    <button onClick={() => restore(item.id)}>
                      <RotateCcw size={17} />
                      เปิดใช้งาน
                    </button>
                  )}
                </div>
              </article>
            ))}
        </div>
      </section>
      {form && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div>
                <h2>{form.id ? "แก้ไข" : "เพิ่ม"}ข้อความต้นแบบ</h2>
                <p>ข้อความยังแก้ไขได้อีกครั้งในหน้าสร้างประกาศ</p>
              </div>
              <button className="icon-button" onClick={() => setForm(null)}>
                <X />
              </button>
            </div>
            <label className="field">
              <span>ชื่อข้อความต้นแบบ</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>ข้อความ</span>
              <textarea
                rows={7}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setForm(null)}
              >
                ยกเลิก
              </button>
              <button
                className="primary-button"
                disabled={!form.name.trim() || !form.content.trim()}
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
