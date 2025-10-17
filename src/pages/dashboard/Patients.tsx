import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Patients = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Patient Records</h1>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archive</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Patients</CardTitle>
            </CardHeader>
            <CardContent>Patient list will be displayed here</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Archived Patients</CardTitle>
            </CardHeader>
            <CardContent>Archived patient list</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Patients;
