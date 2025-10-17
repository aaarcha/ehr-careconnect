import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Nurses = () => {
  const { data: nurses } = useQuery({
    queryKey: ["nurses"],
    queryFn: async () => {
      const { data } = await supabase.from("nurses").select("*").order("department", { ascending: true });
      return data;
    },
  });

  const groupedNurses = nurses?.reduce((acc, nurse) => {
    if (!acc[nurse.department]) acc[nurse.department] = [];
    acc[nurse.department].push(nurse);
    return acc;
  }, {} as Record<string, typeof nurses>);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Nurses Directory</h1>
      {groupedNurses && Object.entries(groupedNurses).map(([dept, nurseList]) => (
        <Card key={dept}>
          <CardHeader>
            <CardTitle>{dept}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Nurse No.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nurseList.map((nurse) => (
                  <TableRow key={nurse.id}>
                    <TableCell>{nurse.name}</TableCell>
                    <TableCell>{nurse.nurse_no}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Nurses;
