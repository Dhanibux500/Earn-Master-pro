import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Search, Filter, MoreVertical, Ban, CheckCircle, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      toast.success(`User ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleAddBalance = async (userId: string) => {
    const amount = prompt('Enter amount to add (PKR):');
    if (!amount || isNaN(parseFloat(amount))) return;

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = users.find(u => u.id === userId);
      await updateDoc(userRef, {
        balance: userDoc.balance + parseFloat(amount),
        total_earned: userDoc.total_earned + parseFloat(amount),
      });
      toast.success('Balance added successfully');
    } catch (error) {
      toast.error('Failed to add balance');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage all registered users and their balances</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Referrals</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    <p className="text-[10px] text-indigo-500 font-mono mt-0.5">{u.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-indigo-600">{u.balance.toFixed(2)} PKR</p>
                    <p className="text-[10px] text-gray-400 uppercase">Earned: {u.total_earned.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {u.referral_code}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {u.created_at?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAddBalance(u.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Add Balance"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(u.id, u.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          u.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={u.status === 'active' ? 'Block User' : 'Unblock User'}
                      >
                        {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Loading users...</div>}
        {!loading && filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-400">No users found</div>
        )}
      </div>
    </div>
  );
}
