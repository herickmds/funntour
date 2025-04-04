import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus } from "lucide-react";
import { BoatType } from "@shared/schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/layouts/admin-layout";
import { useAuth } from "@/hooks/use-auth";

// Schema para o formulário
const boatTypeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional()
});

type BoatTypeFormValues = z.infer<typeof boatTypeFormSchema>;

export default function BoatTypeList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState<BoatType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<BoatType | null>(null);

  // Form setup
  const form = useForm<BoatTypeFormValues>({
    resolver: zodResolver(boatTypeFormSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  // Query para buscar os tipos de embarcação
  const { data: boatTypes = [], isLoading } = useQuery<BoatType[]>({
    queryKey: ["/api/boat-types"],
    queryFn: ({ signal }) => 
      fetch("/api/boat-types", { signal })
        .then(res => {
          if (!res.ok) throw new Error("Erro ao buscar tipos de embarcação");
          return res.json();
        })
  });

  // Mutation para criar tipo de embarcação
  const createMutation = useMutation({
    mutationFn: async (data: BoatTypeFormValues) => {
      const res = await apiRequest("POST", "/api/boat-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boat-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de embarcação criado com sucesso",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar tipo de embarcação",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar tipo de embarcação
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BoatTypeFormValues }) => {
      const res = await apiRequest("PUT", `/api/boat-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boat-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de embarcação atualizado com sucesso",
      });
      setOpenDialog(false);
      setEditingType(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar tipo de embarcação",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir tipo de embarcação
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/boat-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boat-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de embarcação excluído com sucesso",
      });
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir tipo de embarcação",
        variant: "destructive",
      });
    },
  });

  // Abrir modal para edição
  const handleEditType = (type: BoatType) => {
    setEditingType(type);
    form.reset({
      name: type.name,
      description: type.description || ""
    });
    setOpenDialog(true);
  };

  // Abrir modal para exclusão
  const handleDeleteType = (type: BoatType) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  // Abrir modal para criar novo tipo
  const handleNewType = () => {
    setEditingType(null);
    form.reset({
      name: "",
      description: ""
    });
    setOpenDialog(true);
  };

  // Submeter o formulário
  const onSubmit = (data: BoatTypeFormValues) => {
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Confirmação de exclusão
  const confirmDelete = () => {
    if (typeToDelete) {
      deleteMutation.mutate(typeToDelete.id);
    }
  };

  // Verificar se o usuário é admin
  const isAdmin = user?.role === "admin";

  // Colunas da tabela
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Descrição",
      accessorKey: "description",
      cell: (type: BoatType) => type.description || "-"
    },
    {
      header: "Ações",
      accessorKey: "actions",
      cell: (type: BoatType) => (
        <div className="flex space-x-2">
          {isAdmin && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEditType(type)}
              >
                <Pencil className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeleteType(type)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tipos de Embarcação</CardTitle>
            <CardDescription>
              Gerencie os tipos de embarcação disponíveis no sistema
            </CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={handleNewType}>
              <Plus className="h-4 w-4 mr-1" /> Novo Tipo
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={boatTypes}
            searchKey="name"
          />
        </CardContent>
      </Card>

      {/* Modal de criação/edição */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Editar Tipo de Embarcação" : "Novo Tipo de Embarcação"}
            </DialogTitle>
            <DialogDescription>
              {editingType 
                ? "Atualize as informações do tipo de embarcação" 
                : "Preencha as informações para criar um novo tipo de embarcação"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do tipo de embarcação" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome que identifica o tipo de embarcação (Ex: Lancha, Veleiro)
                    </FormDescription>
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
                        placeholder="Descrição do tipo de embarcação" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais sobre o tipo de embarcação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpenDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) 
                    ? "Salvando..." 
                    : editingType ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o tipo de embarcação "{typeToDelete?.name}"?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}