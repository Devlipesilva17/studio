
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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';

export default function LoginPage() {
  const t = useTranslation();
  
  const heroImage = {
    id: 'pool-hero',
    description: 'A beautiful modern swimming pool at dusk.',
    imageUrl: 'https://picsum.photos/seed/pool-hero/1200/800',
    imageHint: 'modern pool',
  };

  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  
  const emailProviders = [
    'gmail.com',
    'outlook.com',
    'outlook.com.br',
    'yahoo.com',
    'hotmail.com',
    'icloud.com',
  ];

  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value.includes('@')) {
      const [localPart, domainPart] = value.split('@');
      if (domainPart === '') {
        setSuggestions(emailProviders.map(provider => `${localPart}@${provider}`));
      } else {
        const filteredProviders = emailProviders.filter(p => p.startsWith(domainPart));
        setSuggestions(filteredProviders.map(provider => `${localPart}@${provider}`));
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEmail(suggestion);
    setSuggestions([]);
  };


  const handleAuthAction = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: t('login.errors.authInit'),
        description: t('login.errors.authInit'),
      });
      return;
    }
    if (!email || !password) {
        toast({
            variant: "destructive",
            title: t('common.error'),
            description: t('login.errors.emptyFields'),
        });
        return;
    }


    setIsProcessing(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      let title = t('common.error');
      let description = 'Ocorreu um erro desconhecido. Tente novamente.';

      switch (error.code) {
        case 'auth/invalid-email':
          title = t('common.error');
          description = t('login.errors.invalidEmail');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          title = t('common.error');
          description = t('login.errors.invalidCredentials');
          break;
        case 'auth/email-already-in-use':
          title = t('common.error');
          description = t('login.errors.emailInUse');
          break;
        case 'auth/weak-password':
          title = t('common.error');
          description = t('login.errors.weakPassword');
          break;
        default:
          console.error('Authentication error:', error);
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isProcessing || isUserLoading;

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <PoolIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">{t('common.poolcarePro')}</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              {isSignUp
                ? t('login.signUpMessage')
                : t('login.welcomeMessage')}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isSignUp ? t('login.createAccountTitle') : t('login.title')}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? t('login.fillToRegister')
                  : t('login.welcomeTo')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="email">{t('login.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  required
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  autoComplete="off"
                />
                 {suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-card border rounded-md shadow-lg z-10">
                    <ul className="py-1">
                      {suggestions.map((suggestion) => (
                        <li
                          key={suggestion}
                          className="px-3 py-2 cursor-pointer hover:bg-secondary"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                  {!isSignUp && (
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      {t('login.forgotPassword')}
                    </Link>
                  )}
                </div>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                    />
                    <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                    </Button>
                </div>
              </div>
              <Button onClick={handleAuthAction} type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? t('login.createAccountButton') : t('login.loginButton')}
              </Button>
               <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
              >
                {isSignUp
                  ? t('login.toggleToLogin')
                  : t('login.toggleToSignUp')}
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
