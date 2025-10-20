import { 
  Home, Users, UserCog, FileText, FilePlus, TestTube, Scan, 
  Settings, MessageSquare, HelpCircle, Loader2 
} from "lucide-react";
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

// Define the structure for a navigation item
interface NavItem {
  title: string;
  url: string;
  icon: typeof Home; // Use a Lucide icon type
}

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  // Start in loading state until session is checked or listener fires
  const [isLoading, setIsLoading] = useState(true); 

  // --- Core Function to Fetch User Role ---
  const fetchUserRole = async (userId: string) => {
    try {
      // Use maybeSingle() to prevent errors if a user has no role record
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(); 

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "No rows found," which is handled by maybeSingle()
        console.error("Supabase role fetch error in AppSidebar:", error);
      }
      
      setUserRole(data?.role || null); 

    } catch (error) { 
      console.error("General error fetching user role in AppSidebar:", error);
      setUserRole(null); 
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Supabase Auth Listener & Initial Check ---
  useEffect(() => {
    
    // 1. Initial check for existing session on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            fetchUserRole(session.user.id);
        } else {
            setIsLoading(false);
            setUserRole(null);
        }
    });

    // 2. Set up the listener for authentication events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          fetchUserRole(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  // --- NAVIGATION ITEMS DEFINITION ---
  const getNavItems = (role: string | null): NavItem[] => {
    const baseItems: NavItem[] = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
    ];
    
    // STAFF/ADMIN MENU (Includes all requested items)
    if (role === 'staff') {
      return [
        ...baseItems,
        // Requested Items
        { title: "Decking", url: "/dashboard/decking", icon: Users },
        { title: "Nurses", url: "/dashboard/nurses", icon: UserCog },
        { title: "Patient Records", url: "/dashboard/patients", icon: FileText },
        { title: "Add Patient", url: "/dashboard/add-patient", icon: FilePlus },
        { title: "Laboratory", url: "/dashboard/laboratory", icon: TestTube },
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
      ];
    }

    // MEDTECH MENU
    if (role === 'medtech') {
      return [
        ...baseItems,
        { title: "Laboratory", url: "/dashboard/laboratory", icon: TestTube },
      ];
    }

    // RADTECH MENU
    if (role === 'radtech') {
      return [
        ...baseItems,
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
      ];
    }

    // PATIENT MENU
    if (role === 'patient') {
      return [
        ...baseItems,
        { title: "My Records", url: "/dashboard/my-records", icon: FileText },
      ];
    }

    // Default or Unknown Role
    return baseItems;
  };

  // Add common items (Settings, Help, Messages) for all users
  const getFullNavItems = (role: string | null): NavItem[] => {
    const roleSpecificItems = getNavItems(role);
    
    const commonItems: NavItem[] = [
      { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
      { title: "Help", url: "/dashboard/help", icon: HelpCircle },
    ];

    return [...roleSpecificItems, ...commonItems];
  };

  const navItems = getFullNavItems(userRole);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout error:", error);
    } else {
      toast.success("Logged out successfully.");
      navigate("/auth"); 
    }
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"}>
      <div className="flex items-center justify-center p-4">
        {state !== "collapsed" ? (
          <img src={logoImage} alt="CareConnect Logo" className="h-8 w-auto" />
        ) : (
          <img src={logoImage} alt="Logo" className="h-6 w-6" />
        )}
      </div>
      
      <SidebarTrigger className="m-2 self-end" />

      {/* CRITICAL FIX: Key forces re-render when role or loading status changes. */}
      <SidebarContent key={userRole || (isLoading ? "loading" : "no-role")}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
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
        )}
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