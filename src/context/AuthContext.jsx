import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDivision, setUserDivision] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Check if account is deactivated
            if (data.status === 'deactivated') {
              alert("Your account has been deactivated. Please contact the administrator.");
              await auth.signOut();
              setCurrentUser(null);
              setUserRole(null);
              setUserDivision(null);
              setLoading(false);
              return;
            }

            setUserRole(data.role);
            setUserDivision(data.division);
          } else {
            setUserRole(null);
            setUserDivision(null);
          }
        } catch (error) {
          console.error("Error fetching user metadata:", error);
          setUserRole(null);
          setUserDivision(null);
        }
      } else {
        setUserRole(null);
        setUserDivision(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userDivision,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
