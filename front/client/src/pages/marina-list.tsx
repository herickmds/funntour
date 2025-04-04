import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Marina, insertMarinaSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import AdminLayout from "@/layouts/admin-layout";

// Form validation schema
const marinaFormSchema = insertMarinaSchema.extend({
  longitude: z.coerce.number().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
});

type MarinaFormValues = z.infer<typeof marinaFormSchema>;

export default function MarinaList() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMarina, setSelectedMarina] = useState<Marina | null>(null);

  // Get marinas data
  const { data: marinas = [], isLoading } = useQuery<Marina[]>({
    queryKey: ["/api/marinas"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Form setup with defaults
  const form = useForm<MarinaFormValues>({
    resolver: zodResolver(marinaFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "Brasil",
      description: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      latitude: null,
      longitude: null,
    },
  });

  // Create marina mutation
  const createMutation = useMutation({
    mutationFn: async (data: MarinaFormValues) => {
      const res = await apiRequest("POST", "/api/marinas", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Marina criada com sucesso",
        description: "A marina foi adicionada à lista",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar marina",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update marina mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MarinaFormValues }) => {
      const res = await apiRequest("PUT", `/api/marinas/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Marina atualizada com sucesso",
        description: "As informações da marina foram atualizadas",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar marina",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete marina mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/marinas/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Marina excluída com sucesso",
        description: "A marina foi removida da lista",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marinas"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir marina",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Handle edit marina button click
  const handleEditMarina = (marina: Marina) => {
    setSelectedMarina(marina);
    
    // Set form values
    form.reset({
      name: marina.name,
      address: marina.address,
      city: marina.city,
      state: marina.state,
      country: marina.country,
      description: marina.description,
      contactName: marina.contactName,
      contactPhone: marina.contactPhone,
      contactEmail: marina.contactEmail,
      latitude: marina.latitude,
      longitude: marina.longitude,
    });
    
    setIsFormOpen(true);
  };

  // Handle delete marina button click
  const handleDeleteMarina = (marina: Marina) => {
    setSelectedMarina(marina);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submit
  const onSubmit = (data: MarinaFormValues) => {
    if (selectedMarina) {
      updateMutation.mutate({ id: selectedMarina.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle form close
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedMarina(null);
    form.reset({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "Brasil",
      description: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      latitude: null,
      longitude: null,
    });
  };

  // Table columns definition
  const columns = [
    { header: "Nome", accessorKey: "name" },
    { header: "Localização", accessorKey: "city", 
      cell: (marina: Marina) => {
        const location = [marina.city, marina.state].filter(Boolean).join(", ");
        return location || "-";
      } 
    },
    { header: "Contato", accessorKey: "contactName",
      cell: (marina: Marina) => marina.contactName || "-"
    },
    { header: "Data de Criação", accessorKey: "createdAt",
      cell: (marina: Marina) => formatDate(marina.createdAt)
    },
    { header: "Ações", accessorKey: "id",
      cell: (marina: Marina) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditMarina(marina)}>
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteMarina(marina)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Marinas</CardTitle>
            <CardDescription>
              Gerencie as marinas parceiras e pontos de embarque
            </CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Marina
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Carregando marinas...
            </div>
          ) : marinas.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhuma marina cadastrada. Clique em "Nova Marina" para adicionar.
            </div>
          ) : (
            <DataTable data={marinas} columns={columns} />
          )}
        </CardContent>
      </Card>

      {/* Marina Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMarina ? "Editar Marina" : "Nova Marina"}
            </DialogTitle>
            <DialogDescription>
              {selectedMarina
                ? "Atualize as informações da marina selecionada"
                : "Preencha os detalhes da nova marina"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Marina *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Marina Angra dos Reis" />
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
                        <Textarea {...field} placeholder="Breve descrição sobre a marina" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Av. Principal, 123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Angra dos Reis" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="RJ" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brasil" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="-23.0123" 
                          />
                        </FormControl>
                        <FormDescription>Coordenadas geográficas (opcional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="-44.3218" 
                          />
                        </FormControl>
                        <FormDescription>Coordenadas geográficas (opcional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="font-medium text-lg pt-2">Dados para Contato</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Responsável pela marina" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(24) 98765-4321" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contato@marinaangra.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseForm}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? "Salvando..." 
                    : selectedMarina ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a marina "{selectedMarina?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMarina && deleteMutation.mutate(selectedMarina.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}