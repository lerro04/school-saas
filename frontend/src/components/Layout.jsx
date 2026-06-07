import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/',         label: 'Dashboard',  icon: '📊' },
    { path: '/students', label: 'Students',   icon: '🎓' },
    { path: '/fees',     label: 'Fees',       icon: '💰' },
    { path: '/staff',    label: 'Staff',      icon: '👥' },
];

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-blue-900 text-white flex flex-col transition-all duration-300`}>
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-blue-800">
                    {!collapsed && (
                        <div>
                            <h1 className="font-bold text-lg">SchoolSaaS</h1>
                            <p className="text-blue-300 text-xs truncate">{user?.name}</p>
                        </div>
                    )}
                    <button onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded hover:bg-blue-800 text-blue-300">
                        {collapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path} end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-blue-800
                                ${isActive ? 'bg-blue-700 border-r-4 border-blue-300 font-semibold' : 'text-blue-100'}`
                            }>
                            <span className="text-lg">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-blue-800">
                    <button onClick={handleLogout}
                        className="flex items-center gap-3 text-sm text-blue-300 hover:text-white w-full">
                        <span className="text-lg">🚪</span>
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-700 capitalize">
                        {window.location.pathname === '/' ? 'Dashboard' :
                         window.location.pathname.replace('/', '')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600">{user?.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {user?.roles?.[0]}
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}