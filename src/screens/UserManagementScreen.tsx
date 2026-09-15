import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Card, Btn, Modal } from "../components/ui";
import Avatar from "../components/Avatar";
import type { User } from "../types";

export default function UserManagementScreen() {
  const { users, saveUser, toggleUser, currentUser, goBack, isOnline } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uMobile, setUMobile] = useState("");
  const [uRole, setURole] = useState<"admin" | "manager">("manager");
  const [uPassword, setUPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const admins = users.filter((u) => u.role === "admin" || (u as any).roleId === "admin");
  const managers = users.filter((u) => u.role === "manager" || (u as any).roleId === "manager");

  const openAdd = (defaultRole: "admin" | "manager" = "manager") => {
    setEditing(null);
    setUName("");
    setUEmail("");
    setUMobile("");
    setURole(defaultRole);
    setUPassword("");
    setServerError(null);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setUName(u.fullName || u.name);
    setUEmail(u.email);
    setUMobile(u.mobile);
    setURole((u.role === "admin" || (u as any).roleId === "admin") ? "admin" : "manager");
    setUPassword("");
    setServerError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!uName.trim() || !uEmail.trim() || !uMobile.trim()) return;
    if (!isOnline) {
      setServerError("No internet connection.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await saveUser({
        id: editing?.id,
        fullName: uName.trim(),
        email: uEmail.trim(),
        mobile: uMobile.trim(),
        roleId: uRole,
        password: uPassword.trim() || undefined,
      });
      setShowModal(false);
    } catch (err: any) {
      setServerError(err.message || "Failed to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (!isOnline || id === currentUser?.id) return;
    try {
      await toggleUser(id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="User Management" onBack={goBack} />

      <div className="px-4 py-4 space-y-6">
        {/* Admins */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Admins (Full Access)</p>
              <p className="text-[11px] text-text2">Full access to settings, user management, and financials</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary font-semibold">{admins.length}/2 Accounts</span>
              {admins.length < 2 && (
                <button
                  onClick={() => openAdd("admin")}
                  className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
                >
                  + Add Admin
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {admins.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                isSelf={u.id === currentUser?.id}
                canDeactivate={false}
                onEdit={() => openEdit(u)}
                onToggle={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Managers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Managers (Front Desk)</p>
              <p className="text-[11px] text-text2">Front-desk admissions, renewals, payments & member search</p>
            </div>
            <button
              onClick={() => openAdd("manager")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
            >
              + Add Manager
            </button>
          </div>
          <div className="space-y-3">
            {managers.length === 0 ? (
              <Card>
                <p className="text-muted text-sm text-center py-2">No front-desk managers added yet</p>
              </Card>
            ) : (
              managers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  isSelf={u.id === currentUser?.id}
                  canDeactivate
                  onEdit={() => openEdit(u)}
                  onToggle={() => handleToggle(u.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit User" : `Add New ${uRole === "admin" ? "Admin" : "Manager"}`}>
        <div className="space-y-4">
          {serverError && (
            <div className="bg-red-dim border border-red/20 rounded-xl p-3 text-red text-xs">
              {serverError}
            </div>
          )}

          {!editing && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Account Role *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setURole("admin")}
                  disabled={admins.length >= 2 && uRole !== "admin"}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    uRole === "admin"
                      ? "border-primary bg-primary/10 text-text"
                      : "border-border2 bg-card2 text-muted hover:border-border"
                  } ${admins.length >= 2 && uRole !== "admin" ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <p className="font-bold text-xs text-primary">Admin</p>
                  <p className="text-[10px] text-muted">Full administrative access (Max 2)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setURole("manager")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    uRole === "manager"
                      ? "border-blue bg-blue-dim text-text"
                      : "border-border2 bg-card2 text-muted hover:border-border"
                  }`}
                >
                  <p className="font-bold text-xs text-blue">Manager</p>
                  <p className="text-[10px] text-muted">Front-desk operations only</p>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Full Name *</label>
            <input
              value={uName}
              onChange={(e) => setUName(e.target.value)}
              placeholder="e.g. Rahul Mali"
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Email Address *</label>
            <input
              type="email"
              value={uEmail}
              onChange={(e) => setUEmail(e.target.value)}
              placeholder="e.g. rahulmali@gmail.com"
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Mobile Number *</label>
            <input
              type="tel"
              value={uMobile}
              onChange={(e) => setUMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          {!editing && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Initial Password</label>
              <input
                type="password"
                value={uPassword}
                onChange={(e) => setUPassword(e.target.value)}
                placeholder={uRole === "admin" ? "Default: Admin@123" : "Default: Manager@123"}
                className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
              />
            </div>
          )}

          <Btn fullWidth onClick={handleSave} disabled={!uName || !uEmail || !uMobile || isSubmitting}>
            {isSubmitting ? "Saving..." : editing ? "Save Changes" : `Create ${uRole === "admin" ? "Admin" : "Manager"} Account`}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

function UserCard({
  user,
  isSelf,
  canDeactivate,
  onEdit,
  onToggle,
}: {
  user: User;
  isSelf: boolean;
  canDeactivate: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const active = user.isActive ?? user.active ?? true;
  const name = user.fullName || user.name;
  return (
    <div className={`bg-card border rounded-2xl p-4 ${!active ? "opacity-60 border-border" : "border-border"}`}>
      <div className="flex items-center gap-3">
        <Avatar name={name} src={user.avatar || user.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text text-sm truncate">{name}</p>
            {isSelf && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                You
              </span>
            )}
          </div>
          <p className="text-muted text-xs truncate">{user.email}</p>
          <p className="text-muted text-xs">{user.mobile}</p>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            active ? "bg-green-dim text-green" : "bg-border2 text-muted"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>
      {!isSelf && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={onEdit}
            className="flex-1 text-xs font-semibold text-text2 bg-card2 border border-border2 rounded-xl py-2 hover:border-primary/40 transition-colors"
          >
            ✏️ Edit
          </button>
          {canDeactivate && (
            <button
              onClick={onToggle}
              className={`flex-1 text-xs font-semibold rounded-xl py-2 border transition-colors ${
                active
                  ? "text-red bg-red-dim border-red/20 hover:bg-red/20"
                  : "text-green bg-green-dim border-green/20 hover:bg-green/20"
              }`}
            >
              {active ? "Deactivate" : "Reactivate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
