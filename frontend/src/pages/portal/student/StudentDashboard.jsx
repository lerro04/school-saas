import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { usePortalAuth } from '../../../context/PortalAuthContext';

export default function StudentDashboard() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const { user }              = usePortalAuth();

    useEffect(() => {
        portalApi.get('/student/dashboard')
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.reference?.first_name}!</h1>
                <p className="text-gray-500 text-sm mt-0.5">{user?.reference?.student_number}</p>
            </div>

            {/* Fee summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Total Balance Due</p>
                    <p className="text-2xl font-bold text-red-600">${Number(data?.total_balance ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Pending Assignments</p>
                    <p className="text-2xl font-bold text-blue-600">{data?.assignments?.length ?? 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Results Available</p>
                    <p className="text-2xl font-bold text-emerald-600">{data?.results?.length ?? 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Upcoming assignments */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">Upcoming Assignments</h3>
                    {data?.assignments?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No upcoming assignments</p>
                    ) : data?.assignments?.map(a => (
                        <div key={a.id} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{a.title}</p>
                                <p className="text-xs text-gray-500">{a.subject} — {a.type}</p>
                            </div>
                            <span className="text-xs text-orange-600 font-medium">
                                Due {new Date(a.due_date).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">School Notices</h3>
                    {data?.announcements?.length === 0 ? (
                        <p className="text-gray-400 text-sm">No announcements</p>
                    ) : data?.announcements?.map(a => (
                        <div key={a.id} className="py-3 border-b last:border-0">
                            <p className="text-sm font-medium text-gray-800">{a.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{a.body.substring(0, 80)}...</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PortalLayout>
    );
}