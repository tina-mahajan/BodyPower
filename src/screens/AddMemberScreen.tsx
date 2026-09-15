import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Btn, Input, Select, SuccessModal } from "../components/ui";
import Avatar from "../components/Avatar";
import type { PaymentMethod } from "../types";

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function AddMemberScreen() {
  const { members, plans, createMember, updateMember, uploadMemberPhoto, navigate, goBack, screenParams, isOnline } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing mode
  const editId = screenParams?.memberId;
  const existing = editId ? members.find((m) => m.id === editId) : null;

  const todayStr = new Date().toISOString().split("T")[0];

  const [name, setName] = useState(existing?.name || "");
  const [mobile, setMobile] = useState(existing?.mobile || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [dob, setDob] = useState(existing?.dob || "");
  const [gender, setGender] = useState<"male" | "female" | "other">((existing?.gender as any) || "male");
  const [address, setAddress] = useState(existing?.address || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(existing?.avatar || null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [planId, setPlanId] = useState(existing?.planId || plans[0]?.id || "p1");
  const [startDate, setStartDate] = useState(existing?.startDate || todayStr);
  const [amountPaid, setAmountPaid] = useState(existing ? String(existing.amountPaid) : "");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedPlan = plans.find((p) => p.id === planId) || plans[0];
  const totalFee = selectedPlan?.price || 0;
  const duration = selectedPlan?.duration || 1;
  const expiryDate = addMonths(startDate, duration);
  const paid = Number(amountPaid) || 0;
  const pending = Math.max(0, totalFee - paid);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Image size must be less than 5MB" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!mobile.trim() || !/^\d{10}$/.test(mobile.trim())) e.mobile = "Valid 10-digit mobile required";
    if (paid > totalFee) e.paid = "Amount paid cannot exceed total fee";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!isOnline) {
      setServerError("No internet connection. Please reconnect before saving.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      if (editId && existing) {
        await updateMember(editId, {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || undefined,
          dob: dob || undefined,
          gender,
          address: address.trim() || undefined,
        });

        if (photoBase64) {
          await uploadMemberPhoto(editId, photoBase64);
        }
      } else {
        const newMember = await createMember({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || undefined,
          dob: dob || undefined,
          gender,
          address: address.trim() || undefined,
          photoUrl: photoBase64 || undefined,
          planId,
          startDate,
          amountPaid: paid,
          paymentMethod: payMethod,
          notes: notes.trim() || undefined,
        });

        if (photoBase64 && newMember.id) {
          await uploadMemberPhoto(newMember.id, photoBase64);
        }
      }
      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message || "Failed to save member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = editId ? "Edit Member" : "New Admission";

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title={title} onBack={goBack} />

      {!isOnline && (
        <div className="bg-amber-dim/50 border border-amber/30 px-4 py-2 text-amber text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>You are offline. Transactions require internet connectivity to save to SQL Server.</span>
        </div>
      )}

      {serverError && (
        <div className="mx-4 mt-3 bg-red-dim border border-red/20 rounded-xl p-3 text-red text-sm flex items-center justify-between">
          <span>{serverError}</span>
          <button onClick={() => setServerError(null)} className="text-red font-bold ml-2">✕</button>
        </div>
      )}

      <div className="px-4 py-4 space-y-6">
        {/* Profile Photo Upload */}
        <section className="flex flex-col items-center gap-3">
          <div className="relative group">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md"
              />
            ) : (
              <Avatar name={name || "New Member"} size="xl" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              title="Upload Photo"
            >
              📷
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary font-semibold bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full"
            >
              {photoPreview ? "Change Photo" : "Upload / Take Photo"}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red font-semibold bg-red-dim border border-red/20 px-3 py-1.5 rounded-full"
              >
                Remove
              </button>
            )}
          </div>
          {errors.photo && <p className="text-xs text-red">{errors.photo}</p>}
        </section>

        {/* Personal Details */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Personal Details</p>
          <div className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Rahul Patil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Mobile Number *"
              type="tel"
              placeholder="10-digit mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              error={errors.mobile}
              maxLength={10}
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Address</label>
              <textarea
                placeholder="Full residential address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 resize-none w-full"
              />
            </div>
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Membership Details */}
        {!editId && (
          <>
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Membership Details</p>
              <div className="space-y-4">
                <Select
                  label="Membership Plan *"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  {plans
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price.toLocaleString()} ({p.duration}M)
                      </option>
                    ))}
                </Select>
                <Input
                  label="Start Date *"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                {/* Auto expiry calculation display */}
                <div className="bg-card2 border border-border2 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-0.5">
                      Expiry Date
                    </p>
                    <p className="text-text font-semibold">
                      {new Date(expiryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-xs bg-green-dim text-green px-2 py-1 rounded-full font-semibold">
                    Auto-Calculated
                  </span>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Payment Details */}
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Payment Details</p>
              <div className="space-y-4">
                {/* Fee summary card */}
                <div className="bg-card2 border border-border2 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">Plan Fee</span>
                    <span className="text-text font-bold">₹{totalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">Paid Now</span>
                    <span className="text-green font-bold">₹{paid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-muted text-sm">Pending</span>
                    <span className={`font-bold ${pending > 0 ? "text-amber" : "text-green"}`}>
                      ₹{pending.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Input
                  label="Amount Paid"
                  type="number"
                  placeholder={`Max ₹${totalFee}`}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  error={errors.paid}
                />

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
                        className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
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

                <Input
                  label="Payment Notes (Optional)"
                  placeholder="e.g. Admission receipt #101"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </section>
          </>
        )}

        <Btn size="lg" fullWidth onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? "Saving to Database..."
            : editId
            ? "Save Changes"
            : "Create Member & Admission"}
        </Btn>
      </div>

      <SuccessModal
        open={success}
        onClose={() => {
          setSuccess(false);
          navigate("members");
        }}
        title={editId ? "Changes Saved!" : "Member Created!"}
        message={
          editId
            ? "Member details have been updated in the database."
            : "New member admission successfully recorded in BodyPower Gym."
        }
      />
    </div>
  );
}
