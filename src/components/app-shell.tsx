"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellRing,
  FileClock,
  Hospital,
  LogOut,
  Menu,
  MessageSquareText,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, clearToken, getToken, saveUser, User } from "@/lib/api";
const nav = [
  { href: "/compose", label: "สร้างประกาศ", icon: BellRing },
  { href: "/groups", label: "กลุ่ม LINE", icon: UsersRound },
  { href: "/templates", label: "ข้อความต้นแบบ", icon: MessageSquareText },
  { href: "/history", label: "ประวัติการส่ง", icon: FileClock },
  { href: "/users", label: "ผู้ใช้งาน", icon: UserCog, admin: true },
];
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<{ success: true; user: User }>("/me")
      .then((r) => {
        setUser(r.user);
        saveUser(r.user);
      })
      .catch(() => {});
  }, [router]);
  const items = nav.filter((item) => !item.admin || user?.role === "admin");
  const logout = () => {
    clearToken();
    router.replace("/login");
  };
  return (
    <div className="app-frame">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Hospital size={22} />
          </span>
          <span>
            <strong>PPK LINE CHATBOT</strong>
            <small>LINE Messaging Center</small>
          </span>
          <button
            className="icon-button sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="ปิดเมนู"
          >
            <X />
          </button>
        </div>
        <nav className="side-nav">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={pathname === href ? "active" : ""}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user?.displayName?.slice(0, 1) || "A"}</div>
          <div>
            <strong>{user?.displayName || "กำลังโหลด"}</strong>
            <small>
              {user?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ส่งข้อความ"}
            </small>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            aria-label="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label="ปิดเมนู"
        />
      )}
      <div className="app-main">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu />
          </button>
          <div className="mobile-brand">
            <Hospital size={20} /> PPK LINE CHATBOT
          </div>
          <div className="avatar small">
            {user?.displayName?.slice(0, 1) || "A"}
          </div>
        </header>
        <main
          className={`page-container ${pathname === "/compose" ? "compose-container" : ""}`}
        >
          {children}
        </main>
        <nav className="bottom-nav">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
            >
              <Icon size={20} />
              <span>
                {label === "ข้อความต้นแบบ"
                  ? "ต้นแบบ"
                  : label === "ประวัติการส่ง"
                    ? "ประวัติ"
                    : label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
