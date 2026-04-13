import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Menu, X, Wallet, LayoutDashboard, Tv, Share2, User, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">EarnMaster<span className="text-indigo-600">Pro</span></span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link to="/ads" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <Tv className="w-4 h-4" /> Ads
            </Link>
            <Link to="/tasks" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Tasks
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-md text-sm font-bold flex items-center gap-2 bg-indigo-50">
                <ShieldCheck className="w-4 h-4" /> Admin
              </Link>
            )}
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex items-center space-x-3">
              <div className="text-right mr-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Balance</p>
                <p className="text-sm font-bold text-indigo-600">{profile?.balance.toFixed(2)} PKR</p>
              </div>
              <Link to="/profile" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">
                <User className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 pb-4">
          <div className="px-2 pt-2 space-y-1">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Dashboard</Link>
            <Link to="/ads" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Ads</Link>
            <Link to="/tasks" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Tasks</Link>
            <Link to="/withdraw" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Withdraw</Link>
            <Link to="/referrals" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Referrals</Link>
            <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Profile</Link>
            {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-bold text-indigo-600 hover:bg-indigo-50">Admin Panel</Link>}
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
}
