import React from 'react';
import eduvistaLogo from '@/assets/eduvista-logo.png';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, LayoutDashboard, Users, ScanFace, ClipboardList, UserCog, LogOut, Menu, Target, History, Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const adminNav = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard },
  { title: 'Students', url: '/admin/students', icon: Users },
  { title: 'Face Enrollment', url: '/admin/face-enrollment', icon: ScanFace },
  { title: 'Attendance Logs', url: '/admin/attendance-logs', icon: ClipboardList },
  { title: 'Lecture Targets', url: '/admin/lecture-targets', icon: Target },
  { title: 'Faculty', url: '/admin/faculty', icon: UserCog },
  { title: 'Audit Log', url: '/admin/audit-log', icon: History },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

function AdminSidebarContent() {
  const { signOut, userName } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="glow-pulse shrink-0">
            <img src={eduvistaLogo} alt="EduVista" className="h-9 w-auto" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-foreground">EduVista</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== '/admin' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin'}
                        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent ${
                          isActive ? 'bg-sidebar-accent text-primary font-medium' : 'text-sidebar-foreground'
                        }`}
                        activeClassName=""
                      >
                        {isActive && (
                          <motion.div
                            layoutId="admin-active-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User section */}
        <div className="mt-auto border-t border-sidebar-border p-4">
          {!collapsed && (
            <p className="text-xs text-muted-foreground mb-2 truncate">{userName || 'Admin'}</p>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminLayout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
