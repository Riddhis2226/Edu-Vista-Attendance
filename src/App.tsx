import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import FacultyLayout from "./layouts/FacultyLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import StudentManagement from "./pages/admin/StudentManagement";
import FaceEnrollment from "./pages/admin/FaceEnrollment";
import AttendanceLogs from "./pages/admin/AttendanceLogs";
import FacultyManagement from "./pages/admin/FacultyManagement";
import LectureTargets from "./pages/admin/LectureTargets";
import FacultyOverview from "./pages/faculty/FacultyOverview";
import UploadPhoto from "./pages/faculty/UploadPhoto";
import UploadDataset from "./pages/faculty/UploadDataset";
import FacultyHistory from "./pages/faculty/FacultyHistory";
import FacultyAnalytics from "./pages/faculty/FacultyAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="face-enrollment" element={<FaceEnrollment />} />
              <Route path="attendance-logs" element={<AttendanceLogs />} />
              <Route path="faculty" element={<FacultyManagement />} />
              <Route path="lecture-targets" element={<LectureTargets />} />
            </Route>

            {/* Faculty routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRole="faculty"><FacultyLayout /></ProtectedRoute>}>
              <Route index element={<FacultyOverview />} />
              <Route path="upload-photo" element={<UploadPhoto />} />
              <Route path="upload-dataset" element={<UploadDataset />} />
              <Route path="history" element={<FacultyHistory />} />
              <Route path="analytics" element={<FacultyAnalytics />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
