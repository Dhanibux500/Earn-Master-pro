import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Share2, Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    platform: 'youtube',
    task_url: '',
    instructions: '',
    reward_amount: 5,
    status: 'active',
  });

  useEffect(() => {
    const unsubTasks = onSnapshot(collection(db, 'social_tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSubs = onSnapshot(query(collection(db, 'user_tasks'), where('status', '==', 'pending')), (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubTasks();
      unsubSubs();
    };
  }, []);

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await updateDoc(doc(db, 'social_tasks', editingTask.id), formData);
        toast.success('Task updated successfully');
      } else {
        await addDoc(collection(db, 'social_tasks'), {
          ...formData,
          created_at: serverTimestamp(),
        });
        toast.success('Task created successfully');
      }
      closeModal();
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleApproveSubmission = async (sub: any) => {
    try {
      const task = tasks.find(t => t.id === sub.task_id);
      if (!task) return;

      const userRef = doc(db, 'users', sub.user_id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      await updateDoc(userRef, {
        balance: userData.balance + task.reward_amount,
        total_earned: userData.total_earned + task.reward_amount,
      });

      await updateDoc(doc(db, 'user_tasks', sub.id), {
        status: 'approved',
        approved_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        user_id: sub.user_id,
        action: 'Task Approved',
        details: `Earned ${task.reward_amount} PKR from task: ${task.title}`,
        created_at: serverTimestamp(),
      });

      toast.success('Submission approved!');
    } catch (error) {
      toast.error('Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (sub: any) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;

    try {
      await updateDoc(doc(db, 'user_tasks', sub.id), {
        status: 'rejected',
        admin_remark: reason,
      });
      toast.success('Submission rejected');
    } catch (error) {
      toast.error('Failed to reject submission');
    }
  };

  const openModal = (task: any = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        platform: task.platform,
        task_url: task.task_url,
        instructions: task.instructions,
        reward_amount: task.reward_amount,
        status: task.status,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        platform: 'youtube',
        task_url: '',
        instructions: '',
        reward_amount: 5,
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Task Management</h1>
          <p className="text-sm text-gray-500">Manage tasks and approve user submissions</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            Active Tasks
          </h2>
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{task.title}</h3>
                  <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">{task.platform} • {task.reward_amount} PKR</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(task)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Pending Submissions
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
            {submissions.length > 0 ? (
              submissions.map((sub) => {
                const task = tasks.find(t => t.id === sub.task_id);
                return (
                  <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{task?.title || 'Unknown Task'}</p>
                      <p className="text-xs text-gray-500">User: {sub.user_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveSubmission(sub)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleRejectSubmission(sub)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-gray-400">No pending submissions</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmitTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Platform</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  >
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">Twitter</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Task URL</label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.task_url}
                  onChange={(e) => setFormData({ ...formData, task_url: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Instructions</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reward (PKR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.reward_amount}
                  onChange={(e) => setFormData({ ...formData, reward_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
