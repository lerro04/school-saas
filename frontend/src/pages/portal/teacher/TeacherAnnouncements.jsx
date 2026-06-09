import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';

const emptyForm = { title: '', body: '', audience: 'all', file: null };

export default function TeacherAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [showModal, setShowModal]         = useState(false);
    const [editing, setEditing]             = useState(null);
    const [saving, setSaving]               = useState(false);
    const [message, setMessage]             = useState('');
    const [form, setForm]                   = useState(emptyForm);

    const fetch = () => {
        portalApi.get('/announcements')
            .then(r => setAnnouncements(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetch(); }, []);

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm);
        setMessage('');
        setShowModal(true);
    };

    const openEdit = (a) => {
        setEditing(a);
        setForm({ title: a.title, body: a.body, audience: a.audience, file: null });
        setMessage('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        const formData = new FormData();
        formData.append('title',    form.title);
        formData.append('body',     form.body);
        formData.append('audience', form.audience);
        if (form.file) formData.append('attachment', form.file);

        try {
            if (editing) {
                formData.append('_method', 'PUT');
                await portalApi.post(`/announcements/${editing.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await portalApi.post('/announcements', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            fetch();
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this announcement?')) return;
        await portalApi.delete(`/announcements/${id}`);
        setAnnouncements(announcements.filter(a => a.id !== id));
    };

    const audienceColor = (a) => ({
        all:      'bg-blue-100 text-blue-700',
        students: 'bg-emerald-100 text-emerald-700',
        parents:  'bg-purple-100 text-purple-700',
        staff:    'bg-orange-100 text-orange-700',
    }[a] ?? 'bg-gray-100 text-gray-600');

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{announcements.length} posted</p>
                </div>
                <button onClick={openNew}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    + Post Announcement
                </button>
            </div>

            {announcements.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">No announcements yet</div>
            ) : (
                <div className="space-y-4">
                    {announcements.map(a => (
                        <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📢</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">{a.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${audienceColor(a.audience)}`}>
                                        {a.audience}
                                    </span>
                                    <button onClick={() => openEdit(a)}
                                        className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                                    <button onClick={() => handleDelete(a.id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 ml-11 whitespace-pre-wrap">{a.body}</p>

                            {a.attachment_name && (
                                <div className="ml-11 mt-3">
                                    <a href={`http://127.0.0.1:8000/storage/${a.attachment_path}`}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">
                                        📎 {a.attachment_name}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold">{editing ? 'Edit Announcement' : 'Post Announcement'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {message && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{message}</div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                                <input required value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
                                <textarea required rows={5} value={form.body}
                                    onChange={e => setForm({...form, body: e.target.value})}
                                    placeholder="Write the full announcement here..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Audience *</label>
                                <select value={form.audience}
                                    onChange={e => setForm({...form, audience: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="all">Everyone</option>
                                    <option value="students">Students Only</option>
                                    <option value="parents">Parents Only</option>
                                    <option value="staff">Staff Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Attach Document (PDF, DOC, Image) — optional
                                </label>
                                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.zip"
                                    onChange={e => setForm({...form, file: e.target.files[0]})}
                                    className="w-full text-sm text-gray-600" />
                                {editing?.attachment_name && !form.file && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Current: 📎 {editing.attachment_name} (upload new to replace)
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Save Changes' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}