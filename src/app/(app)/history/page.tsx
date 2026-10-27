"use client";
import { useEffect, useState } from "react";
import { ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { api, Broadcast } from "@/lib/api";
type Detail = {
  broadcast: Broadcast;
  recipients: Array<{
    id: number;
    status: string;
    errorMessage: string | null;
    attemptCount: number;
    group: { name: string | null; internalName: string | null } | null;
  }>;
  sender: { displayName: string } | null;
};
export default function HistoryPage() {
  const [items, setItems] = useState<Broadcast[]>([]),
    [search, setSearch] = useState(""),
    [detail, setDetail] = useState<Detail | null>(null),
    [error, setError] = useState("");
  const load = () =>
    api<{ data: Broadcast[] }>("/broadcasts?limit=100")
      .then((r) => setItems(r.data))
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function open(id: number) {
    const r = await api<{ data: Detail }>(`/broadcasts/${id}`);
    setDetail(r.data);
  }
  async function retry() {
    if (!detail) return;
    await api(`/broadcasts/${detail.broadcast.id}/retry`, { method: "POST" });
    const r = await api<{ data: Detail }>(`/broadcasts/${detail.broadcast.id}`);
    setDetail(r.data);
    load();
  }
  const rows = items.filter((i) =>
    i.message.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">ตรวจสอบย้อนหลัง</p>
          <h1>ประวัติการส่ง</h1>
          <p>ดูผลสำเร็จและข้อผิดพลาดแยกรายกลุ่ม</p>
        </div>
      </header>
      <section className="panel">
        <div className="toolbar">
          <div className="search-box grow">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาจากข้อความ…"
            />
          </div>
          <span className="summary-text">{items.length} รายการ</span>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>วันและเวลา</th>
                <th>ข้อความ</th>
                <th>กลุ่ม</th>
                <th>สำเร็จ</th>
                <th>ล้มเหลว</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className="nowrap">
                    {new Date(item.createdAt).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <p className="message-cell">{item.message}</p>
                  </td>
                  <td>{item.totalGroups}</td>
                  <td className="success-number">{item.successCount}</td>
                  <td className="danger-number">{item.failureCount}</td>
                  <td>
                    <span className={`status ${item.status}`}>
                      {item.status === "completed"
                        ? "สำเร็จ"
                        : item.status === "partial"
                          ? "บางส่วน"
                          : "ล้มเหลว"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="table-link"
                      onClick={() => open(item.id)}
                    >
                      รายละเอียด <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="empty-state">ยังไม่มีประวัติการส่ง</div>
        )}
      </section>
      {detail && (
        <div className="modal-backdrop">
          <div className="modal detail-modal">
            <div className="modal-head">
              <div>
                <h2>รายละเอียดการส่ง #{detail.broadcast.id}</h2>
                <p>
                  {new Date(detail.broadcast.createdAt).toLocaleString(
                    "th-TH",
                    { dateStyle: "long", timeStyle: "short" },
                  )}
                </p>
              </div>
              <button className="icon-button" onClick={() => setDetail(null)}>
                <X />
              </button>
            </div>
            <div className="detail-meta">
              <span>ผู้ส่ง</span>
              <strong>
                {detail.sender?.displayName || "ไม่พบข้อมูลผู้ส่ง"}
              </strong>
            </div>
            <div className="message-preview">
              <small>ข้อความ</small>
              <p>{detail.broadcast.message}</p>
            </div>
            <div className="result-summary">
              <div>
                <strong>{detail.broadcast.totalGroups}</strong>
                <small>กลุ่มทั้งหมด</small>
              </div>
              <div className="green">
                <strong>{detail.broadcast.successCount}</strong>
                <small>สำเร็จ</small>
              </div>
              <div className="red">
                <strong>{detail.broadcast.failureCount}</strong>
                <small>ล้มเหลว</small>
              </div>
            </div>
            <div className="recipient-list">
              {detail.recipients.map((r) => (
                <div key={r.id}>
                  <span className="group-avatar small">
                    {(r.group?.internalName || r.group?.name || "G")[0]}
                  </span>
                  <span>
                    <strong>
                      {r.group?.internalName || r.group?.name || "ไม่พบกลุ่ม"}
                    </strong>
                    {r.errorMessage && <small>{r.errorMessage}</small>}
                  </span>
                  <span className={`status ${r.status}`}>
                    {r.status === "sent" ? "สำเร็จ" : "ล้มเหลว"}
                  </span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setDetail(null)}
              >
                ปิด
              </button>
              {detail.broadcast.failureCount > 0 && (
                <button className="primary-button" onClick={retry}>
                  <RefreshCw size={17} />
                  ส่งซ้ำเฉพาะที่ล้มเหลว
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
