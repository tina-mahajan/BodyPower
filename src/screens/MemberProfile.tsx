import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Card, Btn, SectionLabel, Modal, SuccessModal } from "../components/ui";
import { MemberStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import type { PaymentMethod } from "../types";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MemberProfile() {
  const {
    screenParams,
    members,
    recordPayment,
    moveToInactive,
    reactivateMember,
    uploadMemberPhoto,
    deleteMemberPhoto,
    navigate,
    goBack,
    currentUser,
    plans,
    isOnline,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const member = members.find((m) => m.id === screenParams.memberId || m.memberId === screenParams.memberId);

  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNotes, setPayNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [inactiveConfirm, setInactiveConfirm] = useState(false);
  const [reactivateConfirm, setReactivateConfirm] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  if (!member) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted text-base mb-4">Member not found in database</p>
        <Btn onClick={goBack}>Back</Btn>
      </div>
    );
  }

  const pending = member.pendingFee ?? Math.max(0, member.totalFee - member.amountPaid);
  const days = daysUntil(member.expiryDate);
  const selectedPlan = plans.find((p) => p.id === member.planId);
  const totalDays = ((selectedPlan?.duration as number) || 1) * 30;
  const elapsed = totalDays - Math.max(0, days);
  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

  const handlePayment = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return;
    if (!isOnline) {
      setErrorMessage("No internet connection. Please reconnect before recording a payment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await recordPayment({
        memberId: member.id,
        amount: amt,
        paymentMethod: payMethod,
        notes: payNotes.trim() || undefined,
      });
      setShowPayment(false);
      setPayAmount("");
      setPayNotes("");
      setSuccessModal({
        open: true,
        title: "Payment Recorded!",
        message: `₹${amt.toLocaleString()} payment successfully saved in SQL Server.`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      try {
        setIsSubmitting(true);
        await uploadMemberPhoto(member.id, base64);
        setShowPhotoModal(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessModal({
          open: true,
          title: "Photo Updated",
          message: "Member profile photo updated successfully.",
        });
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to upload photo.");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    try {
      setIsSubmitting(true);
      await deleteMemberPhoto(member.id);
      setShowPhotoModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessModal({
        open: true,
        title: "Photo Removed",
        message: "Profile photo removed.",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to remove photo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveInactive = async () => {
    if (!isOnline) {
      setErrorMessage("No internet connection.");
      return;
    }

    try {
      setIsSubmitting(true);
      await moveToInactive(member.id);
      setInactiveConfirm(false);
      setSuccessModal({
        open: true,
        title: "Member Moved to Inactive",
        message: `${member.name} is now inactive. Historical data is preserved.`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to move member to inactive.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    if (!isOnline) {
      setErrorMessage("No internet connection.");
      return;
    }

    try {
      setIsSubmitting(true);
      await reactivateMember(member.id);
      setReactivateConfirm(false);
      setSuccessModal({
        open: true,
        title: "Member Reactivated!",
        message: `${member.name} has been reactivated.`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reactivate member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Member Profile"
        onBack={goBack}
        right={
          <button
            onClick={() => navigate("edit-member", { memberId: member.id })}
            className="text-primary text-sm font-semibold"
          >
            Edit
          </button>
        }
      />

      {!isOnline && (
        <div className="bg-amber-dim/50 border border-amber/30 px-4 py-2 text-amber text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>You are offline. Transactions require internet connectivity.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mx-4 mt-3 bg-red-dim border border-red/20 rounded-xl p-3 text-red text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red font-bold ml-2">✕</button>
        </div>
      )}

      {/* Hero */}
      <div className="px-4 py-6 bg-gradient-to-b from-card to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer" onClick={() => setShowPhotoModal(true)}>
            <Avatar name={member.name} src={member.avatar} size="xl" />
            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full text-xs shadow">
              📷
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-text tracking-wide">{member.name}</h2>
            <p className="text-muted text-sm font-medium">{member.memberId}</p>
            <p className="text-text2 text-sm">{member.mobile}</p>
            {member.email && <p className="text-muted text-xs">{member.email}</p>}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <MemberStatusBadge status={member.memberStatus} />
              {member.memberStatus === "inactive" && member.inactiveSince && (
                <span className="text-[10px] text-muted">Since {formatDate(member.inactiveSince)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Membership Details */}
        <Card>
          <SectionLabel>Membership Details</SectionLabel>
          <div className="space-y-2.5">
            <Row label="Plan" value={member.planName || selectedPlan?.name || "Monthly"} />
            <Row label="Start Date" value={formatDate(member.startDate)} />
            <Row label="Expiry Date" value={formatDate(member.expiryDate)} />
            <Row
              label="Days Remaining"
              value={days <= 0 ? "Expired" : `${days} Day${days !== 1 ? "s" : ""}`}
              valueClass={days <= 0 ? "text-red" : days <= 3 ? "text-amber" : "text-green"}
            />
          </div>

          {/* Expiry Progress Bar */}
          <div className="mt-3">
            <div className="h-2 bg-card2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  days <= 0 ? "bg-red" : progress > 90 ? "bg-red" : progress > 70 ? "bg-amber" : "bg-green"
                }`}
                style={{ width: `${days <= 0 ? 100 : progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted">{formatDate(member.startDate)}</span>
              <span className="text-[10px] text-muted">{formatDate(member.expiryDate)}</span>
            </div>
          </div>
        </Card>

        {/* Fees Summary */}
        <Card>
          <SectionLabel>Payment Summary</SectionLabel>
          <div className="space-y-2.5">
            <Row label="Total Plan Fee" value={`₹${member.totalFee.toLocaleString()}`} />
            <Row
              label="Amount Paid"
              value={`₹${member.amountPaid.toLocaleString()}`}
              valueClass="text-green font-bold"
            />
            <Row
              label="Pending Amount"
              value={`₹${pending.toLocaleString()}`}
              valueClass={pending > 0 ? "text-amber font-bold" : "text-green"}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text2 font-semibold">Payment Status</span>
            <PaymentStatusBadge status={member.paymentStatus} pending={pending} />
          </div>
        </Card>

        {/* Personal Details */}
        <Card>
          <SectionLabel>Personal Information</SectionLabel>
          <div className="space-y-2.5">
            {member.dob && <Row label="Date of Birth" value={formatDate(member.dob)} />}
            {member.gender && (
              <Row
                label="Gender"
                value={member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}
              />
            )}
            {member.address && <Row label="Address" value={member.address} />}
            <Row label="Admission Date" value={formatDate(member.joinedOn)} />
          </div>
        </Card>

        {/* Authoritative Payment History */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Payment History</SectionLabel>
            <span className="text-muted text-xs">{member.payments.length} Records</span>
          </div>

          {member.payments.length === 0 ? (
            <p className="text-muted text-sm text-center py-3">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {member.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-text text-sm font-semibold">₹{p.amount.toLocaleString()}</p>
                    <p className="text-muted text-xs">
                      {formatDate(p.date)} · {p.method.toUpperCase()}
                    </p>
                    {p.notes && <p className="text-muted text-xs italic">{p.notes}</p>}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      p.status === "paid" ? "bg-green-dim text-green" : "bg-amber-dim text-amber"
                    }`}
                  >
                    {p.status === "paid" ? "Paid" : "Partial"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <SectionLabel>Actions</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Btn onClick={() => setShowPayment(true)} fullWidth>
              💰 Record Payment
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => navigate("renew-membership", { memberId: member.id })}
              fullWidth
            >
              🔄 Renew Plan
            </Btn>
          </div>

          <Btn
            variant="outline"
            onClick={() => navigate("edit-member", { memberId: member.id })}
            fullWidth
          >
            ✏️ Edit Member Details
          </Btn>

          {currentUser?.role === "admin" && (
            <>
              {member.memberStatus === "inactive" ? (
                <Btn
                  variant="primary"
                  className="bg-green hover:bg-green-600"
                  onClick={() => setReactivateConfirm(true)}
                  fullWidth
                >
                  ✓ Reactivate Member
                </Btn>
              ) : (
                <Btn variant="danger" onClick={() => setInactiveConfirm(true)} fullWidth>
                  Move to Inactive
                </Btn>
              )}
            </>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <div className="space-y-4">
          <div className="bg-card2 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total Fee</span>
              <span className="font-bold text-text">₹{member.totalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Pending Balance</span>
              <span className="font-bold text-amber">₹{pending.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Amount to Pay (₹)
            </label>
            <input
              type="number"
              placeholder={`e.g. ${pending || member.totalFee}`}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["cash", "upi", "card", "other"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    payMethod === m
                      ? "bg-primary text-white border-primary"
                      : "bg-card2 text-text2 border-border2"
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Partial balance clearance"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <Btn
            fullWidth
            onClick={handlePayment}
            disabled={!payAmount || Number(payAmount) <= 0 || isSubmitting}
          >
            {isSubmitting ? "Saving to SQL Server..." : "Save Payment"}
          </Btn>
        </div>
      </Modal>

      {/* Photo Management Modal */}
      <Modal open={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Profile Photo">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
            <Avatar name={member.name} src={member.avatar} size="xl" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          <div className="flex flex-col gap-2">
            <Btn fullWidth onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
              📷 Upload / Take New Photo
            </Btn>
            {member.avatar && (
              <Btn variant="danger" fullWidth onClick={handleDeletePhoto} disabled={isSubmitting}>
                Remove Current Photo
              </Btn>
            )}
            <Btn variant="ghost" fullWidth onClick={() => setShowPhotoModal(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Inactive Confirmation Modal */}
      <Modal open={inactiveConfirm} onClose={() => setInactiveConfirm(false)} title="Move to Inactive?">
        <div className="space-y-4">
          <p className="text-text2 text-sm leading-relaxed">
            Are you sure you want to move <strong className="text-text">{member.name}</strong> to inactive status?
            All historical memberships and payment records will be safely preserved.
          </p>
          <div className="flex gap-3">
            <Btn variant="secondary" fullWidth onClick={() => setInactiveConfirm(false)}>
              Cancel
            </Btn>
            <Btn variant="danger" fullWidth onClick={handleMoveInactive} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Yes, Move to Inactive"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Reactivate Confirmation Modal */}
      <Modal open={reactivateConfirm} onClose={() => setReactivateConfirm(false)} title="Reactivate Member?">
        <div className="space-y-4">
          <p className="text-text2 text-sm leading-relaxed">
            Reactivate <strong className="text-text">{member.name}</strong>? Their status will return to active.
          </p>
          <div className="flex gap-3">
            <Btn variant="secondary" fullWidth onClick={() => setReactivateConfirm(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              className="bg-green hover:bg-green-600"
              fullWidth
              onClick={handleReactivate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Reactivating..." : "Yes, Reactivate"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal((prev) => ({ ...prev, open: false }))}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "text-text",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted text-xs flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
