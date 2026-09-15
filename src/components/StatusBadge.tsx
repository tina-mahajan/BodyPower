import type { MemberStatus, PaymentStatus } from "../types";

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const cfg = {
    active: { label: "Active", cls: "bg-green-dim text-green border border-green/20" },
    expiring: { label: "Expiring Soon", cls: "bg-amber-dim text-amber border border-amber/20" },
    expired: { label: "Expired", cls: "bg-red-dim text-red border border-red/20" },
    inactive: { label: "Inactive", cls: "bg-border2 text-muted border border-border2" },
    pending: { label: "Pending", cls: "bg-amber-dim text-amber border border-amber/20" },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ status, pending }: { status: PaymentStatus; pending?: number }) {
  const cfg = {
    paid: { label: "Paid", cls: "bg-green-dim text-green" },
    partial: { label: pending ? `₹${pending.toLocaleString()} Pending` : "Partial", cls: "bg-amber-dim text-amber" },
    unpaid: { label: "Unpaid", cls: "bg-red-dim text-red" },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}
