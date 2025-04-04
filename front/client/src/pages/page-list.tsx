import React, { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/layouts/admin-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Page } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PrefixedInput } from "@/components/ui/prefixed-input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema para o formulário
const pageSchema = z.object({
  title: z.string().min(1, "Nome da página é obrigatório"),
  slug: z.string().min(1, "URL da página é obrigatória").regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens são permitidos"),
});

type PageFormValues = z.infer<typeof pageSchema>;

export default function PageList() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);

  // Form para criar/editar página
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "",
      slug: "",
    },
  });

  // Obter todas as páginas
  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/pages");
        if (!response.ok) {
          throw new Error("Erro ao carregar páginas");
        }
        return await response.json();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar páginas",
          description: error instanceof Error ? error.message : "Erro desconhecido",
        });
        throw error;
      }
    }
  });

  // Mutation para criar página
  const createPageMutation = useMutation({
    mutationFn: async (data: PageFormValues) => {
      const res = await apiRequest("POST", "/api/pages", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Página criada com sucesso",
        description: "A página foi criada e está disponível no sistema.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar página",
        description: error.message,
      });
    },
  });

  // Mutation para atualizar página
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PageFormValues }) => {
      const res = await apiRequest("PATCH", `/api/pages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Página atualizada com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar página",
        description: error.message,
      });
    },
  });

  // Mutation para excluir página
  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Página excluída com sucesso",
        description: "A página foi removida do sistema.",
      });
      setIsDeleteDialogOpen(false);
      setCurrentPage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir página",
        description: error.message,
      });
    },
  });

  // Handler para abrir o formulário de edição
  const handleEditPage = (page: Page) => {
    setCurrentPage(page);
    form.reset({
      title: page.title,
      slug: page.slug,
    });
    setIsEditDialogOpen(true);
  };

  // Handler para abrir o formulário de criação
  const handleCreatePage = () => {
    form.reset({
      title: "",
      slug: "",
    });
    setIsCreateDialogOpen(true);
  };

  // Handler para abrir o dialog de exclusão
  const handleDeletePage = (page: Page) => {
    setCurrentPage(page);
    setIsDeleteDialogOpen(true);
  };

  // Handler para enviar o formulário
  const onSubmit = (values: PageFormValues) => {
    if (isCreateDialogOpen) {
      createPageMutation.mutate(values);
    } else if (isEditDialogOpen && currentPage) {
      updatePageMutation.mutate({ id: currentPage.id, data: values });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Páginas</h1>
          <Button onClick={handleCreatePage} className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Nova Página
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable
            data={pages}
            columns={[
              { header: "ID", accessorKey: "id" },
              { header: "Nome da Página", accessorKey: "title" },
              { header: "URL", accessorKey: "slug" },
              { 
                header: "Data de Criação", 
                accessorKey: "createdAt", 
                cell: (page: Page) => formatDate(page.createdAt)
              },
              {
                header: "Ações",
                accessorKey: "id",
                cell: (page: Page) => (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditPage(page)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePage(page)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )}
      </div>

      {/* Dialog para criar página */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Página</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Página</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da página" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da página</FormLabel>
                    <FormControl>
                      <PrefixedInput 
                        prefix="https://funntour.com/" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                        placeholder="caminho-da-pagina" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={createPageMutation.isPending}
                >
                  {createPageMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar página */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Página</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Página</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da página" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da página</FormLabel>
                    <FormControl>
                      <PrefixedInput 
                        prefix="https://funntour.com/" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                        placeholder="caminho-da-pagina" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={updatePageMutation.isPending}
                >
                  {updatePageMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertDescription>
              Tem certeza que deseja excluir a página "{currentPage?.title}"? Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => currentPage && deletePageMutation.mutate(currentPage.id)}
              disabled={deletePageMutation.isPending}
            >
              {deletePageMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}