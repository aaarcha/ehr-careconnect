import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, UserPlus, Bed, Stethoscope, Heart, Droplet, Plus, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";

// Pleasant green palette used for charts
const GREEN_PALETTE = ['#59AC77', '#3A6F43', '#FDAAAA', '#FFD5D5', '#F8F7BA', '#BDE3C3', '#A3CCDA'];

interface Appointment {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'appointment' | 'schedule' | 'reminder';
  description?: string;
}

const Home = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [stats, setStats] = useState({
    emergency: 0,
    inPatient: 0,
    outPatient: 0,
    ward: 0,
    or: 0,
    icu: 0,
    hemo: 0,
  });
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    time: '',
    type: 'appointment' as 'appointment' | 'schedule' | 'reminder',
    description: '',
  });

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setUserRole(data?.role || null);
      }
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && userRole !== 'patient') {
      fetchDashboardData();
      // Load appointments from localStorage
      const stored = localStorage.getItem('careconnect_appointments');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAppointments(parsed.map((a: any) => ({ ...a, date: new Date(a.date) })));
      }
    }
  }, [roleLoading, userRole]);

  // Redirect patients to My Records
  if (!roleLoading && userRole === 'patient') {
    return <Navigate to="/dashboard/my-records" replace />;
  }

  const fetchDashboardData = async () => {
    try {
      const { data: patients, error } = await supabase
        .from("patients")
        .select("admit_to_department, admit_to_location")
        .eq("status", "active");

      if (error) throw error;

      // Calculate stats
      const deptCounts: any = {
        WARD: 0,
        OR: 0,
        ICU: 0,
        ER: 0,
        HEMO: 0,
      };

      patients?.forEach((patient) => {
        const dept = patient.admit_to_department;
        if (dept && deptCounts.hasOwnProperty(dept)) {
          deptCounts[dept]++;
        }
      });

      setStats({
        emergency: deptCounts.ER || 0,
        inPatient: (deptCounts.WARD || 0) + (deptCounts.ICU || 0),
        outPatient: patients?.length || 0,
        ward: deptCounts.WARD || 0,
        or: deptCounts.OR || 0,
        icu: deptCounts.ICU || 0,
        hemo: deptCounts.HEMO || 0,
      });

      // Prepare department distribution data
      const deptData = Object.keys(deptCounts).map((dept) => ({
        name: dept,
        value: deptCounts[dept],
      }));
      setDepartmentData(deptData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAppointments = (apps: Appointment[]) => {
    localStorage.setItem('careconnect_appointments', JSON.stringify(apps));
  };

  const handleAddAppointment = () => {
    if (!date || !newAppointment.title || !newAppointment.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      title: newAppointment.title,
      date: date,
      time: newAppointment.time,
      type: newAppointment.type,
      description: newAppointment.description,
    };

    const updated = [...appointments, appointment];
    setAppointments(updated);
    saveAppointments(updated);
    setDialogOpen(false);
    setNewAppointment({ title: '', time: '', type: 'appointment', description: '' });
    toast.success("Appointment added successfully");
  };

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    saveAppointments(updated);
    toast.success("Appointment removed");
  };

  const selectedDateAppointments = appointments.filter(a => 
    date && isSameDay(a.date, date)
  );

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = appointments.map(a => a.date);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-500';
      case 'schedule': return 'bg-green-500';
      case 'reminder': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'appointment': return 'default';
      case 'schedule': return 'secondary';
      case 'reminder': return 'outline';
      default: return 'default';
    }
  };

  const statCards = [
    { title: "Emergency", value: stats.emergency.toString(), icon: Activity, color: "text-red-500" },
    { title: "In Patient", value: stats.inPatient.toString(), icon: Bed, color: "text-blue-500" },
    { title: "Out Patient", value: stats.outPatient.toString(), icon: UserPlus, color: "text-green-500" },
    { title: "Ward", value: stats.ward.toString(), icon: Users, color: "text-purple-500" },
    { title: "OR", value: stats.or.toString(), icon: Stethoscope, color: "text-orange-500" },
    { title: "ICU", value: stats.icu.toString(), icon: Heart, color: "text-pink-500" },
    { title: "Hemo", value: stats.hemo.toString(), icon: Droplet, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to CareConnect EHR System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-elegant transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground">Active patients</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Active patients per department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
              </div>
            ) : departmentData.length > 0 ? (
              <ChartContainer
                config={Object.fromEntries(
                  departmentData.map((d, i) => [d.name, { label: d.name, color: GREEN_PALETTE[i % GREEN_PALETTE.length] }]),
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value">
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`var(--color-${entry.name})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution (Pie)</CardTitle>
            <CardDescription>Visual breakdown by department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
              </div>
            ) : departmentData.length > 0 ? (
              <ChartContainer
                config={Object.fromEntries(
                  departmentData.map((d, i) => [d.name, { label: d.name, color: GREEN_PALETTE[i % GREEN_PALETTE.length] }]),
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`var(--color-${entry.name})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Schedule Calendar
            </CardTitle>
            <CardDescription>View and manage appointments and schedules</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Selected Date</Label>
                  <Input 
                    value={date ? format(date, 'MMMM dd, yyyy') : 'Select a date'} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title"
                    placeholder="Event title"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input 
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={newAppointment.type} 
                    onValueChange={(value: 'appointment' | 'schedule' | 'reminder') => 
                      setNewAppointment(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    placeholder="Optional description"
                    value={newAppointment.description}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddAppointment}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={{
                  hasAppointment: datesWithAppointments,
                }}
                modifiersStyles={{
                  hasAppointment: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    borderRadius: '50%',
                  }
                }}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {date ? format(date, 'MMMM dd, yyyy') : 'Select a date'}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {selectedDateAppointments.length} event(s)
                </span>
              </div>
              
              {selectedDateAppointments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedDateAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getTypeColor(apt.type)}`} />
                            <span className="font-medium">{apt.title}</span>
                            <Badge variant={getTypeBadgeVariant(apt.type) as any} className="text-xs">
                              {apt.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {apt.time}
                          </p>
                          {apt.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {apt.description}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAppointment(apt.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events scheduled for this date</p>
                  <p className="text-sm">Click "Add Event" to create one</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;