import { useState, useEffect } from 'react';
import PortalLayout from '../PortalLayout';
import portalApi from '../../../services/portalApi';
import { usePortalAuth } from '../../../context/PortalAuthContext';

export default function TeacherDashboard() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showModal, setShowModal]     = useState(false);
    const [saving, setSaving]           = useState(false);
    const [message, setMessage]         = useState('');
    const { user }                      = usePortalAuth();
    const [form, setForm]               = useState({
        title: '', description: '', class_id: '', subject: '',
        type: 'assignment', due_date: '', total_marks: 100, file: null,
    });

    useEffect(() => {
        portalApi.get('/assignments')
            .then(r => setAssignments(r.data))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (k === 'file' && v) formData.append('attachment', v);
            else if (k !== 'file') formData.append(k, v);
        });

        try {
            await portalApi.post('/assignments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('✅ Assignment posted successfully!');
            setShowModal(false);
            setForm({ title: '', description: '', class_id: '', subject: '', type: 'assignment', due_date: '', total_marks: 100, file: null });
            portalApi.get('/assignments').then(r => setAssignments(r.data));
        } catch (err) {
            setMessage(err.response?.data?.message ?? 'Failed to post assignment');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this assignment?')) return;
        await portalApi.delete(`/assignments/${id}`);
        setAssignments(assignments.filter(a => a.id !== id));
    };

    if (loading) return <PortalLayout><div className="text-center py-20 text-gray-400">Loading...</div></PortalLayout>;

    return (
        <PortalLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Welcome, {user?.name}</p>
                </div>
                <button onClick={() => { setMessage(''); setShowModal(true); }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    + Post Assignment
                </button>
            </div>

            {message && !showModal && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>
            )}

            <div className="space-y-4">
                {assignments.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-400">No assignments posted yet</div>
                ) : assignments.map(a => (
                    <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-gray-800">{a.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{a.subject} — Due {new Date(a.due_date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-600 mt-2">{a.description}</p>
                            </div>
                            <button onClick={() => handleDelete(a.id)}
                                className="text-red-500 hover:text-red-700 text-xs ml-4">Delete</button>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span>📥 {a.submissions?.length ?? 0} submissions</span>
                            <span>🎯 {a.total_marks} marks</span>
                            <a href={`/portal/teacher/submissions?assignment_id=${a.id}`}
                                className="text-purple-600 hover:underline">View Submissions →</a>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold">Post Assignment</h2>
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
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description / Instructions *</label>
                                <textarea required rows={4} value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Class ID *</label>
                                    <input required type="number" value={form.class_id}
                                        onChange={e => setForm({...form, class_id: e.target.value})}
                                        placeholder="e.g. 1"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                                    <input required value={form.subject}
                                        onChange={e => setForm({...form, subject: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                                    <select required value={form.type}
                                        onChange={e => setForm({...form, type: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                                        <option value="assignment">Assignment</option>
                                        <option value="homework">Homework</option>
                                        <option value="test">Test</option>
                                        <option value="project">Project</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                                    <input required type="date" value={form.due_date}
                                        onChange={e => setForm({...form, due_date: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Marks</label>
                                    <input type="number" min="1" value={form.total_marks}
                                        onChange={e => setForm({...form, total_marks: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Attach File (optional)</label>
                                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.zip"
                                    onChange={e => setForm({...form, file: e.target.files[0]})}
                                    className="w-full text-sm text-gray-600" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Posting...' : 'Post Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}