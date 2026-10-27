"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  ImagePlus,
  LoaderCircle,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { api, LineGroup, MessageTemplate, uploadImage } from "@/lib/api";
import RoundedSelect from "@/components/rounded-select";

export default function ComposePage() {
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState(false);
  const [image, setImage] = useState<{
    id: number;
    name: string;
    preview: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    successCount: number;
    failureCount: number;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api<{ data: LineGroup[] }>("/line/groups"),
      api<{ data: MessageTemplate[] }>("/templates"),
    ])
      .then(([g, t]) => {
        setGroups(g.data.filter((x) => x.status === "active" && x.enabled));
        setTemplates(t.data.filter((x) => x.status === "active"));
      })
      .catch((e) => setError(e.message));
  }, []);
  const categories = useMemo(
    () =>
      [
        ...new Set(groups.map((g) => g.category).filter(Boolean) as string[]),
      ].sort((a, b) => a.localeCompare(b, "th")),
    [groups],
  );
  const visible = useMemo(
    () =>
      groups.filter(
        (g) =>
          (!category || g.category === category) &&
          (g.internalName || g.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [category, groups, search],
  );
  const toggle = (id: number) =>
    setSelected((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  async function send() {
    if (!message.trim()) {
      setError("กรุณากรอกข้อความก่อนส่ง");
      setPreview(false);
      return;
    }
    if (selected.length === 0) {
      setError("กรุณาเลือกกลุ่มเป้าหมายอย่างน้อย 1 กลุ่มก่อนส่ง");
      setPreview(false);
      return;
    }
    setSending(true);
    setError("");
    try {
      const r = await api<{
        data: {
          broadcast: {
            status: string;
            successCount: number;
            failureCount: number;
          };
        };
      }>("/broadcasts", {
        method: "POST",
        body: JSON.stringify({
          message,
          groupIds: selected,
          imageId: image?.id ?? null,
        }),
      });
      setResult(r.data.broadcast);
      setPreview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }
  function openPreview() {
    if (!message.trim()) return setError("กรุณากรอกข้อความก่อนดูตัวอย่าง");
    if (selected.length === 0)
      return setError("กรุณาเลือกกลุ่มเป้าหมายอย่างน้อย 1 กลุ่ม");
    setError("");
    setPreview(true);
  }
  async function chooseImage(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ JPEG และ PNG");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("รูปต้องมีขนาดไม่เกิน 1 MB");
      return;
    }
    setUploading(true);
    try {
      const response = await uploadImage(file);
      setImage({
        id: response.data.id,
        name: response.data.originalName,
        preview: URL.createObjectURL(file),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="compose-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">ข้อความใหม่</p>
          <h1>สร้างประกาศ</h1>
          <p>เลือกข้อความ ตรวจรายชื่อกลุ่ม แล้วส่งได้ทันที</p>
        </div>
      </header>
      <div className="compose-grid">
        <section className="panel compose-form">
          <div className="field-row">
            <label className="field">
              <span>ข้อความต้นแบบ</span>
              <RoundedSelect
                value={templateId}
                ariaLabel="เลือกข้อความต้นแบบ"
                onChange={(value) => {
                  setTemplateId(value);
                  const t = templates.find((x) => x.id === Number(value));
                  if (t) setMessage(t.content);
                }}
                options={[
                  { value: "", label: "เริ่มเขียนข้อความใหม่" },
                  ...templates.map((template) => ({
                    value: String(template.id),
                    label: template.name,
                  })),
                ]}
              />
            </label>
          </div>
          <label className="field">
            <span>
              ข้อความ <em>จำเป็น</em>
            </span>
            <textarea
              value={message}
              maxLength={5000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="พิมพ์รายละเอียดประกาศที่นี่…"
              rows={9}
            />
            <small>
              {message.length.toLocaleString("th-TH")} / 5,000 ตัวอักษร
            </small>
          </label>
          <div className="field">
            <span>
              รูปภาพ{" "}
              <em className="optional">ไม่บังคับ · JPEG/PNG ไม่เกิน 1 MB</em>
            </span>
            {image ? (
              <div className="image-uploaded">
                <Image
                  src={image.preview}
                  alt="ตัวอย่างรูปที่แนบ"
                  width={172}
                  height={136}
                  unoptimized
                />
                <div>
                  <strong>{image.name}</strong>
                  <small>บันทึกในระบบแล้ว</small>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setImage(null)}
                  aria-label="ลบรูป"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <label className="image-drop">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => void chooseImage(e.target.files?.[0])}
                />
                {uploading ? <LoaderCircle className="spin" /> : <ImagePlus />}
                <strong>{uploading ? "กำลังอัปโหลด…" : "เพิ่มรูปภาพ"}</strong>
                <small>คลิกเพื่อเลือกไฟล์จากเครื่อง</small>
              </label>
            )}
          </div>
          <div className="privacy-note">
            <AlertTriangle size={18} />
            <span>
              หลีกเลี่ยงชื่อผู้ป่วย HN ผลตรวจ หรือข้อมูลการรักษาในข้อความ
            </span>
          </div>
        </section>
        <section className="panel recipients">
          <div className="panel-title">
            <div>
              <h2>เลือกกลุ่ม LINE</h2>
              <p>เลือกอย่างน้อย 1 กลุ่ม</p>
            </div>
            <span className="count-badge">{selected.length} กลุ่ม</span>
          </div>
          <div className="recipient-filters">
            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อกลุ่ม…"
              />
            </div>
            <RoundedSelect
              value={category}
              onChange={setCategory}
              ariaLabel="กรองตามหมวด"
              options={[
                { value: "", label: "ทุกหมวด" },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
            />
          </div>
          <label className="select-all">
            <input
              type="checkbox"
              checked={
                visible.length > 0 &&
                visible.every((g) => selected.includes(g.id))
              }
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...new Set([...selected, ...visible.map((g) => g.id)])]
                    : selected.filter(
                        (id) => !visible.some((g) => g.id === id),
                      ),
                )
              }
            />{" "}
            เลือกทั้งหมดที่แสดง
          </label>
          <div className="group-picker">
            {visible.map((g) => (
              <button
                type="button"
                key={g.id}
                className={`group-option ${selected.includes(g.id) ? "selected" : ""}`}
                onClick={() => toggle(g.id)}
              >
                <span className="group-avatar">
                  {(g.internalName || g.name || "G").slice(0, 1)}
                </span>
                <span>
                  <strong>{g.internalName || g.name || "ไม่ทราบชื่อ"}</strong>
                  <small>{g.category || "ยังไม่กำหนดหมวด"}</small>
                </span>
                <span className="check-mark">
                  {selected.includes(g.id) && <Check size={15} />}
                </span>
              </button>
            ))}
            {visible.length === 0 && (
              <div className="empty-state">ไม่พบกลุ่มที่ค้นหา</div>
            )}
          </div>
        </section>
      </div>
      {error && <div className="alert error">{error}</div>}
      {result && (
        <div className="alert success">
          <CheckCircle2 size={19} />
          ส่งเสร็จแล้ว สำเร็จ {result.successCount} กลุ่ม ล้มเหลว{" "}
          {result.failureCount} กลุ่ม
        </div>
      )}
      <footer className="sticky-actions">
        <span>
          พร้อมส่งไปยัง <strong>{selected.length}</strong> กลุ่ม
        </span>
        <div>
          <button
            className="secondary-button"
            disabled={!message.trim() || selected.length === 0}
            onClick={openPreview}
          >
            <Eye size={18} /> ดูตัวอย่าง
          </button>
          <button
            className="primary-button"
            disabled={!message.trim() || selected.length === 0}
            onClick={openPreview}
          >
            <Send size={18} /> ตรวจสอบและส่ง
          </button>
        </div>
      </footer>
      {preview && (
        <div className="modal-backdrop">
          <div className="modal preview-modal">
            <div className="modal-head">
              <div>
                <h2>ตรวจสอบก่อนส่ง</h2>
                <p>ข้อความจะถูกส่งทันทีหลังยืนยัน</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setPreview(false)}
                aria-label="ปิด"
              >
                <X />
              </button>
            </div>
            <div className="phone-preview">
              <div className="phone-bar">Hospital Broadcast</div>
              <div className="chat-area">
                {image && (
                  <Image
                    className="chat-image"
                    src={image.preview}
                    alt="รูปที่จะแนบ"
                    width={540}
                    height={380}
                    unoptimized
                  />
                )}
                <div className="chat-bubble">{message}</div>
                <small>ขณะนี้</small>
              </div>
            </div>
            <div className="preview-groups">
              <strong>กลุ่มเป้าหมาย ({selected.length})</strong>
              <div>
                {groups
                  .filter((g) => selected.includes(g.id))
                  .map((g) => (
                    <span key={g.id}>{g.internalName || g.name}</span>
                  ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setPreview(false)}
              >
                กลับไปแก้ไข
              </button>
              <button
                className="primary-button"
                onClick={send}
                disabled={sending || !message.trim() || selected.length === 0}
              >
                {sending ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Send size={18} />
                )}{" "}
                {sending ? "กำลังส่ง…" : "ยืนยันส่ง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
