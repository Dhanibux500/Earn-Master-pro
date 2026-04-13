import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  ArrowUpRight, 
  Gift, 
  Tv, 
  Share2, 
  ChevronRight,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
      checkDailyBonus();
    }
  }, [user]);

  const fetchRecentActivity = async () => {
    const q = query(
      collection(db, 'activity_logs'),
      where('user_id', '==', user?.uid),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    const snapshot = await getDocs(q);
    setRecentActivity(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const checkDailyBonus = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'daily_bonus'),
      where('user_id', '==', user?.uid),
      where('claimed_at', '>=', today)
    );
    const snapshot = await getDocs(q);
    setDailyBonusClaimed(!snapshot.empty);
  };

  const claimDailyBonus = async () => {
    if (dailyBonusClaimed || !profile) return;
    
    try {
      const bonusAmount = 5; // Fixed for now
      await addDoc(collection(db, 'daily_bonus'), {
        user_id: user?.uid,
        amount: bonusAmount,
        streak_count: 1, // Simplified
        claimed_at: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user!.uid), {
        balance: profile.balance + bonusAmount,
        total_earned: profile.total_earned + bonusAmount,
      });

      await addDoc(collection(db, 'activity_logs'), {
        user_id: user?.uid,
        action: 'Daily Bonus',
        details: `Claimed ${bonusAmount} PKR daily bonus`,
        created_at: serverTimestamp(),
      });

      setDailyBonusClaimed(true);
      toast.success(`Claimed ${bonusAmount} PKR bonus!`);
      fetchRecentActivity();
    } catch (error) {
      toast.error('Failed to claim bonus');
    }
  };

  const stats = [
    { label: 'Total Earnings', value: `${profile?.total_earned.toFixed(2)} PKR`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Current Balance', value: `${profile?.balance.toFixed(2)} PKR`, icon: ArrowUpRight, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Referrals', value: '0', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Today Earned', value: '0.00 PKR', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hello, {profile?.name}! 👋</h1>
          <p className="text-gray-500">Ready to earn some extra cash today?</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={claimDailyBonus}
            disabled={dailyBonusClaimed}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
              dailyBonusClaimed 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            <Gift className="w-5 h-5" />
            {dailyBonusClaimed ? 'Bonus Claimed' : 'Claim Daily Bonus'}
          </button>
          <Link to="/withdraw" className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">
            Withdraw Now
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className={`${stat.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/ads" className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <Tv className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Watch Ads</h3>
                  <p className="text-sm text-gray-500">Earn by watching short videos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
            <Link to="/tasks" className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <Share2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Social Tasks</h3>
                  <p className="text-sm text-gray-500">Like, follow and share to earn</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Recent Activity
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium uppercase">
                        {activity.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm">No recent activity</p>
              </div>
            )}
            <Link to="/history" className="block w-full py-3 text-center text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-gray-100">
              View All History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
