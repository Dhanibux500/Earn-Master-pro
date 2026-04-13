import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, increment, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Wallet, CheckCircle2, XCircle, Clock, Search, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('requested_at', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (withdrawal: any) => {
    if (!confirm(`Approve withdrawal of ${withdrawal.amount} PKR?`)) return;

    try {
      const userRef = doc(db, 'users', withdrawal.user_id);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error('User not found');
        return;
      }

      const userData = userSnap.data();
      if (userData.balance < withdrawal.amount) {
        toast.error('User has insufficient balance now');
        return;
      }

      // Atomic-like update
      await updateDoc(userRef, {
        balance: increment(-withdrawal.amount),
        total_withdrawn: increment(withdrawal.amount),
      });

      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'completed',
        processed_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        user_id: withdrawal.user_id,
        action: 'Withdrawal Approved',
        details: `Withdrawal of ${withdrawal.amount} PKR approved by admin`,
        created_at: serverTimestamp(),
      });

      toast.success('Withdrawal approved!');
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleReject = async (withdrawal: any) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;

    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'rejected',
        admin_remark: reason,
        processed_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        user_id: withdrawal.user_id,
        action: 'Withdrawal Rejected',
        details: `Withdrawal of ${withdrawal.amount} PKR rejected: ${reason}`,
        created_at: serverTimestamp(),
      });

      toast.success('Withdrawal rejected');
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => filter === 'all' || w.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-sm text-gray-500">Review and process user payout requests</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {['pending', 'completed', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">User / Account</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWithdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{w.user_id}</p>
                    <p className="text-xs text-gray-500 font-mono">{w.account_details}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-indigo-600">{w.amount} PKR</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-600 uppercase">{w.payment_method}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {w.requested_at?.toDate().toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      w.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      w.status === 'completed' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(w)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(w)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Loading withdrawals...</div>}
        {!loading && filteredWithdrawals.length === 0 && (
          <div className="p-12 text-center text-gray-400">No withdrawal requests found</div>
        )}
      </div>
    </div>
  );
}
