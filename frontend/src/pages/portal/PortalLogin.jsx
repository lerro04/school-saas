import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { GraduationCap } from 'lucide-react';

export default function PortalLogin() {
    const [form, setForm]       = useState({ email: '', password: '', tenant_id: '' });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const { login }             = usePortalAuth();
    const navigate              = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('Attempting login to:', 'http://127.0.0.1:8000/api/portal/login');
        try {
            const user = await login(form.email, form.password, form.tenant_id);
            if (user.role === 'student') navigate('/portal/student');
            else if (user.role === 'parent') navigate('/portal/parent');
            else if (user.role === 'teacher') navigate('/portal/teacher');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <GraduationCap size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to access your portal</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
                        <input type="text" placeholder="e.g. harare-high" required
                            value={form.tenant_id}
                            onChange={e => setForm({...form, tenant_id: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" required
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" required
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Admin? <a href="/login" className="text-emerald-600 hover:underline">Go to admin login</a>
                </p>
            </div>
        </div>
    );
}
