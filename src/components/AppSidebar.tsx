import { 
  Home, Users, UserCog, FileText, FilePlus, TestTube, Scan, 
  Settings, MessageSquare, HelpCircle, Loader2, Menu, LogOut, User
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
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
      // Try to populate a friendly display name and avatar if available
      const user = session.user;
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email || null);
      setUserAvatar(user.user_metadata?.avatar_url || null);
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
    <>
      {/* Fixed top header shown on every page */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center px-4">
        <button
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:scale-105 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 ml-3">
          <img src={logoImage} alt="CareConnect logo" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-semibold text-lg">CareConnect</span>
        </div>

        {/* User menu in header (upper-right) */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{userName || 'Sign in'}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-150 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-400"
                aria-label="Open user menu"
              >
                <span className="sr-only">Open user menu</span>
                <User className="h-4 w-4 text-gray-700 group-hover:text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate('/dashboard/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/dashboard/help')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {userName ? (
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-red-600">Sign out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => navigate('/auth')}>Sign in</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

  <Sidebar style={{ top: "3.5rem" }} className={`${state === "collapsed" ? "w-14" : "w-64"} bg-white text-gray-800 dark:text-gray-100`}>

      {/* CRITICAL FIX: Key forces re-render when role or loading status changes. */}
  <SidebarContent key={userRole || (isLoading ? "loading" : "no-role") } className="pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-full p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center gap-2 p-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-400 text-white font-medium shadow-sm"
                          : "flex items-center gap-2 p-2 rounded-md text-gray-700 hover:bg-emerald-100 hover:text-gray-800"
                      }
                    >
                      <item.icon className="h-4 w-4 text-current" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

    {/* Remove sign out from the sidebar footer; account actions moved to header */}
    </Sidebar>
    </>
  );
}