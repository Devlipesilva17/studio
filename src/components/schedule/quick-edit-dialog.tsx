'use client';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useFirebase,
  useDoc,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import { doc, updateDoc, collection, query } from 'firebase/firestore';
import type { Visit, Pool, Product } from '@/lib/types';
import { Clipboard, Loader2, PlusCircle, Trash2 } from 'lucide-react';

function QuickEditDialog({ visit }: { visit: Visit }) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = React.useState(false);

  const poolRef = useMemoFirebase(() => {
    if (!user || !firestore || !visit || !visit.poolId) return null;
    return doc(
      firestore,
      `users/${user.uid}/clients/${visit.clientId}/pools`,
      visit.poolId
    );
  }, [user, firestore, visit]);

  const { data: poolData, isLoading: isPoolLoading } = useDoc<Pool>(poolRef);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);
  const { data: productList, isLoading: areProductsLoading } =
    useCollection<Product>(productsQuery);

  const [ph, setPh] = React.useState<number | undefined>(undefined);
  const [chlorine, setChlorine] = React.useState<number | undefined>(undefined);
  const [alkalinity, setAlkalinity] = React.useState<number | undefined>(
    undefined
  );
  const [calciumHardness, setCalciumHardness] = React.useState<
    number | undefined
  >(undefined);
  const [hasStains, setHasStains] = React.useState(false);
  const [hasScale, setHasScale] = React.useState(false);
  const [waterQuality, setWaterQuality] = React.useState<
    'green' | 'cloudy' | 'crystal-clear'
  >('crystal-clear');
  const [productsUsed, setProductsUsed] = React.useState<
    Visit['productsUsed']
  >([]);

  React.useEffect(() => {
    if (isOpen) {
      if (poolData) {
        setPh(poolData.ph);
        setChlorine(poolData.chlorine);
        setAlkalinity(poolData.alkalinity);
        setCalciumHardness(poolData.calciumHardness);
        setHasStains(poolData.hasStains || false);
        setHasScale(poolData.hasScale || false);
        setWaterQuality(poolData.waterQuality || 'crystal-clear');
      }
      if (visit) {
        setProductsUsed(visit.productsUsed || []);
      }
    }
  }, [poolData, visit, isOpen]);

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    setProductsUsed((prev) => {
      if (quantity > 0) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity } : p
        );
      } else {
        return prev.filter((p) => p.productId !== productId);
      }
    });
  };

  const handleAddProduct = (product: Product) => {
    setProductsUsed((prev) => {
      if (prev.some((p) => p.productId === product.id)) {
        return prev;
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
    setIsProductPopoverOpen(false);
  };
  
  const handleRemoveProduct = (productId: string) => {
      setProductsUsed(prev => prev.filter(p => p.productId !== productId));
  };


  const handleSave = async () => {
    if (!poolRef || !user || !visit || !firestore) return;
    setIsSaving(true);
    try {
      const updatedPoolData: Partial<Pool> = {
        ph,
        chlorine,
        alkalinity,
        calciumHardness,
        hasStains,
        hasScale,
        waterQuality,
      };
      await updateDoc(poolRef, updatedPoolData);

      const visitRef = doc(
        firestore,
        `users/${user.uid}/clients/${visit.clientId}/schedules`,
        visit.id
      );
      await updateDoc(visitRef, { productsUsed });

      toast({ title: 'Dados da Visita Atualizados!' });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível atualizar os dados.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isPoolLoading || areProductsLoading;

  const availableProducts = React.useMemo(() => {
    return productList?.filter(p => !productsUsed.some(up => up.productId === p.id) && p.stock > 0) || [];
  }, [productList, productsUsed]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Clipboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atualização Rápida da Visita</DialogTitle>
          <DialogDescription>
            Altere os parâmetros da piscina e adicione produtos utilizados.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="grid gap-6 py-4">
              <div>
                <h4 className="font-medium text-sm mb-3">
                  Parâmetros da Piscina
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ph">pH</Label>
                    <Input
                      id="ph"
                      type="number"
                      step="0.1"
                      value={ph ?? ''}
                      onChange={(e) => setPh(e.target.valueAsNumber)}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="chlorine">Cloro</Label>
                    <Input
                      id="chlorine"
                      type="number"
                      step="0.1"
                      value={chlorine ?? ''}
                      onChange={(e) => setChlorine(e.target.valueAsNumber)}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="alkalinity">Alcalinidade</Label>
                    <Input
                      id="alkalinity"
                      type="number"
                      value={alkalinity ?? ''}
                      onChange={(e) => setAlkalinity(e.target.valueAsNumber)}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hardness">Dureza</Label>
                    <Input
                      id="hardness"
                      type="number"
                      value={calciumHardness ?? ''}
                      onChange={(e) =>
                        setCalciumHardness(e.target.valueAsNumber)
                      }
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
                <div className="grid gap-2 mt-4">
                  <Label>Qualidade da Água</Label>
                  <Select
                    onValueChange={(v: any) => setWaterQuality(v)}
                    value={waterQuality}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crystal-clear">Cristalina</SelectItem>
                      <SelectItem value="cloudy">Turva</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stains"
                      checked={hasStains}
                      onCheckedChange={setHasStains}
                    />
                    <Label htmlFor="stains">Manchas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="scale"
                      checked={hasScale}
                      onCheckedChange={setHasScale}
                    />
                    <Label htmlFor="scale">Incrustações</Label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Produtos Utilizados</h4>
                <div className="space-y-3">
                  {productsUsed.map((usedProduct) => {
                    const productInfo = productList?.find(
                      (p) => p.id === usedProduct.productId
                    );
                    if (!productInfo) return null;
                    return (
                      <div
                        key={usedProduct.productId}
                        className="flex items-center justify-between"
                      >
                        <Label
                          htmlFor={`prod-${usedProduct.productId}`}
                          className="flex-1"
                        >
                          {productInfo.name}{' '}
                          <span className="text-xs text-muted-foreground">
                            ({productInfo.stock} em estoque)
                          </span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id={`prod-${usedProduct.productId}`}
                                type="number"
                                min="1"
                                max={productInfo.stock}
                                value={usedProduct.quantity}
                                onChange={(e) =>
                                handleProductQuantityChange(
                                    usedProduct.productId,
                                    e.target.valueAsNumber
                                )
                                }
                                className="w-20 h-8"
                            />
                            <Button variant="ghost" size="icon" className='h-8 w-8 text-destructive' onClick={() => handleRemoveProduct(usedProduct.productId)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Popover
                  open={isProductPopoverOpen}
                  onOpenChange={setIsProductPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Produto
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar produto..." />
                      <CommandList>
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {availableProducts.map((product) => (
                            <CommandItem
                              key={product.id}
                              onSelect={() => handleAddProduct(product)}
                            >
                              {product.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { QuickEditDialog };
