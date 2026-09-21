import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api/v1";
export const resolveImageUrl = (value?: string | null) => {
  if (!value) return value || "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL.replace(/\/api\/v\d+\/?$/i, "")}${value.startsWith("/") ? value : `/${value}`}`;
};
const TOKEN_KEY = "erv_mobile_token";
const ROLE_KEY = "erv_mobile_role";
let csrfToken: string | null = null;

const storage = {
  async get(key: string) {
    if (SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync()))
      return SecureStore.getItemAsync(key);
    return AsyncStorage.getItem(key);
  },
  async set(key: string, value: string) {
    if (SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync()))
      return SecureStore.setItemAsync(key, value);
    return AsyncStorage.setItem(key, value);
  },
  async remove(key: string) {
    if (SecureStore.isAvailableAsync && (await SecureStore.isAvailableAsync()))
      return SecureStore.deleteItemAsync(key);
    return AsyncStorage.removeItem(key);
  },
};

export const getSession = async () => ({
  token: await storage.get(TOKEN_KEY),
  role: await storage.get(ROLE_KEY),
});
export const clearSession = async () => {
  await storage.remove(TOKEN_KEY);
  await storage.remove(ROLE_KEY);
};

export const saveSession = async (
  token: string,
  role: "employee" | "admin",
) => {
  await storage.set(TOKEN_KEY, token);
  await storage.set(ROLE_KEY, role);
};

const getCsrfToken = async () => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`, {
    credentials: "include",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.data?.token)
    throw new Error("Unable to establish a secure connection.");
  csrfToken = body.data.token;
  return csrfToken;
};

const ensureCsrfToken = async () => csrfToken || getCsrfToken();

const request = async (
  path: string,
  options: RequestInit = {},
  token?: string | null,
) => {
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(
    (options.method || "GET").toUpperCase(),
  );
  const requestCsrfToken = isMutation ? await ensureCsrfToken() : null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestCsrfToken ? { "X-CSRF-Token": requestCsrfToken } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 403 && body.message?.includes("CSRF")) {
    csrfToken = null;
    throw new Error(
      "Unable to sign in. Please check your Employee ID and password.",
    );
  }
  if (!response.ok)
    throw new Error(
      body.message ||
        "Unable to connect. Please check your internet connection.",
    );
  return body.data ?? body;
};

const nowDevice = () => {
  const now = new Date();
  return {
    deviceDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    deviceTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
};

export const api = {
  employeeLogin: (employeeId: string, password: string) =>
    request("/employees/login", {
      method: "POST",
      body: JSON.stringify({ employeeId, password }),
    }),
  adminLogin: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe: true }),
    }),
  employeeProfile: (token: string) => request("/employees/me", {}, token),
  updateProfile: (token: string, profile: { email?: string; phone?: string }) =>
    request(
      "/employees/me/profile",
      { method: "PATCH", body: JSON.stringify(profile) },
      token,
    ),
  updatePicture: async (token: string, uri: string) => {
    const form = new FormData();
    form.append("profilePicture", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    return request(
      "/employees/me/picture",
      { method: "POST", body: form },
      token,
    );
  },
  changePassword: (
    token: string,
    currentPassword: string,
    newPassword: string,
  ) =>
    request(
      "/employees/me/password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      token,
    ),
  adminProfile: (token: string) => request("/auth/profile", {}, token),
  adminChangePassword: (token: string, currentPassword: string, newPassword: string) => request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }, token),
  attendance: (token: string) => request("/employees/me/attendance", {}, token),
  notifications: (token: string) => request("/notifications", {}, token),
  leaves: (token: string) => request("/employees/me/leave-requests", {}, token),
  payroll: (token: string) => request("/employees/me/payroll", {}, token),
  duty: (action: "start" | "logout", token: string) =>
    request(
      `/employees/me/duty/${action}`,
      { method: "POST", body: JSON.stringify(nowDevice()) },
      token,
    ),
  createLeave: (token: string, dates: string[], leaveType: "unpaid" | "paid") =>
    request(
      "/employees/me/leave-requests",
      {
        method: "POST",
        body: JSON.stringify({
          dates,
          leaveType,
          deviceDate: nowDevice().deviceDate,
        }),
      },
      token,
    ),
  cancelLeave: (token: string, id: string) =>
    request(`/employees/me/leave-requests/${id}`, { method: "DELETE" }, token),
  adminLeaves: (token: string) =>
    request("/employees/leave-requests", {}, token),
  adminEmployees: (token: string, search = "") => request(`/employees?search=${encodeURIComponent(search)}`, {}, token),
  adminCollection: (token: string, path: string) => request(path, {}, token),
  adminFestivals: (token: string) => request("/employees/festivals", {}, token),
  addFestival: (token: string, date: string, name: string) => request("/employees/festivals", { method: "POST", body: JSON.stringify({ date, name }) }, token),
  removeFestival: (token: string, id: string) => request(`/employees/festivals/${id}`, { method: "DELETE" }, token),
  deleteLeaveHistory: (token: string, id: string) => request(`/employees/leave-requests/${id}/history`, { method: "DELETE" }, token),
  deleteAllLeaveHistory: (token: string) => request("/employees/leave-requests/history/all", { method: "DELETE" }, token),
  decideLeave: (token: string, id: string, status: "Approved" | "Rejected") =>
    request(
      `/employees/leave-requests/dates/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),
  decideAll: (token: string, id: string, status: "Approved" | "Rejected") =>
    request(
      `/employees/leave-requests/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),
  markLeaveRead: (token: string) =>
    request(
      "/notifications/leave-requests/mark-read",
      { method: "POST" },
      token,
    ),
};

export { nowDevice };
