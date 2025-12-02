'use client';

import * as React from 'react';
import { RecommendationForm } from "@/components/recommendations/recommendation-form";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from "firebase/firestore";
import type { Client } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';

export default function RecommendationsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const clientsQuery = useMemoFirebase(() => {
        if (!user?.uid || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/clients`));
    }, [user?.uid, firestore]);

    const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Recomendações de Produtos com IA</h1>
            </div>
            <p className="text-muted-foreground">
                Selecione um cliente e piscina, depois descreva as condições atuais para obter recomendações de produtos com IA.
            </p>

            {isLoading ? (
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <Skeleton className="h-[500px] w-full" />
                    <Skeleton className="h-[500px] w-full" />
                </div>
            ) : (
                <RecommendationForm clients={clients || []} />
            )}
        </div>
    )
}
