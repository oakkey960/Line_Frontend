export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
export type User = {
  id: number;
  username: string;
  displayName: string;
  department: string | null;
  role: "admin" | "sender";
  status: "active" | "inactive";
  lastLoginAt: string | null;
};
export type LineGroup = {
  id: number;
  groupId: string;
  name: string | null;
  internalName: string | null;
  category: string | null;
  pictureUrl: string | null;
  memberCount: number | null;
  status: "active" | "inactive";
  enabled: boolean;
  lastSeenAt: string;
};
export type MessageTemplate = {
  id: number;
  name: string;
  content: string;
  status: "active" | "inactive";
  createdBy: number;
  updatedAt: string;
};
export type Broadcast = {
  id: number;
  message: string;
  status: "sending" | "completed" | "partial" | "failed";
  totalGroups: number;
  successCount: number;
  failureCount: number;
  sentBy: number;
  sentAt: string | null;
  createdAt: string;
};
export function getToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("linebot_token");
}
export function setToken(token: string) {
  localStorage.setItem("linebot_token", token);
}
export function clearToken() {
  localStorage.removeItem("linebot_token");
  localStorage.removeItem("linebot_user");
}
export function saveUser(user: User) {
  localStorage.setItem("linebot_user", JSON.stringify(user));
}
export function getSavedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("linebot_user") || "null");
  } catch {
    return null;
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearToken();
      // This shared helper runs outside a React component and can't use useRouter.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    const fieldErrors = body?.error?.fieldErrors;
    const firstFieldError =
      fieldErrors && typeof fieldErrors === "object"
        ? Object.values(fieldErrors)
            .flat()
            .find((value) => typeof value === "string")
        : null;
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : typeof firstFieldError === "string"
          ? firstFieldError
          : "ไม่สามารถดำเนินการได้",
    );
  }
  return body as T;
}

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const response = await fetch(`${API_URL}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      typeof body.error === "string" ? body.error : "อัปโหลดรูปไม่สำเร็จ",
    );
  return body as {
    success: true;
    data: {
      id: number;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      url: string;
    };
  };
}
