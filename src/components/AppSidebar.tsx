import { 
  Home, Users, UserCog, FileText, FilePlus, TestTube, Scan, 
  Settings, MessageSquare, HelpCircle, Loader2, Menu, LogOut, User, ArrowRightLeft,
  LayoutDashboard, HeartPulse, FlaskConical, Mail, ClipboardList, Microscope
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
import { cn } from "@/lib/utils";

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

  // CSS Classes for dark mode compatibility
  const sidebarClasses = "bg-background border-r border-border dark:bg-zinc-900 dark:border-zinc-800";
  const menuItemClasses = "dark:hover:bg-zinc-800 dark:text-zinc-200"; 

  // --- Core Function to Fetch User Role ---
  const fetchUserRole = async (userOrId: any) => {
    // Accept either a user object or a userId string
    const userId = typeof userOrId === "string" ? userOrId : userOrId?.id;
    const userObj = typeof userOrId === "object" ? userOrId : null;

    try {
      // Try the normal lookup first
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, account_number")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Supabase role fetch error in AppSidebar:", error);
      }

      // If role found, use it
      if (data?.role) {
        setUserRole(data.role);
        return;
      }

      // FALLBACKS: make staff accounts visible even if role row is missing / blocked
      // 1) Known seeded staff email
      if (userObj?.email === "staff@careconnect.com") {
        setUserRole("staff");
        return;
      }

      // 2) user metadata contains an account_number we seeded
      if (userObj?.user_metadata?.account_number === "STAFF001") {
        setUserRole("staff");
        return;
      }

      // 3) if account_number exists in the role row (from maybeSingle) treat as staff mapping
      if (data?.account_number === "STAFF001") {
        setUserRole("staff");
        return;
      }

      // nothing matched
      setUserRole(null);
    } catch (err) {
      console.error("General error fetching user role in AppSidebar:", err);
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
      fetchUserRole(session.user);
      // populate display name/avatar if available
      const user = session.user;
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email || null);
      setUserAvatar(user.user_metadata?.avatar_url || null);
    } else {
      setIsLoading(false);
      setUserRole(null);
    }
  });

    // 2. Set up the listener for authentication events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        fetchUserRole(session.user);
        setUserName(session.user.user_metadata?.full_name || session.user.email || null);
      } else if (event === "SIGNED_OUT") {
        setUserRole(null);
        setIsLoading(false);
        setUserName(null);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  // --- NAVIGATION ITEMS DEFINITION ---
  const getNavItems = (role: string | null): NavItem[] => {
    // STAFF/ADMIN MENU (Full access to all system features)
    if (role === 'staff') {
      return [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Patients", url: "/dashboard/patients", icon: Users },
        { title: "Nurses", url: "/dashboard/nurses", icon: HeartPulse },
        { title: "Laboratory", url: "/dashboard/laboratory", icon: FlaskConical },
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
        { title: "Technologists", url: "/dashboard/technologists", icon: Microscope },
        { title: "Shift Handover", url: "/dashboard/shift-handover", icon: ClipboardList },
        { title: "Messages", url: "/dashboard/messages", icon: Mail },
      ];
    }
    
    // PATIENT MENU (Limited to own records ONLY - NO other access)
    // Help & Support removed - accessible via header dropdown
    if (role === 'patient') {
      return [
        { title: "My Records", url: "/dashboard/my-records", icon: FileText },
      ];
    }
    
    // DOCTOR MENU (Clinical access - NO Shift Handover, NO Help in sidebar)
    if (role === 'doctor') {
      return [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Patients", url: "/dashboard/patients", icon: Users },
        { title: "Laboratory", url: "/dashboard/laboratory", icon: FlaskConical },
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
        { title: "Messages", url: "/dashboard/messages", icon: Mail },
      ];
    }
    
    // NURSE MENU (Clinical documentation focus - includes Shift Handover)
    if (role === 'nurse') {
      return [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Patients", url: "/dashboard/patients", icon: Users },
        { title: "Laboratory", url: "/dashboard/laboratory", icon: FlaskConical },
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
        { title: "Shift Handover", url: "/dashboard/shift-handover", icon: ClipboardList },
        { title: "Messages", url: "/dashboard/messages", icon: Mail },
      ];
    }
    
    // MEDTECH MENU (Laboratory-focused)
    if (role === 'medtech') {
      return [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Laboratory", url: "/dashboard/laboratory", icon: FlaskConical },
        { title: "Messages", url: "/dashboard/messages", icon: Mail },
      ];
    }
    
    // RADTECH MENU (Imaging-focused)
    if (role === 'radtech') {
      return [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Imaging", url: "/dashboard/imaging", icon: Scan },
        { title: "Messages", url: "/dashboard/messages", icon: Mail },
      ];
    }
    
    // Default fallback (should not normally happen)
    return [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ];
  };

  // For non-patient roles, no additional common items needed as they're already included
  const getFullNavItems = (role: string | null): NavItem[] => {
    return getNavItems(role);
  };

  const navItems = getFullNavItems(userRole);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <>
      {/* Fixed top header shown on every page */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b border-border dark:bg-zinc-900 dark:border-zinc-800 flex items-center px-4">
        <button
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:scale-105 transition-transform dark:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 ml-3">
          <img src={logoImage} alt="CareConnect logo" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-semibold text-lg text-foreground dark:text-white">CareConnect</span>
        </div>

        {/* User menu in header (upper-right) */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium text-foreground dark:text-zinc-200">{userName || 'Sign in'}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-150 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-400"
                aria-label="Open user menu"
              >
                <span className="sr-only">Open user menu</span>
                <User className="h-4 w-4 text-foreground dark:text-zinc-200 group-hover:text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate('/dashboard/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/dashboard/help-support')}>  {/* Changed from /dashboard/help */}
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {userName ? (
                <DropdownMenuItem onSelect={handleSignOut}>
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