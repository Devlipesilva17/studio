
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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

const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('language') as Language;
        if (storedLang && dictionaries[storedLang]) {
            return storedLang;
        }
        const browserLang = navigator.language.split('-')[0] as Language;
        if (dictionaries[browserLang]) {
            return browserLang;
        }
    }
    return 'pt'; // Default language
};

export const I18nProvider = ({ children, user }: { children: ReactNode, user: User | null }) => {
    const firestore = useFirestore();
    const [language, setLanguage] = useState<Language>(getInitialLanguage());
    const [dictionary, setDictionary] = useState<Dictionary>(dictionaries[language]);
    const [dateLocale, setDateLocale] = useState(() => dateLocales[language]);

    useEffect(() => {
        if (!user || !firestore) {
            // Not logged in, use localStorage or browser preference
            const initialLang = getInitialLanguage();
            setLanguage(initialLang);
            return;
        };

        const userRef = doc(firestore, `users/${user.uid}`);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            const userData = doc.data() as UserProfile;
            const userLang = userData?.language;
            if (userLang && dictionaries[userLang]) {
                setLanguage(userLang);
            } else {
                const initialLang = getInitialLanguage();
                setLanguage(initialLang);
            }
        });

        return () => unsubscribe();
    }, [user, firestore]);

    const handleSetLanguage = useCallback((lang: Language) => {
        if (dictionaries[lang]) {
            setLanguage(lang);
            localStorage.setItem('language', lang);
        }
    }, []);

    useEffect(() => {
        setDictionary(dictionaries[language]);
        setDateLocale(dateLocales[language]);
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

// Helper function to get nested keys, e.g., t('common.save')
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
