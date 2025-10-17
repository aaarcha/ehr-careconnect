import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, UserPlus, Bed, Stethoscope, Heart, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar } from "@/components/ui/calendar";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const Home = () => {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Calendar</CardTitle>
          <CardDescription>View appointments and schedules</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
