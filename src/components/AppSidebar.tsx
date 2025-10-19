import { Home, Users, UserCog, FileText, FilePlus, Menu, Activity, TestTube, Scan, Settings, MessageSquare, HelpCircle, UserCheck } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import logoImage from "@/assets/CareConnectLogo.jpg";

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setUserRole(data?.role || null);
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
    ];

    // Only show role-specific items when role is explicitly confirmed
    if (userRole === 'staff') {
      return [
        ...baseItems,
        { title: "Decking", url: "/dashboard/decking", icon: Users },
        { title: "Nurses", url: "/dashboard/nurses", icon: UserCog },
        { title: "Laboratory", url: "/dashboard/laboratory", icon: TestTube },
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
        { title: "Patient Records", url: "/dashboard/patients", icon: FileText },
        { title: "Add Patient", url: "/dashboard/add-patient", icon: FilePlus },
        { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "Help", url: "/dashboard/help", icon: HelpCircle },
      ];
    }

    if (userRole === 'medtech') {
      return [
        ...baseItems,
        { title: "Laboratory", url: "/dashboard/laboratory", icon: TestTube },
        { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "Help", url: "/dashboard/help", icon: HelpCircle },
      ];
    }

    if (userRole === 'radtech') {
      return [
        ...baseItems,
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
        { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "Help", url: "/dashboard/help", icon: HelpCircle },
      ];
    }

    if (userRole === 'patient') {
      return [
        ...baseItems,
        { title: "My Records", url: "/dashboard/my-records", icon: FileText },
        { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "Help", url: "/dashboard/help", icon: HelpCircle },
      ];
    }

    // Default: only Dashboard when role is unknown/null
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"}>
      <div className="p-4 border-b border-sidebar-border">
        {state !== "collapsed" && (
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="CareConnect" className="w-10 h-10 object-contain" />
            <span className="font-bold text-sidebar-foreground">CareConnect</span>
          </div>
        )}
      </div>
      
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full"
        >
          {state !== "collapsed" && "Logout"}
          {state === "collapsed" && "⏻"}
        </Button>
      </div>
    </Sidebar>
  );
}
