
// src/app/(app)/layout.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  Home,
  Users,
  Calendar,
  FlaskConical,
  CreditCard,
  BarChart3,
  Sparkles,
  PanelLeft,
  Search,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { PoolIcon } from '@/components/icons';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Visit, Client } from '@/lib/types';
import { collection, onSnapshot, query } from 'firebase/firestore';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [visits, setVisits] = React.useState<Visit[]>([]);

  const clientsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/clients`));
  }, [user, firestore]);
  const { data: clientList, isLoading: areClientsLoading } = useCollection<Client>(clientsQuery);
  
  React.useEffect(() => {
    if (!user || !firestore || !clientList) {
      return;
    }

    const unsubscribes = clientList.map(client => {
      const scheduleCollection = collection(firestore, `users/${user.uid}/clients/${client.id}/schedules`);
      return onSnapshot(scheduleCollection, snapshot => {
        setVisits(prev => {
          const otherClientVisits = prev.filter(v => v.clientId !== client.id);
          const newVisits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
          return [...otherClientVisits, ...newVisits];
        });
      });
    });
    
    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, firestore, clientList]);


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const todayVisitsCount = React.useMemo(() => {
      if (!visits) return 0;
      const todayString = new Date().toDateString();
      return visits.filter(v => new Date(v.scheduledDate).toDateString() === todayString && v.status === 'pending').length;
  }, [visits]);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/clients', icon: Users, label: 'Clientes' },
    { href: '/schedule', icon: Calendar, label: 'Agenda', badge: todayVisitsCount > 0 ? String(todayVisitsCount) : undefined },
    { href: '/products', icon: FlaskConical, label: 'Produtos' },
    { href: '/payments', icon: CreditCard, label: 'Pagamentos' },
    { href: '/reports', icon: BarChart3, label: 'Relatórios' },
    {
      href: '/recommendations',
      icon: Sparkles,
      label: 'Recomendações IA',
    },
  ];

  const notifications = [
    { id: 1, title: "Pagamento Atrasado", description: "Cliente John Doe tem um pagamento pendente.", read: false },
    { id: 2, title: "Estoque Baixo", description: "Produto 'Cloro Tabs' está com apenas 5 unidades.", read: false },
    { id: 3, title: "Visita Concluída", description: "A visita para Jane Smith foi marcada como concluída.", read: true },
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold font-headline"
            >
              <PoolIcon className="h-6 w-6 text-primary" />
              <span>Piscinei App</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="ml-auto h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                     <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                  <span className="sr-only">Ativar notificações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map(notification => (
                   <DropdownMenuItem key={notification.id} className={cn(!notification.read && "font-bold")}>
                      <div className="flex flex-col">
                        <p>{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                      </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === item.href && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Alternar menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <SheetClose asChild>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <PoolIcon className="h-6 w-6 text-primary" />
                    <span>Piscinei App</span>
                  </Link>
                </SheetClose>
                {navItems.map((item) => (
                  <SheetClose key={item.label} asChild>
                    <Link
                        href={item.href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                          "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                          pathname === item.href && "bg-muted text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                        {item.badge && (
                          <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar clientes, produtos..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <ThemeToggle />
          <Link href="/settings">
              <Button variant="outline" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Configurações</span>
              </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <div className="rounded-full w-8 h-8 bg-primary" />
                <span className="sr-only">Alternar menu de usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Suporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
        </main>
      </div>
    </div>
  );
}
