import { AppProvider, useApp } from "./context/AppContext";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import AdminDashboard from "./screens/AdminDashboard";
import ManagerDashboard from "./screens/ManagerDashboard";
import MembersScreen from "./screens/MembersScreen";
import MemberProfile from "./screens/MemberProfile";
import AddMemberScreen from "./screens/AddMemberScreen";
import RenewMembership from "./screens/RenewMembership";
import PaymentsScreen from "./screens/PaymentsScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import MembershipPlansScreen from "./screens/MembershipPlansScreen";
import UserManagementScreen from "./screens/UserManagementScreen";
import ReminderSettingsScreen from "./screens/ReminderSettingsScreen";
import InactiveMembersScreen from "./screens/InactiveMembersScreen";

function AppShell() {
  const { screen, currentUser } = useApp();

  const showNav = currentUser && !["splash", "login"].includes(screen);

  return (
    <div className="bg-bg min-h-screen font-sans text-text">
      <div className="max-w-md mx-auto relative min-h-screen">
        {screen === "splash" && <SplashScreen />}
        {screen === "login" && <LoginScreen />}
        {screen === "admin-dashboard" && <AdminDashboard />}
        {screen === "manager-dashboard" && <ManagerDashboard />}
        {screen === "members" && <MembersScreen />}
        {screen === "member-profile" && <MemberProfile />}
        {screen === "add-member" && <AddMemberScreen />}
        {screen === "edit-member" && <AddMemberScreen />}
        {screen === "renew-membership" && <RenewMembership />}
        {screen === "payments" && <PaymentsScreen />}
        {screen === "notifications" && <NotificationsScreen />}
        {screen === "settings" && <SettingsScreen />}
        {screen === "plans" && currentUser?.role === "admin" && <MembershipPlansScreen />}
        {screen === "user-management" && currentUser?.role === "admin" && <UserManagementScreen />}
        {screen === "reminder-settings" && currentUser?.role === "admin" && <ReminderSettingsScreen />}
        {screen === "inactive-members" && <InactiveMembersScreen />}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
