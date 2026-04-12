import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // First try to find by UID
      const unsub = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
          setLoading(false);
        } else {
          // If not found by UID, try to find by email (for users pre-created by admin)
          if (user.email) {
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              const userDoc = querySnap.docs[0];
              const userData = userDoc.data();
              
              // Update the document to use the real UID as the ID
              // We delete the old doc and create a new one with the correct ID
              await updateDoc(doc(db, 'users', userDoc.id), { uid: user.uid });
              // Note: In a real app, you might want to move the doc to a new ID, 
              // but for this demo, updating the uid field and relying on the query is enough 
              // if we change the listener to query by email if UID fails, 
              // or better: just update the profile state here.
              setProfile({ ...userData, uid: user.uid } as UserProfile);
              setLoading(false);
            } else if (user.email === 'developed45@gmail.com') {
              // Default admin
              setProfile({
                uid: user.uid,
                email: user.email,
                fullName: 'Admin User',
                userId: 'admin_01',
                role: 'Admin',
                skills: [],
                activeTasksCount: 0
              });
              setLoading(false);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      });
      return () => unsub();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin: profile?.role === 'Admin' || user?.email === 'priyanshu21@gmail.com'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
