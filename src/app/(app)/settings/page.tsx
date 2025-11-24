// src/app/(app)/settings/page.tsx
'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons';

export default function SettingsPage() {
    const [isGoogleConnected, setIsGoogleConnected] = React.useState(false);
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Configurações</h1>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Preferências</CardTitle>
                        <CardDescription>Gerencie as configurações da sua conta e da aplicação.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="language">Idioma</Label>
                            <Select defaultValue="pt-BR">
                                <SelectTrigger id="language">
                                    <SelectValue placeholder="Selecione o idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Empresa</CardTitle>
                        <CardDescription>Atualize as informações da sua empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="company-name">Nome da Empresa</Label>
                            <Input id="company-name" placeholder="Nome da sua empresa" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo da Empresa</Label>
                            <Input id="logo" type="file" />
                             <p className="text-sm text-muted-foreground">
                                Envie o logo da sua empresa (PNG, JPG).
                            </p>
                        </div>
                        <Button>Salvar Alterações</Button>
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
                             <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="pending-clients-notifications" className="text-base">Clientes Pendentes</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receber notificações sobre clientes com pagamentos pendentes.
                                    </p>
                                </div>
                                <Switch id="pending-clients-notifications" />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="visits-notifications" className="text-base">Lembretes de Visitas</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receber notificações sobre visitas agendadas para o dia.
                                    </p>
                                </div>
                                <Switch id="visits-notifications" />
                            </div>
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
                                        <Button variant="destructive" onClick={() => setIsGoogleConnected(false)}>Desconectar</Button>
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
                                    <Button variant="outline">
                                        <GoogleIcon className="mr-2 h-4 w-4" />
                                        Conectar com Google
                                    </Button>
                                </div>
                            )}
                        </div>

                         <Button>Salvar Preferências</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
