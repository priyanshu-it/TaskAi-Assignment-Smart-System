import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Shield, User as UserIcon, Mail, Lock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // Firebase v9+ often returns 'auth/invalid-credential' for both wrong password and user not found
      if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && email === 'priyanshu21@gmail.com') {
        // Bootstrap admin
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email,
            fullName: 'Priyanshu',
            userId: 'admin_01',
            role: 'Admin',
            skills: [],
            activeTasksCount: 0
          });
        } catch (e2: any) {
          setError(e2.message);
        }
      } else {
        setError('Invalid admin credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !userId) {
      setError('Both Email and User ID are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Find user by both email AND userId in Firestore to ensure they match a registered record
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', email),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      const userDoc = querySnapshot.docs[0];

      if (userDoc) {
        const userData = userDoc.data();
        const userEmail = userData.email;

        try {
          // Try to sign in with default password
          await signInWithEmailAndPassword(auth, userEmail, 'password123');
        } catch (signInErr: any) {
          // If sign in fails because user doesn't exist in Auth yet, create them
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, userEmail, 'password123');
              const newUid = userCredential.user.uid;

              // If the UID changed (which it will, since admin used a random tempUid), 
              // we need to migrate the Firestore document to the new Auth UID
              if (newUid !== userDoc.id) {
                await setDoc(doc(db, 'users', newUid), {
                  ...userData,
                  uid: newUid
                });
                // Optionally delete the old temp document
                await deleteDoc(doc(db, 'users', userDoc.id));
              }
            } catch (createErr: any) {
              // If creation fails, it might be because the user actually exists but password was wrong
              // but for this demo we assume 'password123' is the only password.
              setError('Authentication failed. Please contact Admin.');
            }
          } else {
            setError('Login failed. Please check your credentials.');
          }
        }
      } else {
        setError('No registered user found with these credentials. Please contact Admin.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Login failed. Please verify your credentials or contact Admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans bg-cover bg-center relative"
      style={{
        backgroundImage: "url('https://static.vecteezy.com/system/resources/thumbnails/004/999/427/small/concept-of-working-at-home-business-desk-office-set-collection-realistic-isolated-on-white-background-flat-illustration-flat-lay-free-vector.jpg')"
      }}
    >
      <div className="absolute inset-0 bg-white/40"></div>
      <div className="relative z-10">
        {/* your content */}

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-blue-600 tracking-tighter mb-2 font-display">TASK-AI</h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Smart Assignment Portal</p>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-slate-300 overflow-hidden">
          <div className="flex p-4 bg-slate-50/50">
            <button
              onClick={() => setIsAdmin(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all",
                isAdmin ? "bg-blue-50 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Shield size={18} />
              Admin
            </button>
            <button
              onClick={() => setIsAdmin(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all",
                !isAdmin ? "bg-blue-50 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <UserIcon size={18} />
              User
            </button>
          </div>

          <hr className="border-slate-300" />

          <div className="p-8">
            <form onSubmit={isAdmin ? handleAdminLogin : handleUserLogin} className="space-gap-6 flex flex-col gap-6">
              {isAdmin ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Admin Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">User ID</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter your User ID"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold tracking-wide shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : `LOG IN AS ${isAdmin ? 'ADMIN' : 'USER'}`}
              </button>
            </form>

            <div className="mt-6 text-slate-400 text-xs font-medium uppercase tracking-wider text-center">
              {isAdmin ? "Only the admin Login is accessible" : "User's must be registered by Admin"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
