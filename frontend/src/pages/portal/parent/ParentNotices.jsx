import { useEffect, useState } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { Megaphone, Paperclip, X } from 'lucide-react';

export default function ParentNotices() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        portalApi.get('/announcements', { params: { audience: 'parents' } })
            .then(r => setNotices(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Notices</h1>

            {notices.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No notices yet</div>
            ) : (
                <div className="space-y-4">
                    {notices.map(notice => (
                        <div key={notice.id} onClick={() => setSelected(notice)}
                            className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition">
                            <div className="flex items-start gap-3">
                                <Megaphone size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800">{notice.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(notice.created_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{notice.body}</p>
                                    {notice.attachment_name && (
                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2">
                                            <Paperclip size={12} /> {notice.attachment_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between p-6 border-b">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{selected.title}</h2>
                                <p className="text-xs text-gray-400 mt-1">{new Date(selected.created_at).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 ml-4"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
                            {selected.attachment_path && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">ATTACHED DOCUMENT</p>
                                    <a href={`http://127.0.0.1:8000/storage/${selected.attachment_path}`}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        <Paperclip size={16} /> {selected.attachment_name ?? 'Open attachment'}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}
