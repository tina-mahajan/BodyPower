import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Btn, Input } from "../components/ui";
import { api } from "../services/api";

export default function LoginScreen() {
  const { login, setupInitialAdmin, isLoading, error, clearError } = useApp();
  
  // Mode: setup or login
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Setup form state
  const [fullName, setFullName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupMobile, setSetupMobile] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [gymName, setGymName] = useState("BodyPower Gym");
  const [gymPhone, setGymPhone] = useState("");
  const [gymAddress, setGymAddress] = useState("");

  const [localError, setLocalError] = useState("");

  // Check if system requires initial setup
  useEffect(() => {
    const checkSystem = async () => {
      try {
        setCheckingStatus(true);
        const status = await api.auth.getSystemStatus();
        setNeedsSetup(status.needsSetup);
        if (status.gymName) setGymName(status.gymName);
      } catch (err) {
        // If status check fails, fallback to login mode
        setNeedsSetup(false);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkSystem();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError("Please enter email/mobile and password.");
      return;
    }
    setLocalError("");
    await login(email.trim(), password);
  };

  const handleSetup = async () => {
    if (!fullName.trim() || !setupEmail.trim() || !setupMobile.trim() || !setupPassword) {
      setLocalError("Please complete all required administrator fields.");
      return;
    }
    if (!/^\d{10}$/.test(setupMobile.trim())) {
      setLocalError("Mobile number must be a valid 10-digit number.");
      return;
    }
    if (setupPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    setLocalError("");
    await setupInitialAdmin({
      fullName: fullName.trim(),
      email: setupEmail.trim(),
      mobile: setupMobile.trim(),
      password: setupPassword,
      gymName: gymName.trim() || "BodyPower Gym",
      phone: gymPhone.trim() || setupMobile.trim(),
      address: gymAddress.trim() || "Main Branch",
    });
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top branding header */}
      <div className="h-44 bg-gradient-to-b from-primary/10 to-transparent flex flex-col items-center justify-center pt-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.3)]">
            <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
              <rect x="4" y="22" width="8" height="8" rx="2" fill="white" opacity="0.7" />
              <rect x="40" y="22" width="8" height="8" rx="2" fill="white" opacity="0.7" />
              <rect x="14" y="16" width="24" height="20" rx="3" fill="white" />
              <rect x="12" y="20" width="4" height="12" rx="2" fill="white" opacity="0.9" />
              <rect x="36" y="20" width="4" height="12" rx="2" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-extrabold text-text tracking-wider">
              BODY<span className="text-primary">POWER</span>
            </h1>
            <p className="text-muted text-xs tracking-widest uppercase">G Y M</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {checkingStatus ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Connecting to BodyPower Cloud Database...</p>
          </div>
        ) : needsSetup ? (
          /* FIRST-TIME SETUP CARD */
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => {
                setNeedsSetup(false);
                setLocalError("");
                clearError();
              }}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors self-start font-medium"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              <span>Back to Login</span>
            </button>

            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
              <div className="flex items-center gap-2.5 text-primary mb-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="font-bold text-sm">First-Time Setup Required</h3>
              </div>
              <p className="text-text2 text-xs leading-relaxed">
                Your database is empty and ready. Please create your real <strong>Gym Administrator Account</strong> to initialize access. If an administrator is already configured, click <strong>Back to Login</strong> above to sign in.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 bg-card border border-border rounded-2xl p-5 shadow-lg">
              <h2 className="text-lg font-bold text-text">Create Gym Administrator</h2>

              <Input
                label="Administrator Full Name *"
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setLocalError("");
                  clearError();
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Admin Email *"
                  type="email"
                  placeholder="admin@yourgym.com"
                  value={setupEmail}
                  onChange={(e) => {
                    setSetupEmail(e.target.value);
                    setLocalError("");
                    clearError();
                  }}
                />
                <Input
                  label="Admin Mobile (10 digits) *"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={setupMobile}
                  onChange={(e) => {
                    setSetupMobile(e.target.value.replace(/\D/g, ""));
                    setLocalError("");
                    clearError();
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Create secure password (min 6 chars)"
                    value={setupPassword}
                    onChange={(e) => {
                      setSetupPassword(e.target.value);
                      setLocalError("");
                      clearError();
                    }}
                    className="bg-card2 border border-border2 rounded-xl px-4 py-2.5 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-medium"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <hr className="border-border my-1" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Gym Name"
                  type="text"
                  placeholder="BodyPower Gym"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                />
                <Input
                  label="Gym Phone"
                  type="text"
                  placeholder="020-26543210"
                  value={gymPhone}
                  onChange={(e) => setGymPhone(e.target.value)}
                />
              </div>

              <Input
                label="Gym Address / Branch"
                type="text"
                placeholder="First Floor, Fitness Hub, FC Road, Pune"
                value={gymAddress}
                onChange={(e) => setGymAddress(e.target.value)}
              />

              {displayedError && (
                <div className="bg-red-dim border border-red/20 rounded-xl px-4 py-3">
                  <p className="text-red text-sm">{displayedError}</p>
                </div>
              )}

              <Btn size="lg" fullWidth onClick={handleSetup} disabled={isLoading} className="mt-2">
                {isLoading ? "Creating Administrator..." : "Create Admin & Launch Gym System"}
              </Btn>
            </div>
          </div>
        ) : (
          /* STANDARD SIGN IN FORM */
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-text mb-1">Welcome back</h2>
              <p className="text-text2 text-sm">Sign in to manage members and memberships</p>
            </div>

            <div className="flex flex-col gap-4 bg-card border border-border rounded-2xl p-5 shadow-lg">
              <Input
                label="Email or Mobile"
                type="text"
                placeholder="admin@bodypowergym.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError("");
                  clearError();
                }}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLocalError("");
                      clearError();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                    className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-medium"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {displayedError && (
                <div className="bg-red-dim border border-red/20 rounded-xl px-4 py-3">
                  <p className="text-red text-sm">{displayedError}</p>
                </div>
              )}

              <Btn size="lg" fullWidth onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "Signing in..." : "Login"}
              </Btn>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setNeedsSetup(true)}
                className="text-xs text-muted hover:text-primary transition-colors underline"
              >
                Need to create a new administrator?
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
