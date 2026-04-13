import { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Tv, Share2, Wallet, TrendingUp, ArrowUpRight, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAds: 0,
    totalTasks: 0,
    pendingWithdrawals: 0,
    totalPaid: 0,
  });
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
      setStats(prev => ({ ...prev, totalAds: snap.size }));
    });

    const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), where('status', '==', 'pending')), (snap) => {
      setStats(prev => ({ ...prev, pendingWithdrawals: snap.size }));
    });

    const unsubRecent = onSnapshot(
      query(collection(db, 'withdrawals'), orderBy('requested_at', 'desc'), limit(5)),
      (snap) => {
        setRecentWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubAds();
      unsubWithdrawals();
      unsubRecent();
    };
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/users' },
    { label: 'Active Ads', value: stats.totalAds, icon: Tv, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/admin/ads' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', link: '/admin/withdrawals' },
    { label: 'Total Paid', value: '0 PKR', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100', link: '/admin/withdrawals' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500">Overview of system performance and activity</p>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
          System Online
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`${card.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Withdrawals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Withdrawal Requests</h2>
            <Link to="/admin/withdrawals" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentWithdrawals.length > 0 ? (
              recentWithdrawals.map((w) => (
                <div key={w.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{w.amount} PKR</p>
                      <p className="text-xs text-gray-500 uppercase">{w.payment_method}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    w.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                    w.status === 'completed' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {w.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400">No recent requests</div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">System Health</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Database Connection</span>
              </div>
              <span className="text-xs font-bold text-green-600 uppercase">Optimal</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Auth Service</span>
              </div>
              <span className="text-xs font-bold text-green-600 uppercase">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Ad Delivery Engine</span>
              </div>
              <span className="text-xs font-bold text-green-600 uppercase">Running</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-700 leading-relaxed">
                <strong>Admin Tip:</strong> Regularly review pending withdrawals to maintain high user trust and platform reputation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
