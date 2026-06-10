import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

const emptyForm = {
    name: '',
    level: '',
    stream: '',
    teacher_id: '',
    capacity: 40,
    academic_year: new Date().getFullYear().toString(),
};

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState(emptyForm);

    const fetchClasses = () => {
        setLoading(true);
        api.get('/classes')
            .then(r => setClasses(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchClasses();
        api.get('/staff', { params: { role: 'teacher' } })
            .then(r => setTeachers(r.data.data ?? r.data));
    }, []);

    const levels = useMemo(() => [...new Set(classes.map(c => c.level).filter(Boolean))].sort(), [classes]);
    const totalStudents = classes.reduce((sum, c) => sum + Number(c.students_count ?? 0), 0);
    const totalCapacity = classes.reduce((sum, c) => sum + Number(c.capacity ?? 0), 0);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError('');
        setShowModal(true);
    };

    const openEdit = (schoolClass) => {
        setEditing(schoolClass);
        setForm({
            name: schoolClass.name ?? '',
            level: schoolClass.level ?? '',
            stream: schoolClass.stream ?? '',
            teacher_id: schoolClass.teacher_id ?? '',
            capacity: schoolClass.capacity ?? 40,
            academic_year: schoolClass.academic_year ?? new Date().getFullYear().toString(),
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const payload = {
            ...form,
            teacher_id: form.teacher_id || null,
            stream: form.stream || null,
        };

        try {
            if (editing) await api.put(`/classes/${editing.id}`, payload);
            else await api.post('/classes', payload);
            setShowModal(false);
            fetchClasses();
        } catch (err) {
            setError(err.response?.data?.message ?? 'Failed to save class');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (schoolClass) => {
        if (!confirm(`Delete ${schoolClass.name}?`)) return;
        try {
            await api.delete(`/classes/${schoolClass.id}`);
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.message ?? 'Failed to delete class');
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{classes.length} classes across {levels.length} levels</p>
                </div>
                <button onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                    <Plus size={16} /> Add Class
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Total Classes</p>
                    <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Students Assigned</p>
                    <p className="text-2xl font-bold text-emerald-600">{totalStudents}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="text-xs text-gray-500 mb-1">Capacity Used</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Class', 'Level', 'Teacher', 'Students', 'Capacity', 'Year', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
                        ) : classes.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">No classes found</td></tr>
                        ) : classes.map(schoolClass => {
                            const used = Number(schoolClass.students_count ?? 0);
                            const capacity = Number(schoolClass.capacity ?? 0);
                            return (
                                <tr key={schoolClass.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-800">{schoolClass.name}</p>
                                        {schoolClass.stream && <p className="text-xs text-gray-500">Stream {schoolClass.stream}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{schoolClass.level}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {schoolClass.teacher ? `${schoolClass.teacher.first_name} ${schoolClass.teacher.last_name}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 font-medium">{used}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${capacity ? Math.min(100, (used / capacity) * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500">{used}/{capacity}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{schoolClass.academic_year}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => openEdit(schoolClass)} className="text-blue-600 hover:text-blue-800" title="Edit class">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(schoolClass)} className="text-red-500 hover:text-red-700" title="Delete class">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Class' : 'Add Class'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Class Name *</label>
                                    <input required value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        placeholder="Form 1A"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Level *</label>
                                    <input required value={form.level}
                                        onChange={e => setForm({...form, level: e.target.value})}
                                        placeholder="Form 1"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Stream</label>
                                    <input value={form.stream}
                                        onChange={e => setForm({...form, stream: e.target.value})}
                                        placeholder="A"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Capacity *</label>
                                    <input required type="number" min="1" value={form.capacity}
                                        onChange={e => setForm({...form, capacity: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Year *</label>
                                    <input required value={form.academic_year}
                                        onChange={e => setForm({...form, academic_year: e.target.value})}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Class Teacher</label>
                                <select value={form.teacher_id}
                                    onChange={e => setForm({...form, teacher_id: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Unassigned</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
