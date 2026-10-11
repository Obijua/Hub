import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LogIn, Mail, Lock, AlertCircle, User } from 'lucide-react';
import { motion } from 'motion/react';

const ADMIN_EMAILS = ['obijuaj@gmail.com', 'clementegrinya@gmail.com'];

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const wantsSignUp = () => new URLSearchParams(location.search).get('mode') === 'signup' || location.state?.mode === 'signup';
  const [isSignUp, setIsSignUp] = useState(wantsSignUp());
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (wantsSignUp()) setIsSignUp(true);
  }, [location.key, location.search]);

  const ensureUserDoc = async (user: any) => {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    const isAdminEmail = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
    
    if (docSnap.exists()) {
      const role = docSnap.data().role;
      if (role === 'admin') return 'admin';
      else if (isAdminEmail) {
        await setDoc(docRef, { role: 'admin' }, { merge: true });
        return 'admin';
      }
      return role || 'seeker';
    } else {
      const fallbackName = user.displayName || user.email?.split('@')[0] || '';
      await setDoc(docRef, {
        uid: user.uid,
        email: user.email || '',
        name: fallbackName,
        fullName: fallbackName,
        role: isAdminEmail ? 'admin' : 'seeker',
        isPremium: false,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp()
      });
      return isAdminEmail ? 'admin' : 'seeker';
    }
  };

  const routeAfterLogin = async (user: any) => {
    const from = location.state?.from || '/';
    const role = await ensureUserDoc(user);
    if (role === 'admin') {
      navigate(from === '/' ? '/admin' : from, { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await routeAfterLogin(result.user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password, or account does not exist. Please check your credentials or Sign Up.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName.trim() });
      await routeAfterLogin(result.user);
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError('Could not create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await routeAfterLogin(result.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
          <p className="text-gray-500">{isSignUp ? 'Join Hub & Jobs in a minute' : 'Access your Hub & Jobs account'}</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 border border-red-100 flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleEmailLogin} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hubandjobs.com"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5" /> {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google Account
        </button>

        <p className="text-center text-sm text-gray-500 mt-8">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} style={{ color: '#1E3B8B', fontWeight: 700 }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Welcome to Hub & Jobs. <br />
            Your Hub for Jobs & Opportunities.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
