import type { Member, MembershipPlan, Notification, User, Payment, PaymentMethod } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("bp_token");
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("bp_token", token);
  } else {
    localStorage.removeItem("bp_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Unauthorized: clear token
      setAuthToken(null);
      throw new Error("Session expired. Please login again.");
    }

    if (!res.ok) {
      let errorMsg = `Server returned status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.title || JSON.stringify(errorData);
      } catch {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Cannot connect to server. Please check your network connection.");
    }
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    getSystemStatus: () =>
      request<{ needsSetup: boolean; userCount: number; gymName: string }>("/auth/system-status"),
    setupInitialAdmin: (data: {
      fullName: string;
      email: string;
      mobile: string;
      password: string;
      gymName?: string;
      phone?: string;
      address?: string;
    }) =>
      request<{ token: string; user: User; expiresAt: string }>("/auth/setup-admin", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (email: string, password: string) =>
      request<{ token: string; user: User; expiresAt: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/auth/me"),
  },

  // Dashboard
  dashboard: {
    admin: () => request<any>("/dashboard/admin"),
    manager: () => request<any>("/dashboard/manager"),
  },

  // Members
  members: {
    getAll: (search?: string, status?: string) => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status && status !== "all") params.append("status", status);
      const q = params.toString() ? `?${params.toString()}` : "";
      return request<Member[]>(`/members${q}`);
    },
    getById: (id: string) => request<Member>(`/members/${id}`),
    create: (data: {
      name: string;
      mobile: string;
      email?: string;
      dob?: string;
      gender?: string;
      address?: string;
      photoUrl?: string;
      planId: string;
      startDate: string;
      amountPaid: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) =>
      request<Member>("/members", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: {
      name: string;
      mobile: string;
      email?: string;
      dob?: string;
      gender?: string;
      address?: string;
    }) =>
      request<Member>(`/members/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    uploadPhoto: (id: string, base64Image: string) =>
      request<{ photoUrl: string }>(`/members/${id}/photo`, {
        method: "POST",
        body: JSON.stringify({ base64Image }),
      }),
    deletePhoto: (id: string) =>
      request<{ message: string }>(`/members/${id}/photo`, {
        method: "DELETE",
      }),
    moveToInactive: (id: string) =>
      request<{ message: string }>(`/members/${id}/move-inactive`, {
        method: "POST",
      }),
    reactivate: (id: string) =>
      request<{ message: string }>(`/members/${id}/reactivate`, {
        method: "POST",
      }),
  },

  // Memberships & Renewals
  memberships: {
    renew: (memberId: string, data: {
      planId: string;
      startDate?: string;
      amountPaid: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) =>
      request<{ message: string; expiryDate: string; planName: string; amountPaid: number }>(
        `/memberships/member/${memberId}/renew`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
  },

  // Plans
  plans: {
    getAll: () => request<MembershipPlan[]>("/membership-plans"),
    create: (data: { name: string; duration: number; price: number; description?: string }) =>
      request<MembershipPlan>("/membership-plans", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name: string; duration: number; price: number; description?: string }) =>
      request<MembershipPlan>(`/membership-plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleStatus: (id: string) =>
      request<{ active: boolean }>(`/membership-plans/${id}/toggle-status`, {
        method: "POST",
      }),
  },

  // Payments
  payments: {
    getAll: (period?: string, search?: string) => {
      const params = new URLSearchParams();
      if (period) params.append("period", period);
      if (search) params.append("search", search);
      const q = params.toString() ? `?${params.toString()}` : "";
      return request<Payment[]>(`/payments${q}`);
    },
    record: (data: {
      memberId: string;
      membershipId?: string;
      amount: number;
      paymentDate?: string;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) =>
      request<Payment>("/payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getSummary: () =>
      request<{ todayTotal: number; thisMonthTotal: number; totalPending: number; totalTransactions: number }>(
        "/payments/summary"
      ),
  },

  // Notifications
  notifications: {
    getAll: (type?: string) => {
      const q = type && type !== "all" ? `?type=${type}` : "";
      return request<Notification[]>(`/notifications${q}`);
    },
    markRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, {
        method: "PUT",
      }),
    markAllRead: () =>
      request<{ markedCount: number }>("/notifications/read-all", {
        method: "PUT",
      }),
    triggerReminders: () =>
      request<{ message: string; notificationsCreated: number }>("/notifications/trigger-reminders", {
        method: "POST",
      }),
  },

  // Users
  users: {
    getAll: () => request<User[]>("/users"),
    create: (data: { fullName: string; email: string; mobile: string; roleId?: string; role?: string; password?: string }) =>
      request<User>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { fullName: string; email: string; mobile: string; roleId?: string; role?: string }) =>
      request<User>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleStatus: (id: string) =>
      request<{ success: boolean }>(`/users/${id}/toggle-status`, {
        method: "POST",
      }),
  },

  // Settings
  settings: {
    get: () =>
      request<{
        name: string;
        phone: string;
        address: string;
        logoUrl?: string;
        reminderDays: number[];
        inactiveAfterMonths: number;
      }>("/settings"),
    update: (data: {
      name: string;
      phone?: string;
      address?: string;
      reminderDays?: number[];
      inactiveAfterMonths: number;
    }) =>
      request<{
        name: string;
        phone: string;
        address: string;
        reminderDays: number[];
        inactiveAfterMonths: number;
      }>("/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};
