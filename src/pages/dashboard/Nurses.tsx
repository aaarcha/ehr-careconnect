import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse } from "lucide-react";

interface Nurse {
  id: string;
  name: string;
  nurse_no: string;
  department: string;
}

const Nurses = () => {
  const { toast } = useToast();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setNurses(data || []);
    } catch (error: any) {
      console.error("Error fetching nurses:", error);
      toast({
        title: "Error",
        description: "Failed to load nurses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNursesByDepartment = (department: string) => {
    return nurses.filter((nurse) => nurse.department === department);
  };

  const NurseTable = ({ department }: { department: string }) => {
    const departmentNurses = getNursesByDepartment(department);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5" />
            {department} Nurses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : departmentNurses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No nurses assigned to {department} yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Nurse No.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentNurses.map((nurse) => (
                  <TableRow key={nurse.id}>
                    <TableCell className="font-medium">{nurse.name}</TableCell>
                    <TableCell>{nurse.nurse_no}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary">Nursing Staff</h1>
        <p className="text-muted-foreground">Directory of nurses by department</p>
      </div>

      <Tabs defaultValue="WARD" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="WARD">WARD</TabsTrigger>
          <TabsTrigger value="OR">OR</TabsTrigger>
          <TabsTrigger value="ICU">ICU</TabsTrigger>
          <TabsTrigger value="ER">ER</TabsTrigger>
          <TabsTrigger value="HEMO">HEMO</TabsTrigger>
        </TabsList>

        <TabsContent value="WARD">
          <NurseTable department="WARD" />
        </TabsContent>

        <TabsContent value="OR">
          <NurseTable department="OR" />
        </TabsContent>

        <TabsContent value="ICU">
          <NurseTable department="ICU" />
        </TabsContent>

        <TabsContent value="ER">
          <NurseTable department="ER" />
        </TabsContent>

        <TabsContent value="HEMO">
          <NurseTable department="HEMO" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nurses;
