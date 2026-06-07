import { createContext, useContext, useState, useEffect } from 'react';
import portalApi from '../services/portalApi';

const PortalAuthContext = createContext(null);

export function PortalAuthProvider({ children }) {
    const [user, setUser]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('portal_user');
        const token  = localStorage.getItem('portal_token');
        if (stored && token) setUser(JSON.parse(stored));
        setLoading(false);
    }, []);

    const login = async (email, password, tenant_id) => {
        const res = await portalApi.post('/login', { email, password, tenant_id });
        const { user, token } = res.data;
        localStorage.setItem('portal_token',  token);
        localStorage.setItem('portal_user',   JSON.stringify(user));
        localStorage.setItem('portal_tenant', tenant_id);
        setUser(user);
        return user;
    };

    const logout = async () => {
        try { await portalApi.post('/logout'); } catch {}
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_user');
        localStorage.removeItem('portal_tenant');
        setUser(null);
    };

    return (
        <PortalAuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </PortalAuthContext.Provider>
    );
}

export const usePortalAuth = () => useContext(PortalAuthContext);