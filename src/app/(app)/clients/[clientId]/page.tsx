
'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientDetailsPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { user } = useUser();
  const firestore = useFirestore();

  const clientRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/clients`, params.clientId);
  }, [firestore, user, params.clientId]);

  const { data: client, isLoading } = useDoc<Client>(clientRef);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <CardTitle>Cliente não encontrado</CardTitle>
        <CardDescription className="mt-2">
          O cliente que você está procurando não existe ou foi removido.
        </CardDescription>
        <Button asChild className="mt-4">
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
         </Button>
        <Avatar className="h-16 w-16">
          <AvatarImage src={client.avatarUrl} alt={client.name} />
          <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-3xl font-headline">{client.name}</CardTitle>
          <CardDescription>
            Cliente desde {new Date(client.startDate || client.createdAt).toLocaleDateString('pt-BR')}
          </CardDescription>
        </div>
        <Button variant="outline" size="icon" className="ml-auto">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Ficha do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Em breve, a ficha completa do cliente estará aqui.</p>
        </CardContent>
       </Card>
    </div>
  );
}
