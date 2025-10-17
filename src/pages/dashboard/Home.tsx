import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, UserPlus, Bed, Stethoscope, Heart, Droplet } from "lucide-react";

const stats = [
  { title: "Emergency", value: "12", icon: Activity, color: "text-red-500" },
  { title: "In Patient", value: "45", icon: Bed, color: "text-blue-500" },
  { title: "Out Patient", value: "28", icon: UserPlus, color: "text-green-500" },
  { title: "Ward", value: "32", icon: Users, color: "text-purple-500" },
  { title: "OR", value: "3", icon: Stethoscope, color: "text-orange-500" },
  { title: "ICU", value: "8", icon: Heart, color: "text-pink-500" },
  { title: "Hemo", value: "6", icon: Droplet, color: "text-cyan-500" },
];

const Home = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to CareConnect EHR System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-elegant transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">Active patients</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Patients Trend</CardTitle>
            <CardDescription>Patient admissions over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Chart placeholder - Line graph would go here
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Patients per department</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Chart placeholder - Bar/Pie graph would go here
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Upcoming appointments and schedules</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Calendar component would go here
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
