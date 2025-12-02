
'use client';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { File, ListFilter, MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useFirestore,
  useCollection,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, deleteDoc, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const ProductEditDialog = dynamic(() => import('@/components/products/product-edit-dialog').then(module => ({ default: module.ProductEditDialog })), {
    ssr: false,
    loading: () => <div className='fixed inset-0 bg-black/50 flex items-center justify-center'><Skeleton className='h-96 w-full max-w-md' /></div>
});


export default function ProductsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [filter, setFilter] = React.useState('all');

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);

  const { data: productList, isLoading } = useCollection<Product>(productsQuery);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, "products", productId));
        toast({
            title: "Produto Excluído!",
            description: "O produto foi removido do seu catálogo.",
        });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível excluir o produto. Tente novamente.",
        });
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock > 10) return { text: 'Em Estoque', variant: 'default' as const, status: 'in-stock' };
    if (stock > 0) return { text: 'Estoque Baixo', variant: 'secondary' as const, status: 'low-stock' };
    return { text: 'Fora de Estoque', variant: 'destructive' as const, status: 'out-of-stock' };
  };
  
  const filteredProducts = React.useMemo(() => {
    if (!productList) return [];
    if (filter === 'all') return productList;
    if (filter === 'in-stock') {
        return productList.filter(p => getStockStatus(p.stock).status === 'in-stock' || getStockStatus(p.stock).status === 'low-stock');
    }
    return productList.filter(p => getStockStatus(p.stock).status === filter);
  }, [productList, filter]);

  const exportToCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum produto para exportar",
        description: "A lista de produtos atual está vazia.",
      });
      return;
    }

    const headers = ['ID', 'Nome', 'Descrição', 'Custo', 'Estoque'];
    const csvRows = [headers.join(',')];

    for (const product of filteredProducts) {
      const values = [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`,
        product.cost,
        product.stock,
      ];
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'produtos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Produtos
        </h1>
      </div>
      <Tabs defaultValue="all" onValueChange={setFilter}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="in-stock">Em Estoque</TabsTrigger>
            <TabsTrigger value="out-of-stock">Fora de Estoque</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={exportToCSV}>
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={handleAddNewProduct}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar Produto
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value={filter}>
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Gerencie o inventário dos seus produtos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Preço
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Estoque
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    filteredProducts &&
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground">{product.description}</div>
                            )}
                          </TableCell>
                           <TableCell className="text-center">
                            <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            R$ {(product.cost || 0).toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className={cn("hidden md:table-cell text-right font-bold", stockStatus.status === 'in-stock' ? 'text-green-600' : stockStatus.status === 'low-stock' ? 'text-amber-600' : 'text-red-600')}>
                            {product.stock}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditClick(product)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-destructive'>
                                            Excluir
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto
                                            "{product.name}".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                   {!isLoading && (!filteredProducts || filteredProducts.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Nenhum produto encontrado. Adicione um novo produto.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Mostrando <strong>1-{filteredProducts?.length ?? 0}</strong> de{' '}
                <strong>{productList?.length ?? 0}</strong> produtos
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
       {isEditDialogOpen && (
          <ProductEditDialog
            product={selectedProduct}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
       )}
    </>
  );
}
