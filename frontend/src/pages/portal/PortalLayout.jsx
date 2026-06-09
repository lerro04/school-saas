import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { LayoutDashboard, BookOpen, TrendingUp, DollarSign, Megaphone, LogOut, ClipboardList, Users } from 'lucide-react';

export default function PortalLayout({ children }) {
    const { user, logout } = usePortalAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/portal/login');
    };

    const roleColor = {
        student: 'bg-emerald-600',
        parent:  'bg-blue-600',
        teacher: 'bg-purple-600',
    };

    import { LayoutDashboard, BookOpen, TrendingUp, DollarSign, Megaphone, LogOut, ClipboardList, Users } from 'lucide-react';

const navLinks = {
    student: [
        { label: 'Dashboard',     path: '/portal/student',               icon: LayoutDashboard },
        { label: 'Assignments',   path: '/portal/student/assignments',    icon: BookOpen },
        { label: 'My Results',    path: '/portal/student/results',        icon: TrendingUp },
        { label: 'Fee Balance',   path: '/portal/student/fees',           icon: DollarSign },
        { label: 'Announcements', path: '/portal/student/announcements',  icon: Megaphone },
    ],
    parent: [
        { label: 'Dashboard',     path: '/portal/parent',         icon: LayoutDashboard },
        { label: 'Results',       path: '/portal/parent/results', icon: TrendingUp },
        { label: 'Fees',          path: '/portal/parent/fees',    icon: DollarSign },
        { label: 'Notices',       path: '/portal/parent/notices', icon: Megaphone },
    ],
    teacher: [
        { label: 'Dashboard',     path: '/portal/teacher',                  icon: LayoutDashboard },
        { label: 'Assignments',   path: '/portal/teacher/assignments',       icon: BookOpen },
        { label: 'Submissions',   path: '/portal/teacher/submissions',       icon: ClipboardList },
        { label: 'Announcements', path: '/portal/teacher/announcements',     icon: Megaphone },
    ],
};

    const links = navLinks[user?.role] ?? [];

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-5 border-b border-gray-800">
                   <div className={`w-10 h-10 rounded-xl ${roleColor[user?.role]} flex items-center justify-center mb-3`}>
    {user?.role === 'student' ? <BookOpen size={20} className="text-white" /> :
     user?.role === 'parent'  ? <Users size={20} className="text-white" /> :
     <UserCheck size={20} className="text-white" />}
</div>
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-gray-400 text-xs capitalize">{user?.role} Portal</p>
                    {user?.reference?.student_number && (
                        <p className="text-gray-500 text-xs mt-0.5">{user.reference.student_number}</p>
                    )}
                </div>

                <nav className="flex-1 py-4">
                    {links.map(link => (
    <a key={link.path} href={link.path}
        className="flex items-center gap-3 px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition">
        <link.icon size={18} />
        <span>{link.label}</span>
    </a>
))}
                </nav>

                <div className="p-5 border-t border-gray-800">
                    <button onClick={handleLogout}
    className="flex items-center gap-3 text-sm text-gray-400 hover:text-white w-full">
    <LogOut size={18} /><span>Logout</span>
</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-700">
                        {localStorage.getItem('portal_tenant')} — {user?.role} portal
                    </h2>
                    <span className={`text-xs text-white px-3 py-1 rounded-full capitalize ${roleColor[user?.role]}`}>
                        {user?.role}
                    </span>
                </header>
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}