export type Role = "admin" | "manager";
export type MemberStatus = "active" | "expiring" | "expired" | "inactive" | "pending";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type PaymentMethod = "cash" | "upi" | "card" | "other";
export type PlanDuration = 1 | 3 | 6 | 12 | number;

export interface User {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  mobile: string;
  role: Role;
  roleId?: string;
  avatar?: string;
  avatarUrl?: string;
  active: boolean;
  isActive?: boolean;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: PlanDuration;
  price: number;
  description?: string;
  active: boolean;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName?: string;
  memberRefId?: string;
  membershipId?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes?: string;
  status: "paid" | "partial" | "refunded";
  recordedBy?: string;
}

export interface Member {
  id: string;
  memberId: string;
  name: string;
  mobile: string;
  email?: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  avatar?: string;
  planId: string;
  planName?: string;
  startDate: string;
  expiryDate: string;
  totalFee: number;
  amountPaid: number;
  pendingFee?: number;
  memberStatus: MemberStatus;
  paymentStatus: PaymentStatus;
  inactiveSince?: string;
  unpaidMonths: number;
  joinedOn: string;
  payments: Payment[];
}

export interface Notification {
  id: string;
  type: "expiry" | "payment" | "unpaid" | "inactive" | "system";
  memberId?: string;
  memberName?: string;
  title?: string;
  message: string;
  read: boolean;
  readAt?: string;
  date: string;
  priority: "high" | "medium" | "low";
}

export interface GymSettings {
  name: string;
  phone: string;
  address: string;
  logoUrl?: string;
  reminderDays: number[];
  inactiveAfterMonths: number;
}

export type Screen =
  | "splash"
  | "login"
  | "admin-dashboard"
  | "manager-dashboard"
  | "members"
  | "member-profile"
  | "add-member"
  | "edit-member"
  | "renew-membership"
  | "payments"
  | "notifications"
  | "plans"
  | "user-management"
  | "settings"
  | "reminder-settings"
  | "inactive-members";
