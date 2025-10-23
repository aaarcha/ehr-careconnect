import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 pt-14 p-6 bg-background dark:bg-zinc-900">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
