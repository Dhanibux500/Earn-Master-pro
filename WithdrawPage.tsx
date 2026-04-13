import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { Wallet, Smartphone, Landmark, ArrowDownCircle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const paymentMethods = [
  { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'jazzcash', name: 'JazzCash', icon: Smartphone, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'binance', name: 'Binance (USDT)', icon: Landmark, color: 'text-yellow-600', bg: 'bg-yellow-100' },
];

export default function WithdrawPage() {
  const { user, profile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [method, setMethod] = useState('easypaisa');
  const [amount, setAmount] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'withdrawals'),
        where('user_id', '==', user.uid),
        orderBy('requested_at', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setHistoryLoading(false);
      });
      return () => unsub();
    }
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 500) {
      toast.error('Minimum withdrawal is 500 PKR');
      return;
    }

    if (numAmount > profile.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        user_id: user.uid,
        amount: numAmount,
        payment_method: method,
        account_details: accountDetails,
        status: 'pending',
        requested_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        user_id: user.uid,
        action: 'Withdrawal Requested',
        details: `Requested ${numAmount} PKR via ${method}`,
        created_at: serverTimestamp(),
      });

      toast.success('Withdrawal request submitted!');
      setAmount('');
      setAccountDetails('');
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Withdrawal Form */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdraw Funds</h1>
          <p className="text-gray-500">Cash out your earnings to your preferred wallet</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Available Balance</p>
              <p className="text-2xl font-bold text-indigo-900">{profile?.balance.toFixed(2)} PKR</p>
            </div>
            <Wallet className="w-10 h-10 text-indigo-600 opacity-20" />
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      method === pm.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`${pm.bg} p-2 rounded-lg`}>
                      <pm.icon className={`w-5 h-5 ${pm.color}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">{pm.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Withdrawal Amount (PKR)</label>
              <input
                type="number"
                required
                min="500"
                placeholder="Min 500 PKR"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {method === 'binance' ? 'Binance Wallet ID (USDT)' : 'Account Phone Number'}
              </label>
              <input
                type="text"
                required
                placeholder={method === 'binance' ? 'Enter Wallet Address' : '03xx xxxxxxx'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowDownCircle className="w-5 h-5" />
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-700 leading-relaxed">
              <p className="font-bold mb-1">Withdrawal Rules:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Minimum withdrawal is 500 PKR.</li>
                <li>Processing time is 24-48 hours.</li>
                <li>Ensure account details are 100% correct.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          Withdrawal History
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {historyLoading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : withdrawals.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <div key={w.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`p-2 rounded-lg ${
                        w.payment_method === 'easypaisa' ? 'bg-green-100 text-green-600' :
                        w.payment_method === 'jazzcash' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{w.amount} PKR</p>
                        <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">{w.payment_method} • {w.account_details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        w.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        w.status === 'completed' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {w.status === 'pending' ? <Clock className="w-3 h-3" /> : 
                         w.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : 
                         <XCircle className="w-3 h-3" />}
                        {w.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">
                        {w.requested_at?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {w.admin_remark && (
                    <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                      <strong>Reason:</strong> {w.admin_remark}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ArrowDownCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No withdrawal requests yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
