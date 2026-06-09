import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';

export default function StudentAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [selected, setSelected]           = useState(null);

    useEffect(() => {
        portalApi.get('/announcements', { params: { audience: 'students' } })
            .then(r => setAnnouncements(r.data))
            .finally(() => setLoading(false));
    }, []);

    const audienceColor = (a) => ({
        all:      'bg-blue-100 text-blue-700',
        students: 'bg-emerald-100 text-emerald-700',
        parents:  'bg-purple-100 text-purple-700',
        staff:    'bg-orange-100 text-orange-700',
    }[a] ?? 'bg-gray-100 text-gray-600');

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">School Announcements</h1>

            {announcements.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No announcements yet</div>
            ) : (
                <div className="space-y-4">
                    {announcements.map(a => (
                        <div key={a.id} className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition"
                            onClick={() => setSelected(a)}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📢</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">{a.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${audienceColor(a.audience)}`}>
                                    {a.audience}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 ml-11 line-clamp-2">{a.body}</p>
                            {a.attachment_name && (
                                <p className="text-xs text-blue-600 ml-11 mt-2">📎 {a.attachment_name}</p>
                            )}
                            <p className="text-xs text-emerald-600 ml-11 mt-2 font-medium">Click to read full message →</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Full announcement modal */}
            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between p-6 border-b">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{selected.title}</h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(selected.created_at).toLocaleDateString('en-ZW', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl ml-4">✕</button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.body}</p>

                            {selected.attachment_name && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">ATTACHED DOCUMENT</p>
                                    <a href={`http://127.0.0.1:8000/storage/${selected.attachment_path}`}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        📎 {selected.attachment_name}
                                        <span className="text-xs text-blue-400">— Click to open</span>
                                    </a>
                                </div>
                            )}

                            <button onClick={() => setSelected(null)}
                                className="mt-6 w-full border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}