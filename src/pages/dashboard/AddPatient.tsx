import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AddPatient = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Add New Patient</h1>
      <Tabs defaultValue="demographics">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs & Medical History</TabsTrigger>
          <TabsTrigger value="assessment">Physical Assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
            </CardHeader>
            <CardContent>Form fields will be here</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs & Medical History</CardTitle>
            </CardHeader>
            <CardContent>Vital signs form</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle>Physical Assessment</CardTitle>
            </CardHeader>
            <CardContent>Assessment form</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddPatient;
