import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRouteSchema, Route } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import AdminLayout from "@/layouts/admin-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const routeFormSchema = insertRouteSchema.extend({
  duration: z.coerce.number().min(1, "A duração mínima é de 1 hora"),
  price: z.coerce.number().min(0, "O preço não pode ser negativo"),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

export default function RouteList() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  const { data: routes = [], isLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
    staleTime: 5000,
  });
  
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 1,
      price: 0
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: RouteFormValues) => {
      const res = await apiRequest("POST", "/api/routes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({
        title: "Roteiro criado",
        description: "O roteiro foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar roteiro: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({
        title: "Roteiro excluído",
        description: "O roteiro foi excluído com sucesso.",
      });
      setIsDeleteAlertOpen(false);
      setSelectedRoute(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir roteiro: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateClick = () => {
    form.reset();
    setSelectedRoute(null);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (route: Route) => {
    setSelectedRoute(route);
    form.reset({
      name: route.name,
      description: route.description || "",
      duration: route.duration,
      price: route.price || 0,
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (route: Route) => {
    setSelectedRoute(route);
    setIsDeleteAlertOpen(true);
  };
  
  const onSubmit = (data: RouteFormValues) => {
    if (selectedRoute) {
      // Aqui implementaríamos a edição, mas a API ainda não suporta
      toast({
        title: "Função não implementada",
        description: "A edição de roteiros será implementada em breve.",
        variant: "destructive",
      });
    } else {
      createMutation.mutate(data);
    }
  };
  
  const tableColumns = [
    { header: "Nome", accessorKey: "name" },
    { 
      header: "Descrição", 
      accessorKey: "description",
      cell: (route: Route) => route.description || "-"
    },
    { 
      header: "Duração", 
      accessorKey: "duration",
      cell: (route: Route) => `${route.duration} ${route.duration > 1 ? 'horas' : 'hora'}`
    },
    { 
      header: "Preço Base", 
      accessorKey: "price",
      cell: (route: Route) => formatCurrency(route.price || 0)
    },
    { 
      header: "Data de Criação", 
      accessorKey: "createdAt",
      cell: (route: Route) => formatDate(route.createdAt)
    },
    {
      header: "Ações",
      accessorKey: "id",
      cell: (route: Route) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditClick(route)}>
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(route)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Roteiros</CardTitle>
            <CardDescription>
              Gerencie os roteiros disponíveis para as embarcações
            </CardDescription>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Roteiro
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum roteiro cadastrado. Clique em "Novo Roteiro" para começar.
            </div>
          ) : (
            <DataTable 
              data={routes} 
              columns={tableColumns} 
            />
          )}
        </CardContent>
      </Card>
      
      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedRoute ? "Editar Roteiro" : "Novo Roteiro"}</DialogTitle>
            <DialogDescription>
              {selectedRoute 
                ? "Edite as informações do roteiro selecionado" 
                : "Preencha as informações para criar um novo roteiro"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Roteiro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Volta à Ilha Grande" {...field} />
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
                      <Textarea 
                        placeholder="Descrição detalhada do roteiro..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (horas)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {selectedRoute ? "Salvar Alterações" : "Criar Roteiro"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o roteiro "{selectedRoute?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRoute && deleteMutation.mutate(selectedRoute.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}