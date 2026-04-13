import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { Tv, Play, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdsPage() {
  const { user, profile } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [watchedAds, setWatchedAds] = useState<string[]>([]);
  const [activeAd, setActiveAd] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubAds = onSnapshot(query(collection(db, 'ads'), where('status', '==', 'active')), (snapshot) => {
        setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const unsubWatched = onSnapshot(
        query(collection(db, 'user_ads'), where('user_id', '==', user.uid), where('viewed_at', '>=', today)),
        (snapshot) => {
          setWatchedAds(snapshot.docs.map(doc => doc.data().ad_id));
        }
      );

      return () => {
        unsubAds();
        unsubWatched();
      };
    }
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (activeAd && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (activeAd && timer === 0) {
      completeAd();
    }
    return () => clearInterval(interval);
  }, [activeAd, timer]);

  const startAd = (ad: any) => {
    if (watchedAds.includes(ad.id)) {
      toast.error('You have already watched this ad today!');
      return;
    }
    setActiveAd(ad);
    setTimer(ad.timer_duration);
  };

  const completeAd = async () => {
    if (!activeAd || !user || !profile) return;

    try {
      await addDoc(collection(db, 'user_ads'), {
        user_id: user.uid,
        ad_id: activeAd.id,
        earned_amount: activeAd.reward_amount,
        viewed_at: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        balance: profile.balance + activeAd.reward_amount,
        total_earned: profile.total_earned + activeAd.reward_amount,
      });

      await addDoc(collection(db, 'activity_logs'), {
        user_id: user.uid,
        action: 'Ad Watched',
        details: `Earned ${activeAd.reward_amount} PKR from ad: ${activeAd.title}`,
        created_at: serverTimestamp(),
      });

      toast.success(`Earned ${activeAd.reward_amount} PKR!`);
      setActiveAd(null);
    } catch (error) {
      toast.error('Failed to process reward');
    }
  };

  if (loading) return <div className="text-center py-12">Loading ads...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Watch & Earn</h1>
          <p className="text-gray-500">Watch short ads to earn instant rewards</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Today's Progress</p>
          <p className="text-lg font-bold text-indigo-700">{watchedAds.length} / {ads.length} Ads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => {
          const isWatched = watchedAds.includes(ad.id);
          return (
            <div key={ad.id} className={`bg-white rounded-2xl border ${isWatched ? 'border-green-100 opacity-75' : 'border-gray-100'} shadow-sm overflow-hidden flex flex-col`}>
              <div className="aspect-video bg-gray-100 relative group">
                {ad.type === 'video' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                  </div>
                ) : (
                  <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
                {isWatched && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-5 h-5" /> Completed
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded uppercase">
                    {ad.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{ad.timer_duration}s</span>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-400 font-medium uppercase">Reward</p>
                    <p className="text-lg font-bold text-indigo-600">{ad.reward_amount} PKR</p>
                  </div>
                </div>
                <button
                  onClick={() => startAd(ad)}
                  disabled={isWatched}
                  className={`w-full mt-4 py-3 rounded-xl font-bold transition-all ${
                    isWatched 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isWatched ? 'Already Watched' : 'Watch Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {ads.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Ads Available</h3>
          <p className="text-gray-500">Check back later for new earning opportunities</p>
        </div>
      )}

      {/* Ad Player Overlay */}
      <AnimatePresence>
        {activeAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl space-y-6">
              <div className="flex justify-between items-center text-white">
                <div>
                  <h2 className="text-xl font-bold">{activeAd.title}</h2>
                  <p className="text-gray-400 text-sm">Do not close this window until the timer ends</p>
                </div>
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center border-4 border-indigo-500/30">
                  <span className="text-2xl font-bold">{timer}</span>
                </div>
              </div>

              <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                {activeAd.type === 'video' ? (
                  <iframe
                    src={`${activeAd.media_url}${activeAd.media_url.includes('?') ? '&' : '?'}autoplay=1&controls=0&disablekb=1&modestbranding=1`}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                ) : (
                  <img src={activeAd.media_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center">
                <p className="text-white font-medium">Reward: <span className="text-indigo-400 font-bold">{activeAd.reward_amount} PKR</span> will be added after {timer} seconds</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
