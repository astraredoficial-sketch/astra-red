import { AppNav } from "@/components/AppNav";
import { NotificationCenter } from "@/components/NotificationCenter";

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <AppNav />
      <NotificationCenter />
    </div>
  );
}
