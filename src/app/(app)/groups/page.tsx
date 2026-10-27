"use client";
import { useEffect, useMemo, useState } from "react";
import { Edit3, MessageCircleMore, RefreshCw, Search, X } from "lucide-react";
import { api, LineGroup } from "@/lib/api";
import RoundedSelect from "@/components/rounded-select";
export default function GroupsPage() {
  const [groups, setGroups] = useState<LineGroup[]>([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [editing, setEditing] = useState<LineGroup | null>(null),
    [error, setError] = useState("");
  const load = () =>
    api<{ data: LineGroup[] }>("/line/groups")
      .then((r) => setGroups(r.data))
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function save() {
    if (!editing) return;
    const r = await api<{ data: LineGroup }>(`/line/groups/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        internalName: editing.internalName,
        category: editing.category,
        enabled: editing.enabled,
      }),
    });
    setGroups((v) => v.map((x) => (x.id === r.data.id ? r.data : x)));
    setEditing(null);
  }
  async function test(id: number) {
    try {
      await api(`/line/groups/${id}/test`, { method: "POST" });
      alert("ส่งข้อความทดสอบแล้ว");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ผิดพลาด");
    }
  }
  const categories = useMemo(
    () =>
      [
        ...new Set(groups.map((g) => g.category).filter(Boolean) as string[]),
      ].sort((a, b) => a.localeCompare(b, "th")),
    [groups],
  );
  const rows = groups.filter(
    (g) =>
      (!category || g.category === category) &&
      (g.internalName || g.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="page-header action-header">
        <div>
          <p className="eyebrow">ปลายทาง</p>
          <h1>กลุ่ม LINE</h1>
          <p>รายชื่อกลุ่มที่เชื่อมต่อกับบอท</p>
        </div>
        <button className="secondary-button" onClick={load}>
          <RefreshCw size={17} />
          รีเฟรช
        </button>
      </header>
      <section className="panel">
        <div className="toolbar">
          <div className="search-box grow">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหากลุ่ม…"
            />
          </div>
          <div className="toolbar-category">
            <RoundedSelect
              value={category}
              onChange={setCategory}
              ariaLabel="กรองกลุ่มตามหมวด"
              options={[
                { value: "", label: "ทุกหมวด" },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
            />
          </div>
          <span className="summary-text">ทั้งหมด {groups.length} กลุ่ม</span>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>ชื่อกลุ่ม</th>
                <th>หมวด</th>
                <th>สถานะ</th>
                <th>พบล่าสุด</th>
                <th>เปิดใช้</th>
                <th className="group-action-heading">ทดสอบ</th>
                <th className="group-action-heading">แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="name-cell">
                      <span className="group-avatar small">
                        {(g.internalName || g.name || "G")[0]}
                      </span>
                      <div>
                        <strong>{g.internalName || g.name}</strong>
                        <small>{g.name}</small>
                      </div>
                    </div>
                  </td>
                  <td>{g.category || "—"}</td>
                  <td>
                    <span className={`status ${g.status}`}>
                      {g.status === "active" ? "เชื่อมต่อ" : "ออกจากกลุ่ม"}
                    </span>
                  </td>
                  <td>
                    {new Date(g.lastSeenAt).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>{g.enabled ? "ใช้งาน" : "ปิดใช้"}</td>
                  <td className="group-action-cell">
                    <button
                      className="icon-button table-action-icon"
                      onClick={() => test(g.id)}
                      aria-label="ส่งข้อความทดสอบ"
                      title="ส่งข้อความทดสอบเข้ากลุ่มนี้"
                    >
                      <MessageCircleMore size={18} />
                    </button>
                  </td>
                  <td className="group-action-cell">
                    <button
                      className="icon-button table-action-icon"
                      onClick={() => setEditing({ ...g })}
                      aria-label="แก้ไข"
                      title="แก้ไขชื่อ หมวด และสถานะกลุ่ม"
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
      {editing && (
        <div className="modal-backdrop">
          <div className="modal compact">
            <div className="modal-head">
              <h2>แก้ไขกลุ่ม</h2>
              <button className="icon-button" onClick={() => setEditing(null)}>
                <X />
              </button>
            </div>
            <label className="field">
              <span>ชื่อที่แสดง</span>
              <input
                value={editing.internalName || ""}
                onChange={(e) =>
                  setEditing({ ...editing, internalName: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>หมวด</span>
              <input
                value={editing.category || ""}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              />
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) =>
                  setEditing({ ...editing, enabled: e.target.checked })
                }
              />{" "}
              เปิดให้เลือกตอนส่งประกาศ
            </label>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setEditing(null)}
              >
                ยกเลิก
              </button>
              <button className="primary-button" onClick={save}>
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
