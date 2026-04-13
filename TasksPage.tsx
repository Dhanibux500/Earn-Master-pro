import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { Share2, Youtube, Facebook, Instagram, Twitter, Send, ExternalLink, Clock, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { motion } from 'motion/react';

const platformIcons: any = {
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  telegram: Send,
  tiktok: Share2,
};

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const unsubTasks = onSnapshot(query(collection(db, 'social_tasks'), where('status', '==', 'active')), (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      const unsubSubmissions = onSnapshot(
        query(collection(db, 'user_tasks'), where('user_id', '==', user.uid)),
        (snapshot) => {
          const subs: any = {};
          snapshot.docs.forEach(doc => {
            subs[doc.data().task_id] = doc.data();
          });
          setUserSubmissions(subs);
        }
      );

      return () => {
        unsubTasks();
        unsubSubmissions();
      };
    }
  }, [user]);

  const handleSubmitTask = async (taskId: string) => {
    if (!user) return;
    setSubmitting(taskId);
    try {
      await addDoc(collection(db, 'user_tasks'), {
        user_id: user.uid,
        task_id: taskId,
        status: 'pending',
        submitted_at: serverTimestamp(),
        screenshot: '', // In a real app, this would be a file upload
      });
      toast.success('Task submitted for approval!');
    } catch (error) {
      toast.error('Failed to submit task');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="text-center py-12">Loading tasks...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Tasks</h1>
        <p className="text-gray-500">Complete social media actions to earn rewards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.map((task) => {
          const submission = userSubmissions[task.id];
          const Icon = platformIcons[task.platform] || Share2;

          return (
            <motion.div
              key={task.id}
              layout
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              <div className={`md:w-32 flex items-center justify-center p-6 ${
                task.platform === 'youtube' ? 'bg-red-50 text-red-600' :
                task.platform === 'facebook' ? 'bg-blue-50 text-blue-600' :
                task.platform === 'instagram' ? 'bg-pink-50 text-pink-600' :
                task.platform === 'telegram' ? 'bg-sky-50 text-sky-600' :
                'bg-gray-50 text-gray-600'
              }`}>
                <Icon className="w-12 h-12" />
              </div>
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.instructions}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase">Reward</p>
                    <p className="text-xl font-bold text-indigo-600">{task.reward_amount} PKR</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-50">
                  <a
                    href={task.task_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Link
                  </a>

                  {!submission ? (
                    <button
                      onClick={() => handleSubmitTask(task.id)}
                      disabled={submitting === task.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {submitting === task.id ? 'Submitting...' : 'Mark as Completed'}
                    </button>
                  ) : (
                    <div className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
                      submission.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                      submission.status === 'approved' ? 'bg-green-50 text-green-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {submission.status === 'pending' ? (
                        <><Clock className="w-4 h-4" /> Pending Approval</>
                      ) : submission.status === 'approved' ? (
                        <><CheckCircle2 className="w-4 h-4" /> Approved</>
                      ) : (
                        <><AlertCircle className="w-4 h-4" /> Rejected</>
                      )}
                    </div>
                  )}
                </div>
                {submission?.admin_remark && (
                  <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                    <strong>Reason:</strong> {submission.admin_remark}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Tasks Available</h3>
          <p className="text-gray-500">Check back later for new social tasks</p>
        </div>
      )}
    </div>
  );
}
