import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser     = localStorage.getItem('user');
        const storedTenant   = localStorage.getItem('tenant_id');
        const storedToken    = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setTenantId(storedTenant);
        }
        setLoading(false);
    }, []);

    const login = async (email, password, tenant_id) => {
        const res = await api.post('/auth/login', { email, password, tenant_id });
        const { user, token, tenant_id: tid } = res.data;

        localStorage.setItem('token',     token);
        localStorage.setItem('user',      JSON.stringify(user));
        localStorage.setItem('tenant_id', tid);

        setUser(user);
        setTenantId(tid);
        return user;
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant_id');
        setUser(null);
        setTenantId(null);
    };

    const hasRole = (role) => user?.roles?.includes(role);
    const hasPermission = (perm) => user?.permissions?.includes(perm);

    return (
        <AuthContext.Provider value={{ user, tenantId, loading, login, logout, hasRole, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);