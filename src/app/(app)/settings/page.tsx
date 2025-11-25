
'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';
import { GoogleCalendarIcon } from '@/components/icons';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User as UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const userRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading, refetch } = useDoc<UserProfile>(userRef);

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
    
    const handleGoogleConnect = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para conectar sua conta.' });
            return;
        }

        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const state = user.uid;
        const authUrl = `/api/auth/google?state=${state}`;

        window.open(
            authUrl,
            'google-auth',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    React.useEffect(() => {
        const handleAuthMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin && !event.origin.includes('cloudworkstations.dev')) {
                return;
            }

            if (event.data.type === 'google-auth-success') {
                toast({
                    title: 'Sincronização Ativada!',
                    description: 'Sua conta Google foi conectada com sucesso.',
                });
                refetch();
            } else if (event.data.type === 'google-auth-error') {
                toast({
                    variant: 'destructive',
                    title: 'Erro na Conexão',
                    description: event.data.message || 'Não foi possível conectar sua conta Google.',
                });
            }
        };

        window.addEventListener('message', handleAuthMessage);
        return () => {
            window.removeEventListener('message', handleAuthMessage);
        };
    }, [refetch, toast]);


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
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message || 'Não foi possível salvar as configurações.' });
        } finally {
            setIsSaving(false);
        }
    };

    const isGoogleConnected = userProfile?.googleRefreshToken;
    const isLoading = isProfileLoading || isUserLoading;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Configurações</h1>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="notifications">Notificações</TabsTrigger>
                    <TabsTrigger value="policies">Políticas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-8 mt-6">
                                <Card>
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

                                <Card>
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
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
                
                <TabsContent value="notifications">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                             <Card className="mt-6">
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
                                        {isLoading ? (
                                            <div className="flex items-center justify-center rounded-lg border p-6">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : isGoogleConnected ? (
                                            <>
                                                <div className="flex items-center justify-between rounded-lg border p-4 bg-secondary/30">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="google-calendar-sync" className="text-base">Sincronização Ativa</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Seus agendamentos estão sendo sincronizados com o Google Agenda.
                                                        </p>
                                                    </div>
                                                    <Button variant="destructive" disabled>Desconectar</Button>
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
                                                <Button variant="outline" onClick={handleGoogleConnect} type="button" disabled={isLoading}>
                                                    <GoogleCalendarIcon className="mr-2 h-4 w-4" />
                                                    Conectar com Google Agenda
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end mt-6">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar Notificações
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
                
                <TabsContent value="policies">
                     <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Políticas</CardTitle>
                            <CardDescription>Revise nossos termos de serviço e política de privacidade.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="font-semibold">Termos de Serviço</h3>
                                <div className="text-sm text-muted-foreground space-y-2 p-4 border rounded-lg max-h-60 overflow-y-auto">
                                    <p>Bem-vindo ao PoolCare Pro. Ao usar nossos serviços, você concorda com estes termos. Estes termos regem o uso do nosso aplicativo e quaisquer serviços relacionados fornecidos por nós.</p>
                                    <p>Você concorda em usar nosso serviço de forma responsável e em conformidade com todas as leis e regulamentos aplicáveis. Você não deve usar nosso serviço para qualquer finalidade ilegal ou não autorizada. O conteúdo que você cria, carrega ou compartilha é de sua responsabilidade.</p>
                                    <p>Podemos rescindir ou suspender seu acesso ao nosso serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos.</p>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <h3 className="font-semibold">Política de Privacidade</h3>
                                <div className="text-sm text-muted-foreground space-y-2 p-4 border rounded-lg max-h-60 overflow-y-auto">
                                    <p>Sua privacidade é importante para nós. É política do PoolCare Pro respeitar sua privacidade em relação a qualquer informação que possamos coletar de você em nosso aplicativo.</p>
                                    <p>Coletamos informações pessoais apenas quando realmente precisamos delas para fornecer um serviço a você. Coletamos por meios justos e legais, com seu conhecimento e consentimento. Também informamos por que estamos coletando e como serão usadas.</p>
                                    <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Os dados que armazenamos, protegeremos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    