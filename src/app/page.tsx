'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PoolIcon } from '@/components/icons';
import { useAuth, useUser } from '@/firebase/provider';
import { signInAnonymously } from 'firebase/auth';

export default function LoginPage() {
  const heroImage = {
    id: 'pool-hero',
    description: 'Uma bela piscina moderna ao entardecer.',
    imageUrl: 'https://picsum.photos/seed/pool-hero/1200/800',
    imageHint: 'modern pool',
  };

  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const handleLogin = async () => {
    if (auth) {
      try {
        await signInAnonymously(auth);
        // onAuthStateChanged will handle the redirect
      } catch (error) {
        console.error("Anonymous sign-in failed", error);
      }
    }
  };

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <PoolIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">PoolCare Pro</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Entre com seu e-mail para acessar seu painel.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Bem-vindo ao seu novo painel de manutenção de piscinas.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@exemplo.com"
                  required
                  defaultValue="usuario@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input id="password" type="password" required defaultValue="123456" />
              </div>
              <Button type="submit" className="w-full" onClick={handleLogin} disabled={isUserLoading}>
                {isUserLoading ? 'Carregando...' : 'Login'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </div>
  );
}
