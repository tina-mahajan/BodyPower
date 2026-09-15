import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Member, MembershipPlan, Notification, GymSettings, Screen, PaymentMethod, Role } from "../types";
import { api, setAuthToken } from "../services/api";

interface AppContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  setupInitialAdmin: (data: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    gymName?: string;
    phone?: string;
    address?: string;
  }) => Promise<boolean>;
  logout: () => void;
  screen: Screen;
  screenParams: Record<string, string>;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
  goBack: () => void;
  members: Member[];
  plans: MembershipPlan[];
  users: User[];
  notifications: Notification[];
  settings: GymSettings;
  unreadCount: number;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  clearError: () => void;
  refreshData: () => Promise<void>;
  createMember: (data: {
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
  }) => Promise<Member>;
  updateMember: (id: string, data: {
    name: string;
    mobile: string;
    email?: string;
    dob?: string;
    gender?: string;
    address?: string;
  }) => Promise<Member>;
  uploadMemberPhoto: (id: string, base64Image: string) => Promise<string>;
  deleteMemberPhoto: (id: string) => Promise<void>;
  renewMembership: (memberId: string, data: {
    planId: string;
    startDate?: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Promise<void>;
  recordPayment: (data: {
    memberId: string;
    membershipId?: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Promise<void>;
  moveToInactive: (id: string) => Promise<void>;
  reactivateMember: (id: string) => Promise<void>;
  savePlan: (data: { id?: string; name: string; duration: number; price: number; description?: string }) => Promise<void>;
  togglePlan: (id: string) => Promise<void>;
  saveUser: (data: { id?: string; fullName: string; email: string; mobile: string; roleId?: string; role?: Role; password?: string }) => Promise<void>;
  toggleUser: (id: string) => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  triggerReminders: () => Promise<number>;
  updateSettings: (data: { name: string; phone?: string; address?: string; reminderDays?: number[]; inactiveAfterMonths: number }) => Promise<void>;
}

const defaultSettings: GymSettings = {
  name: "BodyPower Gym",
  phone: "020-26543210",
  address: "First Floor, Fitness Hub, FC Road, Shivajinagar, Pune - 411005",
  reminderDays: [3, 1],
  inactiveAfterMonths: 2,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("splash");
  const [screenParams, setScreenParams] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<GymSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [historyStack, setHistoryStack] = useState<Array<{ screen: Screen; params: Record<string, string> }>>([]);

  const navigate = useCallback((s: Screen, params: Record<string, string> = {}, pushHistory = true) => {
    if (pushHistory && s !== screen) {
      setHistoryStack((prev) => [...prev, { screen, params: screenParams }]);
      try {
        window.history.pushState({ screen: s, params }, "", window.location.pathname);
      } catch {}
    }
    setScreen(s);
    setScreenParams(params);
    window.scrollTo(0, 0);
  }, [screen, screenParams]);

  const goBack = useCallback(() => {
    setHistoryStack((prev) => {
      if (prev.length > 0) {
        const nextStack = [...prev];
        const last = nextStack.pop()!;
        setScreen(last.screen);
        setScreenParams(last.params);
        window.scrollTo(0, 0);
        return nextStack;
      } else {
        const fallback: Screen = currentUser?.role === "admin" ? "admin-dashboard" : "manager-dashboard";
        setScreen(fallback);
        setScreenParams({});
        window.scrollTo(0, 0);
        return [];
      }
    });
  }, [currentUser]);

  // Handle browser hardware/native back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.screen) {
        setScreen(e.state.screen);
        setScreenParams(e.state.params || {});
      } else {
        goBack();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [goBack]);

  const clearError = useCallback(() => setError(null), []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [membersData, plansData, settingsData] = await Promise.all([
        api.members.getAll().catch(() => []),
        api.plans.getAll().catch(() => []),
        api.settings.get().catch(() => defaultSettings),
      ]);

      setMembers(membersData);
      setPlans(plansData);
      setSettings(settingsData);

      // Notifications for all authenticated users
      if (currentUser) {
        const notifsData = await api.notifications.getAll().catch(() => []);
        setNotifications(notifsData);

        // Admin-only user management list
        if (currentUser.role === "admin" || (currentUser as any)?.roleId === "admin") {
          const usersData = await api.users.getAll().catch(() => []);
          setUsers(usersData);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load gym data");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Try restoring existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.auth.me();
        if (user) {
          const mapped: User = {
            id: user.id,
            name: user.fullName || user.name,
            email: user.email,
            mobile: user.mobile,
            role: (user.roleId || user.role) as any,
            active: user.isActive ?? user.active ?? true,
          };
          setCurrentUser(mapped);
          setScreen(mapped.role === "admin" ? "admin-dashboard" : "manager-dashboard");
        }
      } catch {
        // Token invalid or absent
        setAuthToken(null);
      }
    };
    checkAuth();
  }, []);

  // Sync data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.auth.login(email, password);
      if (res && res.token) {
        setAuthToken(res.token);
        const mappedUser: User = {
          id: res.user.id,
          name: res.user.fullName || res.user.name,
          email: res.user.email,
          mobile: res.user.mobile,
          role: (res.user.roleId || res.user.role) as any,
          active: res.user.isActive ?? res.user.active ?? true,
        };
        setCurrentUser(mappedUser);
        setScreen(mappedUser.role === "admin" ? "admin-dashboard" : "manager-dashboard");
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupInitialAdmin = useCallback(async (data: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.auth.setupInitialAdmin(data);
      if (res && res.token) {
        setAuthToken(res.token);
        const mappedUser: User = {
          id: res.user.id,
          name: res.user.fullName || res.user.name,
          email: res.user.email,
          mobile: res.user.mobile,
          role: (res.user.roleId || res.user.role || "admin") as any,
          active: res.user.isActive ?? res.user.active ?? true,
        };
        setCurrentUser(mappedUser);
        setScreen("admin-dashboard");
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || "Failed to complete initial setup.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setMembers([]);
    setNotifications([]);
    setScreen("login");
  }, []);

  const createMember = useCallback(async (data: any): Promise<Member> => {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please reconnect before creating a member.");
    }
    const newMember = await api.members.create(data);
    await refreshData();
    return newMember;
  }, [refreshData]);

  const updateMember = useCallback(async (id: string, data: any): Promise<Member> => {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please reconnect before updating member details.");
    }
    const updated = await api.members.update(id, data);
    await refreshData();
    return updated;
  }, [refreshData]);

  const uploadMemberPhoto = useCallback(async (id: string, base64Image: string): Promise<string> => {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please reconnect before uploading a photo.");
    }
    const res = await api.members.uploadPhoto(id, base64Image);
    await refreshData();
    return res.photoUrl;
  }, [refreshData]);

  const deleteMemberPhoto = useCallback(async (id: string): Promise<void> => {
    if (!navigator.onLine) {
      throw new Error("No internet connection.");
    }
    await api.members.deletePhoto(id);
    await refreshData();
  }, [refreshData]);

  const renewMembership = useCallback(async (memberId: string, data: any): Promise<void> => {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please reconnect before renewing membership.");
    }
    await api.memberships.renew(memberId, data);
    await refreshData();
  }, [refreshData]);

  const recordPayment = useCallback(async (data: any): Promise<void> => {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please reconnect before recording a payment.");
    }
    await api.payments.record(data);
    await refreshData();
  }, [refreshData]);

  const moveToInactive = useCallback(async (id: string): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    await api.members.moveToInactive(id);
    await refreshData();
  }, [refreshData]);

  const reactivateMember = useCallback(async (id: string): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    await api.members.reactivate(id);
    await refreshData();
  }, [refreshData]);

  const savePlan = useCallback(async (data: any): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    if (data.id) {
      await api.plans.update(data.id, data);
    } else {
      await api.plans.create(data);
    }
    await refreshData();
  }, [refreshData]);

  const togglePlan = useCallback(async (id: string): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    await api.plans.toggleStatus(id);
    await refreshData();
  }, [refreshData]);

  const saveUser = useCallback(async (data: any): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    if (data.id) {
      await api.users.update(data.id, data);
    } else {
      await api.users.create(data);
    }
    await refreshData();
  }, [refreshData]);

  const toggleUser = useCallback(async (id: string): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    await api.users.toggleStatus(id);
    await refreshData();
  }, [refreshData]);

  const markNotifRead = useCallback(async (id: string): Promise<void> => {
    await api.notifications.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.notifications.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
  }, []);

  const triggerReminders = useCallback(async (): Promise<number> => {
    const res = await api.notifications.triggerReminders();
    await refreshData();
    return res.notificationsCreated;
  }, [refreshData]);

  const updateSettings = useCallback(async (data: any): Promise<void> => {
    if (!navigator.onLine) throw new Error("No internet connection.");
    const updated = await api.settings.update(data);
    setSettings(updated);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        setupInitialAdmin,
        logout,
        screen,
        screenParams,
        navigate,
        goBack,
        members,
        plans,
        users,
        notifications,
        settings,
        unreadCount,
        isLoading,
        isOnline,
        error,
        clearError,
        refreshData,
        createMember,
        updateMember,
        uploadMemberPhoto,
        deleteMemberPhoto,
        renewMembership,
        recordPayment,
        moveToInactive,
        reactivateMember,
        savePlan,
        togglePlan,
        saveUser,
        toggleUser,
        markNotifRead,
        markAllRead,
        triggerReminders,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
