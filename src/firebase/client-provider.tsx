
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { I18nProvider } from '@/i18n/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Inner component to access the user from FirebaseProvider
const I18nWrapper = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    return <I18nProvider user={user}>{children}</I18nProvider>;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
        <I18nWrapper>{children}</I18nWrapper>
    </FirebaseProvider>
  );
}
