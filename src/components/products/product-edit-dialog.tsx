
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, { message: 'O custo deve ser um valor positivo.' }),
  stock: z.coerce.number().int({ message: 'O estoque deve ser um número inteiro.' }).min(0),
});

type ProductEditDialogProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
}: ProductEditDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      cost: 0,
      stock: 0,
    },
  });

  React.useEffect(() => {
    if (product) {
        form.reset({
            name: product.name,
            description: product.description || '',
            cost: product.cost,
            stock: product.stock,
        });
    } else {
        form.reset({
            name: '',
            description: '',
            cost: 0,
            stock: 0,
        });
    }
  }, [product, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth?.currentUser || !firestore) {
        toast({
            variant: "destructive",
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para gerenciar produtos.",
        });
        return;
    }
    setIsSaving(true);
    
    try {
        const productData = {
            ...values,
            updatedAt: serverTimestamp(),
        };

        if (product?.id) {
            // Update existing product
            const productRef = doc(firestore, 'products', product.id);
            await setDoc(productRef, productData, { merge: true });
            toast({
                title: 'Produto Atualizado!',
                description: `As informações de ${values.name} foram salvas.`,
            });
        } else {
            // Create new product
            const collectionRef = collection(firestore, 'products');
            await addDoc(collectionRef, {
                ...productData,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Produto Adicionado!',
                description: `${values.name} foi adicionado ao seu catálogo.`,
            });
        }
        
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving product:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível salvar as informações do produto. Tente novamente.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
          <DialogDescription>
            {product ? 'Faça alterações nos dados do produto aqui.' : 'Preencha os dados do novo produto.'}
             Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] w-full">
            <div className='p-4'>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Custo (R$)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estoque</FormLabel>
                            <FormControl>
                                <Input type="number" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                     <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                            Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
                </Form>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
