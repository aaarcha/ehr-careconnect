import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/dashboard/Home";
import Decking from "./pages/dashboard/Decking";
import Nurses from "./pages/dashboard/Nurses";
import Laboratory from "./pages/dashboard/Laboratory";
import Imaging from "./pages/dashboard/Imaging";
import Patients from "./pages/dashboard/Patients";
import AddPatient from "./pages/dashboard/AddPatient";
import PatientRecord from "./pages/dashboard/PatientRecord";
import Settings from "./pages/dashboard/Settings";
import Messages from "./pages/dashboard/Messages";
import HelpSupport from "./pages/dashboard/HelpSupport";
import MyRecords from "./pages/dashboard/MyRecords";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

import { ThemeProvider } from "./providers/ThemeProvider";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientRecord />} />
              <Route path="add-patient" element={<AddPatient />} />
              <Route path="nurses" element={<Nurses />} />
              <Route path="laboratory" element={<Laboratory />} />
              <Route path="imaging" element={<Imaging />} />
              <Route path="settings" element={<Settings />} />
              <Route path="decking" element={<Decking />} />
              <Route path="messages" element={<Messages />} />
              <Route path="help-support" element={<HelpSupport />} />
              <Route path="my-records" element={<MyRecords />} />
            </Route>
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
