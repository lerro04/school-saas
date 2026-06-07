import axios from 'axios';

const portalApi = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/portal',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

portalApi.interceptors.request.use((config) => {
    const token    = localStorage.getItem('portal_token');
    const tenantId = localStorage.getItem('portal_tenant');
    if (token)    config.headers.Authorization = `Bearer ${token}`;
    if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
    return config;
});

portalApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('portal_token');
            localStorage.removeItem('portal_user');
            localStorage.removeItem('portal_tenant');
            window.location.href = '/portal/login';
        }
        return Promise.reject(error);
    }
);

export default portalApi;