import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Card, Modal, Btn } from "../components/ui";
import Avatar from "../components/Avatar";

export default function SettingsScreen() {
  const { currentUser, settings, updateSettings, logout, navigate, isOnline } = useApp();

  const [gymModal, setGymModal] = useState(false);
  const [gymName, setGymName] = useState(settings.name);
  const [gymPhone, setGymPhone] = useState(settings.phone);
  const [gymAddress, setGymAddress] = useState(settings.address);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const adminMenuItems = [
    { icon: "🏋️", label: "Membership Plans", screen: "plans" as const, desc: "Manage plans & pricing" },
    { icon: "👥", label: "User Management", screen: "user-management" as const, desc: "Admins & Front-desk Managers" },
    { icon: "🔔", label: "Reminder Settings", screen: "reminder-settings" as const, desc: "Expiry & 2-month unpaid rules" },
    { icon: "💤", label: "Inactive Members", screen: "inactive-members" as const, desc: "View & reactivate members" },
  ];

  const managerMenuItems = [
    { icon: "💤", label: "Inactive Members", screen: "inactive-members" as const, desc: "View inactive member records" },
  ];

  const items =
    currentUser?.role === "admin" || (currentUser as any)?.roleId === "admin"
      ? adminMenuItems
      : managerMenuItems;

  const handleSaveGymProfile = async () => {
    if (!gymName.trim()) return;
    if (!isOnline) {
      setServerError("No internet connection.");
      return;
    }

    setIsSaving(true);
    setServerError(null);

    try {
      await updateSettings({
        name: gymName.trim(),
        phone: gymPhone.trim(),
        address: gymAddress.trim(),
        reminderDays: settings.reminderDays,
        inactiveAfterMonths: settings.inactiveAfterMonths,
      });
      setGymModal(false);
    } catch (err: any) {
      setServerError(err.message || "Failed to update gym profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="More & Settings" />

      <div className="px-4 py-4 space-y-5">
        {/* Profile Card */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name={currentUser?.name || "User"} src={currentUser?.avatar} size="lg" />
            <div>
              <p className="font-semibold text-text text-base">{currentUser?.name}</p>
              <p className="text-muted text-sm">{currentUser?.email}</p>
              <div
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${
                  currentUser?.role === "admin" || (currentUser as any)?.roleId === "admin"
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-blue-dim border border-blue/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentUser?.role === "admin" || (currentUser as any)?.roleId === "admin"
                      ? "bg-primary"
                      : "bg-blue"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    currentUser?.role === "admin" || (currentUser as any)?.roleId === "admin"
                      ? "text-primary"
                      : "text-blue"
                  }`}
                >
                  {currentUser?.role || (currentUser as any)?.roleId}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Gym Info Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
                  <rect x="4" y="22" width="8" height="8" rx="2" fill="white" opacity="0.7" />
                  <rect x="40" y="22" width="8" height="8" rx="2" fill="white" opacity="0.7" />
                  <rect x="14" y="16" width="24" height="20" rx="3" fill="white" />
                  <rect x="12" y="20" width="4" height="12" rx="2" fill="white" opacity="0.9" />
                  <rect x="36" y="20" width="4" height="12" rx="2" fill="white" opacity="0.9" />
                </svg>
              </div>
              <div>
                <p className="font-display text-lg font-bold text-text tracking-wide uppercase">
                  {settings.name}
                </p>
                <p className="text-muted text-xs truncate">{settings.address}</p>
                <p className="text-muted text-xs">{settings.phone}</p>
              </div>
            </div>

            {(currentUser?.role === "admin" || (currentUser as any)?.roleId === "admin") && (
              <button
                onClick={() => {
                  setGymName(settings.name);
                  setGymPhone(settings.phone);
                  setGymAddress(settings.address);
                  setGymModal(true);
                }}
                className="text-primary text-xs font-semibold px-2 py-1 bg-primary/10 rounded-lg hover:bg-primary/20"
              >
                Edit
              </button>
            )}
          </div>
        </Card>

        {/* Menu Items */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
            {currentUser?.role === "admin" || (currentUser as any)?.roleId === "admin"
              ? "Admin Controls"
              : "Options"}
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.screen}
                onClick={() => navigate(item.screen)}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 text-left hover:border-border2 active:scale-[0.98] transition-all"
              >
                <span className="text-xl w-8">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-text text-sm font-semibold">{item.label}</p>
                  <p className="text-muted text-xs">{item.desc}</p>
                </div>
                <svg className="text-muted" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 bg-red-dim border border-red/20 rounded-xl px-4 py-3.5 text-left hover:bg-red/20 active:scale-[0.98] transition-all"
        >
          <span className="text-xl w-8">🚪</span>
          <div className="flex-1">
            <p className="text-red text-sm font-semibold">Sign Out</p>
            <p className="text-muted text-xs">End current session</p>
          </div>
        </button>
      </div>

      {/* Edit Gym Profile Modal */}
      <Modal open={gymModal} onClose={() => setGymModal(false)} title="Gym Information">
        <div className="space-y-4">
          {serverError && (
            <div className="bg-red-dim border border-red/20 rounded-xl p-3 text-red text-xs">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Gym Name</label>
            <input
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Phone</label>
            <input
              value={gymPhone}
              onChange={(e) => setGymPhone(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Address</label>
            <textarea
              value={gymAddress}
              onChange={(e) => setGymAddress(e.target.value)}
              rows={2}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 resize-none w-full"
            />
          </div>

          <Btn fullWidth onClick={handleSaveGymProfile} disabled={!gymName.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save Information"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
