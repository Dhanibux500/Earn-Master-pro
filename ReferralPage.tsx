import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Gift, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralPage() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code}`;

  useEffect(() => {
    if (profile?.referral_code) {
      const q = query(collection(db, 'users'), where('referred_by', '==', profile.referral_code));
      const unsub = onSnapshot(q, (snapshot) => {
        setReferrals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        console.error("Error fetching referrals:", error);
        // We catch the permission error here because users cannot read other users' documents due to PII restrictions.
        // In a real app, a Cloud Function would aggregate this data securely.
        setLoading(false);
      });
      return () => unsub();
    }
  }, [profile]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Invite Friends & Earn</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Get 10% commission on everything your friends earn. There's no limit to how many people you can invite!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{referrals.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Commission Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">10%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Total Earned</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0.00 PKR</p>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Your Referral Link</h2>
          <p className="text-indigo-100 mb-8">Copy and share this link with your friends to start earning.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 font-mono text-sm truncate">
              {referralLink}
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Your Referrals</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading referrals...</div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Total Earned</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{ref.name}</p>
                      <p className="text-xs text-gray-500">{ref.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ref.created_at?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                      {ref.total_earned.toFixed(2)} PKR
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-600">
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">You haven't referred anyone yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
