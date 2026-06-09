import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { usePortalAuth } from './context/PortalAuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import Staff from './pages/staff/Staff';
import Fees from './pages/fees/Fees';
import PortalLogin from './pages/portal/PortalLogin';
import StudentDashboard from './pages/portal/student/StudentDashboard';
import StudentFees from './pages/portal/student/StudentFees';
import StudentAssignments from './pages/portal/student/StudentAssignments';
import StudentResults from './pages/portal/student/StudentResults';
import TeacherDashboard from './pages/portal/teacher/TeacherDashboard';
import ParentDashboard from './pages/portal/parent/ParentDashboard';
import TeacherAnnouncements from './pages/portal/teacher/TeacherAnnouncements';
import StudentAnnouncements from './pages/portal/student/StudentAnnouncements';



function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    return user ? children : <Navigate to="/login" />;
}

function PortalRoute({ children, role }) {
    const { user, loading } = usePortalAuth();
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!user) return <Navigate to="/portal/login" />;
    if (role && user.role !== role) return <Navigate to="/portal/login" />;
    return children;
}

export default function App() {
    return (
        <Routes>
            {/* Admin routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />

            {/* Portal routes */}
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/student" element={<PortalRoute role="student"><StudentDashboard /></PortalRoute>} />
            <Route path="/portal/student/fees" element={<PortalRoute role="student"><StudentFees /></PortalRoute>} />
            <Route path="/portal/student/assignments" element={<PortalRoute role="student"><StudentAssignments /></PortalRoute>} />
            <Route path="/portal/student/results" element={<PortalRoute role="student"><StudentResults /></PortalRoute>} />
            <Route path="/portal/teacher" element={<PortalRoute role="teacher"><TeacherDashboard /></PortalRoute>} />
            <Route path="/portal/parent" element={<PortalRoute role="parent"><ParentDashboard /></PortalRoute>} />
            <Route path="/portal/teacher/announcements" element={<PortalRoute role="teacher"><TeacherAnnouncements /></PortalRoute>} />
            <Route path="/portal/teacher/announcements" element={<PortalRoute role="teacher"><TeacherAnnouncements /></PortalRoute>} />
<Route path="/portal/student/announcements" element={<PortalRoute role="student"><StudentAnnouncements /></PortalRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}