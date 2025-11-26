
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
import { useI18n, useTranslation } from '@/i18n/provider';

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
    const t = useTranslation();
    const { language, setLanguage } = useI18n();
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
            language: language,
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
                language: userProfile.language || language,
                notifications: {
                    pendingClients: userProfile.notificationPrefs?.pendingClients || false,
                    visitReminders: userProfile.notificationPrefs?.visitReminders || false,
                },
            });
            if (userProfile.companyLogo) {
                setLogoPreview(userProfile.companyLogo);
            }
        }
    }, [userProfile, form, language]);
    
    const handleGoogleConnect = () => {
        if (!user) {
            toast({ variant: 'destructive', title: t('common.error'), description: t('settings.errorAuth') });
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
            if (event.source !== window.opener) {
                return;
            }

            if (event.data.type === 'google-auth-success') {
                toast({
                    title: t('settings.notifications.googleSyncSuccess'),
                    description: t('settings.notifications.googleSyncSuccessDesc'),
                });
                refetch();
            } else if (event.data.type === 'google-auth-error') {
                toast({
                    variant: 'destructive',
                    title: t('common.error'),
                    description: event.data.message || t('settings.errorSave'),
                });
            }
        };

        window.addEventListener('message', handleAuthMessage);
        return () => {
            window.removeEventListener('message', handleAuthMessage);
        };
    }, [refetch, toast, t]);


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
            toast({ variant: 'destructive', title: t('common.error'), description: t('settings.errorUserNotFound') });
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
            if (data.language) {
                setLanguage(data.language as 'pt' | 'en' | 'es');
            }
            toast({ title: t('common.success'), description: t('settings.saveSuccess') });
        } catch (error: any) {
            toast({ variant: 'destructive', title: t('common.error'), description: error.message || t('settings.errorSave') });
        } finally {
            setIsSaving(false);
        }
    };

    const isGoogleConnected = userProfile?.googleRefreshToken;
    const isLoading = isProfileLoading || isUserLoading;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">{t('settings.title')}</h1>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
                    <TabsTrigger value="notifications">{t('settings.tabs.notifications')}</TabsTrigger>
                    <TabsTrigger value="policies">{t('settings.tabs.policies')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-8 mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('settings.general.title')}</CardTitle>
                                        <CardDescription>{t('settings.general.description')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="language"
                                            render={({ field }) => (
                                                <FormItem>
                                                <Label>{t('settings.general.language')}</Label>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger id="language">
                                                            <SelectValue placeholder={t('settings.general.selectLanguage')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pt">{t('settings.general.languages.pt')}</SelectItem>
                                                        <SelectItem value="en">{t('settings.general.languages.en')}</SelectItem>
                                                        <SelectItem value="es">{t('settings.general.languages.es')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('settings.general.companyTitle')}</CardTitle>
                                        <CardDescription>{t('settings.general.companyDescription')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="company-name">{t('settings.general.companyName')}</Label>
                                                    <Input id="company-name" placeholder={t('settings.general.companyNamePlaceholder')} {...field} />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="space-y-2">
                                            <Label htmlFor="logo">{t('settings.general.companyLogo')}</Label>
                                            <div className='flex items-center gap-4'>
                                                {logoPreview && <Image src={logoPreview} alt="Preview do Logo" width={64} height={64} className="rounded-md object-cover" />}
                                                <Input id="logo" type="file" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {t('settings.general.uploadLogo')}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {t('settings.saveChanges')}
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
                                    <CardTitle>{t('settings.notifications.title')}</CardTitle>
                                    <CardDescription>{t('settings.notifications.description')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-medium">{t('settings.notifications.notificationsTitle')}</h3>
                                        <FormField
                                            control={form.control}
                                            name="notifications.pendingClients"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="pending-clients-notifications" className="text-base">{t('settings.notifications.pendingClients')}</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('settings.notifications.pendingClientsDesc')}
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
                                                        <Label htmlFor="visits-notifications" className="text-base">{t('settings.notifications.visitReminders')}</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('settings.notifications.visitRemindersDesc')}
                                                        </p>
                                                    </div>
                                                    <Switch id="visits-notifications" checked={field.value} onCheckedChange={field.onChange} />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="font-medium">{t('settings.notifications.googleSyncTitle')}</h3>
                                        {isLoading ? (
                                            <div className="flex items-center justify-center rounded-lg border p-6">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : isGoogleConnected ? (
                                            <>
                                                <div className="flex items-center justify-between rounded-lg border p-4 bg-secondary/30">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="google-calendar-sync" className="text-base">{t('settings.notifications.syncActive')}</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('settings.notifications.syncActiveDesc')}
                                                        </p>
                                                    </div>
                                                    <Button variant="destructive" disabled>{t('settings.notifications.disconnect')}</Button>
                                                </div>
                                                <div className="space-y-2 pl-4 border-l-2 ml-4">
                                                    <p className="text-sm font-medium">{t('settings.notifications.filterSync')}</p>
                                                    <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                                                        {t('settings.notifications.filterOptionsSoon')}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center rounded-lg border p-6 gap-4 text-center">
                                                <div className="space-y-0.5">
                                                    <p className="text-base font-semibold">{t('settings.notifications.connectGoogle')}</p>
                                                    <p className="text-sm text-muted-foreground max-w-sm">
                                                        {t('settings.notifications.connectGoogleDesc')}
                                                    </p>
                                                </div>
                                                <Button variant="outline" onClick={handleGoogleConnect} type="button" disabled={isLoading}>
                                                    <GoogleCalendarIcon className="mr-2 h-4 w-4" />
                                                    {t('settings.notifications.connectWithGoogle')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end mt-6">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {t('settings.saveNotifications')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
                
                <TabsContent value="policies">
                     <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t('settings.policies.title')}</CardTitle>
                            <CardDescription>{t('settings.policies.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="font-semibold">{t('settings.policies.termsOfService')}</h3>
                                <div className="text-sm text-muted-foreground space-y-2 p-4 border rounded-lg max-h-60 overflow-y-auto">
                                    <p>{t('settings.policies.termsContent')}</p>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <h3 className="font-semibold">{t('settings.policies.privacyPolicy')}</h3>
                                <div className="text-sm text-muted-foreground space-y-2 p-4 border rounded-lg max-h-60 overflow-y-auto">
                                    <p>{t('settings.policies.privacyContent')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    

    