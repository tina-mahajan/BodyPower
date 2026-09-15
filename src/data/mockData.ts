import type { User, Member, MembershipPlan, Notification } from "../types";

export const USERS: User[] = [
  { id: "u1", name: "Deepak Kulkarni", email: "admin@bodypowergym.in", mobile: "9999900001", role: "admin", active: true },
  { id: "u2", name: "Sunita Rao", email: "admin2@bodypowergym.in", mobile: "9999900002", role: "admin", active: true },
  { id: "u3", name: "Ravi Sharma", email: "manager@bodypowergym.in", mobile: "9999900003", role: "manager", active: true },
];

export const PLANS: MembershipPlan[] = [
  { id: "p1", name: "Monthly", duration: 1, price: 1500, description: "1 month gym access", active: true },
  { id: "p2", name: "Quarterly", duration: 3, price: 4000, description: "3 months gym access", active: true },
  { id: "p3", name: "Half-Yearly", duration: 6, price: 7000, description: "6 months gym access", active: true },
  { id: "p4", name: "Yearly", duration: 12, price: 12000, description: "12 months gym access + locker", active: true },
];

// Today = 2026-09-10
export const MEMBERS: Member[] = [
  {
    id: "m1", memberId: "BP-000124", name: "Rahul Patil", mobile: "9876543210",
    email: "rahul.patil@gmail.com", dob: "1995-03-15", gender: "male",
    address: "12, Shivaji Nagar, Pune - 411005",
    planId: "p1", startDate: "2026-08-10", expiryDate: "2026-09-10",
    totalFee: 1500, amountPaid: 1500,
    memberStatus: "expiring", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2025-01-10",
    payments: [
      { id: "pay1", memberId: "m1", amount: 1500, date: "2026-08-10", method: "upi", status: "paid" },
      { id: "pay2", memberId: "m1", amount: 1500, date: "2026-07-10", method: "cash", status: "paid" },
      { id: "pay3", memberId: "m1", amount: 1500, date: "2026-06-10", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m2", memberId: "BP-000131", name: "Sagar Mali", mobile: "9823456780",
    email: "sagar.mali@gmail.com", dob: "1998-07-22", gender: "male",
    address: "45, Kothrud, Pune - 411038",
    planId: "p1", startDate: "2026-09-01", expiryDate: "2026-10-01",
    totalFee: 1500, amountPaid: 1000,
    memberStatus: "active", paymentStatus: "partial",
    unpaidMonths: 0, joinedOn: "2025-06-01",
    payments: [
      { id: "pay4", memberId: "m2", amount: 1000, date: "2026-09-01", method: "cash", notes: "Partial payment", status: "partial" },
      { id: "pay5", memberId: "m2", amount: 1500, date: "2026-08-01", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m3", memberId: "BP-000108", name: "Ajay More", mobile: "9765432109",
    email: "ajay.more@gmail.com", dob: "1992-11-30", gender: "male",
    address: "78, Aundh, Pune - 411007",
    planId: "p1", startDate: "2026-08-11", expiryDate: "2026-09-11",
    totalFee: 1500, amountPaid: 1500,
    memberStatus: "expiring", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2024-11-11",
    payments: [
      { id: "pay6", memberId: "m3", amount: 1500, date: "2026-08-11", method: "card", status: "paid" },
      { id: "pay7", memberId: "m3", amount: 1500, date: "2026-07-11", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m4", memberId: "BP-000089", name: "Priya Sharma", mobile: "9011223344",
    email: "priya.sharma@gmail.com", dob: "1997-05-14", gender: "female",
    address: "22, Baner Road, Pune - 411045",
    planId: "p2", startDate: "2026-07-10", expiryDate: "2026-10-10",
    totalFee: 4000, amountPaid: 4000,
    memberStatus: "active", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2024-07-10",
    payments: [
      { id: "pay8", memberId: "m4", amount: 4000, date: "2026-07-10", method: "upi", status: "paid" },
      { id: "pay9", memberId: "m4", amount: 4000, date: "2026-04-10", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m5", memberId: "BP-000055", name: "Prasad Patil", mobile: "9888776655",
    email: "prasad.patil@gmail.com", dob: "1989-01-08", gender: "male",
    address: "5, Hadapsar, Pune - 411028",
    planId: "p1", startDate: "2026-07-10", expiryDate: "2026-08-10",
    totalFee: 1500, amountPaid: 0,
    memberStatus: "inactive", paymentStatus: "unpaid",
    unpaidMonths: 2, joinedOn: "2024-07-10",
    inactiveSince: "2026-09-10",
    payments: [
      { id: "pay10", memberId: "m5", amount: 1500, date: "2026-06-10", method: "cash", status: "paid" },
    ],
  },
  {
    id: "m6", memberId: "BP-000142", name: "Sneha Desai", mobile: "9712345678",
    email: "sneha.desai@gmail.com", dob: "2000-09-25", gender: "female",
    address: "11, Viman Nagar, Pune - 411014",
    planId: "p1", startDate: "2026-08-13", expiryDate: "2026-09-13",
    totalFee: 1500, amountPaid: 1500,
    memberStatus: "expiring", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2026-03-13",
    payments: [
      { id: "pay11", memberId: "m6", amount: 1500, date: "2026-08-13", method: "upi", status: "paid" },
      { id: "pay12", memberId: "m6", amount: 1500, date: "2026-07-13", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m7", memberId: "BP-000071", name: "Vikas Kumar", mobile: "9900112233",
    email: "vikas.kumar@gmail.com", dob: "1988-04-20", gender: "male",
    address: "33, Wakad, Pune - 411057",
    planId: "p4", startDate: "2026-01-01", expiryDate: "2027-01-01",
    totalFee: 12000, amountPaid: 12000,
    memberStatus: "active", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2023-01-01",
    payments: [
      { id: "pay13", memberId: "m7", amount: 12000, date: "2026-01-01", method: "card", status: "paid" },
      { id: "pay14", memberId: "m7", amount: 12000, date: "2025-01-01", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m8", memberId: "BP-000115", name: "Ravi Joshi", mobile: "9823001122",
    email: "ravi.joshi@gmail.com", dob: "1994-12-03", gender: "male",
    address: "67, Pimpri, Pune - 411017",
    planId: "p3", startDate: "2026-06-10", expiryDate: "2026-12-10",
    totalFee: 7000, amountPaid: 4000,
    memberStatus: "active", paymentStatus: "partial",
    unpaidMonths: 0, joinedOn: "2025-06-10",
    payments: [
      { id: "pay15", memberId: "m8", amount: 4000, date: "2026-06-10", method: "cash", notes: "Part payment, remaining due", status: "partial" },
    ],
  },
  {
    id: "m9", memberId: "BP-000097", name: "Meera Nair", mobile: "9922334455",
    email: "meera.nair@gmail.com", dob: "1996-08-17", gender: "female",
    address: "18, Kharadi, Pune - 411014",
    planId: "p1", startDate: "2026-08-09", expiryDate: "2026-09-09",
    totalFee: 1500, amountPaid: 1500,
    memberStatus: "expired", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2025-09-09",
    payments: [
      { id: "pay16", memberId: "m9", amount: 1500, date: "2026-08-09", method: "upi", status: "paid" },
      { id: "pay17", memberId: "m9", amount: 1500, date: "2026-07-09", method: "cash", status: "paid" },
    ],
  },
  {
    id: "m10", memberId: "BP-000033", name: "Suresh Yadav", mobile: "9811223344",
    email: "suresh.yadav@gmail.com", dob: "1985-02-28", gender: "male",
    address: "90, Chinchwad, Pune - 411033",
    planId: "p2", startDate: "2026-08-01", expiryDate: "2026-11-01",
    totalFee: 4000, amountPaid: 4000,
    memberStatus: "active", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2023-08-01",
    payments: [
      { id: "pay18", memberId: "m10", amount: 4000, date: "2026-08-01", method: "card", status: "paid" },
      { id: "pay19", memberId: "m10", amount: 4000, date: "2026-05-01", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m11", memberId: "BP-000158", name: "Deepa Mehta", mobile: "9734567890",
    email: "deepa.mehta@gmail.com", dob: "2001-06-11", gender: "female",
    address: "3, Magarpatta, Pune - 411013",
    planId: "p2", startDate: "2026-07-20", expiryDate: "2026-10-20",
    totalFee: 4000, amountPaid: 4000,
    memberStatus: "active", paymentStatus: "paid",
    unpaidMonths: 0, joinedOn: "2026-07-20",
    payments: [
      { id: "pay20", memberId: "m11", amount: 4000, date: "2026-07-20", method: "upi", status: "paid" },
    ],
  },
  {
    id: "m12", memberId: "BP-000063", name: "Akshay Patil", mobile: "9900556677",
    email: "akshay.patil@gmail.com", dob: "1991-10-05", gender: "male",
    address: "55, Vishrantwadi, Pune - 411015",
    planId: "p1", startDate: "2026-06-01", expiryDate: "2026-08-01",
    totalFee: 1500, amountPaid: 0,
    memberStatus: "inactive", paymentStatus: "unpaid",
    unpaidMonths: 2, joinedOn: "2024-06-01",
    inactiveSince: "2026-08-01",
    payments: [
      { id: "pay21", memberId: "m12", amount: 1500, date: "2026-05-01", method: "cash", status: "paid" },
    ],
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "expiry", memberId: "m1", memberName: "Rahul Patil", message: "Rahul Patil's membership expires today.", read: false, date: "2026-09-10", priority: "high" },
  { id: "n2", type: "expiry", memberId: "m3", memberName: "Ajay More", message: "Ajay More's membership expires tomorrow.", read: false, date: "2026-09-10", priority: "high" },
  { id: "n3", type: "expiry", memberId: "m6", memberName: "Sneha Desai", message: "Sneha Desai's membership expires in 3 days.", read: false, date: "2026-09-10", priority: "medium" },
  { id: "n4", type: "payment", memberId: "m2", memberName: "Sagar Mali", message: "Sagar Mali has ₹500 pending payment.", read: false, date: "2026-09-10", priority: "medium" },
  { id: "n5", type: "payment", memberId: "m8", memberName: "Ravi Joshi", message: "Ravi Joshi has ₹3,000 pending payment.", read: true, date: "2026-09-09", priority: "medium" },
  { id: "n6", type: "unpaid", memberId: "m5", memberName: "Prasad Patil", message: "Prasad Patil has not paid membership fees for 2 consecutive months.", read: false, date: "2026-09-10", priority: "high" },
  { id: "n7", type: "unpaid", memberId: "m12", memberName: "Akshay Patil", message: "Akshay Patil has not paid membership fees for 2 consecutive months.", read: true, date: "2026-08-01", priority: "high" },
  { id: "n8", type: "inactive", memberId: "m12", memberName: "Akshay Patil", message: "Akshay Patil has been moved to inactive members due to 2 months of unpaid fees.", read: true, date: "2026-08-01", priority: "medium" },
];

export const GYM_SETTINGS = {
  name: "BodyPower Gym",
  phone: "020-26543210",
  address: "First Floor, Fitness Hub, FC Road, Shivajinagar, Pune - 411005",
  reminderDays: [3, 1],
  inactiveAfterMonths: 2,
};
