import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Tv, Plus, Edit2, Trash2, ExternalLink, Play, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAds() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'image',
    media_url: '',
    reward_amount: 10,
    timer_duration: 15,
    status: 'active',
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await updateDoc(doc(db, 'ads', editingAd.id), formData);
        toast.success('Ad updated successfully');
      } else {
        await addDoc(collection(db, 'ads'), {
          ...formData,
          total_views: 0,
          total_paid: 0,
          created_at: serverTimestamp(),
        });
        toast.success('Ad created successfully');
      }
      closeModal();
    } catch (error) {
      toast.error('Failed to save ad');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteDoc(doc(db, 'ads', id));
      toast.success('Ad deleted successfully');
    } catch (error) {
      toast.error('Failed to delete ad');
    }
  };

  const openModal = (ad: any = null) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        type: ad.type,
        media_url: ad.media_url,
        reward_amount: ad.reward_amount,
        timer_duration: ad.timer_duration,
        status: ad.status,
      });
    } else {
      setEditingAd(null);
      setFormData({
        title: '',
        type: 'image',
        media_url: '',
        reward_amount: 10,
        timer_duration: 15,
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAd(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
          <p className="text-sm text-gray-500">Create and manage advertisements</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New Ad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="aspect-video bg-gray-100 relative">
              {ad.type === 'video' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Play className="w-10 h-10 text-gray-400" />
                </div>
              ) : (
                <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => openModal(ad)} className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-indigo-600 hover:bg-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(ad.id)} className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-red-600 hover:bg-white transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ad.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {ad.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Reward</p>
                  <p className="text-lg font-bold text-indigo-600">{ad.reward_amount} PKR</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {ad.total_views || 0} views</span>
                <span className="flex items-center gap-1 font-medium">{ad.timer_duration}s duration</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingAd ? 'Edit Ad' : 'Create New Ad'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ad Title</label>
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ad Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="image">Image Ad</option>
                    <option value="video">YouTube Video</option>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {formData.type === 'video' ? 'YouTube Embed URL' : 'Image URL'}
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={formData.type === 'video' ? 'https://www.youtube.com/embed/...' : 'https://...'}
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Timer (Seconds)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.timer_duration}
                    onChange={(e) => setFormData({ ...formData, timer_duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                >
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
