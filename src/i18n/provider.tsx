
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { I18nContextType, Language, Dictionary, User as UserProfile } from '@/lib/types';
import ptDictionary from '@/locales/pt.json';
import enDictionary from '@/locales/en.json';
import esDictionary from '@/locales/es.json';
import { ptBR, enUS, es } from 'date-fns/locale';

const dictionaries: Record<Language, Dictionary> = {
    pt: ptDictionary,
    en: enDictionary,
    es: esDictionary,
};

const dateLocales = {
    pt: ptBR,
    en: enUS,
    es: es,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('pt'); // Default to 'pt'
    const { user } = useUser();
    const firestore = useFirestore();

    // Effect to listen for user language preference from Firestore
    useEffect(() => {
        if (user?.uid && firestore) {
            const userRef = doc(firestore, `users/${user.uid}`);
            const unsubscribe = onSnapshot(userRef, (snapshot) => {
                const userData = snapshot.data() as UserProfile | undefined;
                if (userData?.language && dictionaries[userData.language]) {
                    setLanguage(userData.language);
                }
            });
            return () => unsubscribe();
        }
    }, [user, firestore]);
    
    const handleSetLanguage = useCallback((lang: Language) => {
        setLanguage(lang);
    }, []);

    const dictionary = dictionaries[language];
    const dateLocale = dateLocales[language];

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }
    }, [language]);
    
    const contextValue = {
        language,
        setLanguage: handleSetLanguage,
        dictionary,
        dateLocale,
    };

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

export const useTranslation = () => {
    const { dictionary } = useI18n();

    const t = (key: string, replacements?: { [key: string]: string | number }): string => {
        const keys = key.split('.');
        let result: any = dictionary;
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                return key; // Return the key if translation is not found
            }
        }
        
        if (typeof result === 'string' && replacements) {
            return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
                return acc.replace(`{${placeholder}}`, String(value));
            }, result);
        }

        return result || key;
    };

    return t;
};
