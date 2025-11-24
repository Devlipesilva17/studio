// src/app/(app)/settings/page.tsx
'use client';
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons';
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User as UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

const settingsSchema = z.object({
  companyName: z.string().optional(),
  language: z.string().optional(),
  notifications: z.object({
    pendingClients: z.boolean().default(false),
    visitReminders: z.boolean().default(false),
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const userRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

    const [isSaving, setIsSaving] = React.useState(false);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            companyName: '',
            language: 'pt-BR',
            notifications: {
                pendingClients: false,
                visitReminders: false,
            },
        },
    });

    React.useEffect(() => {
        if (userProfile) {
            form.reset({
                companyName: userProfile.companyName || '',
                language: userProfile.language || 'pt-BR',
                notifications: {
                    pendingClients: userProfile.notificationPrefs?.pendingClients || false,
                    visitReminders: userProfile.notificationPrefs?.visitReminders || false,
                },
            });
            if (userProfile.companyLogo) {
                setLogoPreview(userProfile.companyLogo);
            }
        }
    }, [userProfile, form]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const onSubmit = async (data: SettingsFormValues) => {
        if (!userRef) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não encontrado.' });
            return;
        }
        setIsSaving(true);
        try {
            const dataToSave = {
                companyName: data.companyName,
                language: data.language,
                notificationPrefs: data.notifications,
                companyLogo: logoPreview,
            }
            await setDoc(userRef, dataToSave, { merge: true });
            toast({ title: "Sucesso!", description: "Suas configurações foram salvas." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar as configurações.' });
        } finally {
            setIsSaving(false);
        }
    };

    const isGoogleConnected = userProfile?.googleRefreshToken;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Configurações</h1>
            </div>

             <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Preferências</CardTitle>
                            <CardDescription>Gerencie as configurações da sua conta e da aplicação.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem>
                                    <Label>Idioma</Label>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger id="language">
                                            <SelectValue placeholder="Selecione o idioma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Empresa</CardTitle>
                            <CardDescription>Atualize as informações da sua empresa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                     <FormItem>
                                        <Label htmlFor="company-name">Nome da Empresa</Label>
                                        <Input id="company-name" placeholder="Nome da sua empresa" {...field} />
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="logo">Logo da Empresa</Label>
                                <div className='flex items-center gap-4'>
                                    {logoPreview && <Image src={logoPreview} alt="Preview do Logo" width={64} height={64} className="rounded-md object-cover" />}
                                    <Input id="logo" type="file" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Envie o logo da sua empresa (PNG, JPG).
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Notificações e Sincronização</CardTitle>
                            <CardDescription>Personalize suas notificações e a sincronização com o Google Agenda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-medium">Notificações</h3>
                                <FormField
                                    control={form.control}
                                    name="notifications.pendingClients"
                                    render={({ field }) => (
                                         <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="pending-clients-notifications" className="text-base">Clientes Pendentes</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receber notificações sobre clientes com pagamentos pendentes.
                                                </p>
                                            </div>
                                            <Switch id="pending-clients-notifications" checked={field.value} onCheckedChange={field.onChange} />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notifications.visitReminders"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="visits-notifications" className="text-base">Lembretes de Visitas</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receber notificações sobre visitas agendadas para o dia.
                                                </p>
                                            </div>
                                            <Switch id="visits-notifications" checked={field.value} onCheckedChange={field.onChange} />
                                        </FormItem>
                                     )}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="font-medium">Sincronização com Google Agenda</h3>
                                {isGoogleConnected ? (
                                    <>
                                        <div className="flex items-center justify-between rounded-lg border p-4 bg-secondary/30">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="google-calendar-sync" className="text-base">Sincronização Ativa</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Seus agendamentos estão sendo sincronizados com o Google Agenda.
                                                </p>
                                            </div>
                                            <Button variant="destructive">Desconectar</Button>
                                        </div>
                                        <div className="space-y-2 pl-4 border-l-2 ml-4">
                                            <p className="text-sm font-medium">Filtrar sincronização por:</p>
                                            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                                                As opções de filtro por bairro e cliente aparecerão aqui.
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border p-6 gap-4 text-center">
                                        <div className="space-y-0.5">
                                            <p className="text-base font-semibold">Conecte sua conta do Google</p>
                                            <p className="text-sm text-muted-foreground max-w-sm">
                                                Sincronize automaticamente seus agendamentos com o Google Agenda para nunca mais perder uma visita.
                                            </p>
                                        </div>
                                        <Button variant="outline" asChild type="button">
                                            <Link href="/api/auth/google">
                                                <GoogleIcon className="mr-2 h-4 w-4" />
                                                Conectar com Google
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar Preferências
                    </Button>
                </div>
            </form>
        </div>
    );
}