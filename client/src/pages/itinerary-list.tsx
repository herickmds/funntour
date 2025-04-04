import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Itinerary } from "@shared/schema";

// Schema para o formulário
const itineraryFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  observations: z.string().optional(),
  partnerId: z.number().optional()
});

type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

export default function ItineraryList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);

  // Buscar todos os roteiros
  const { data: itineraries = [], isLoading } = useQuery<Itinerary[]>({
    queryKey: ["/api/itineraries"],
    queryFn: async () => {
      // Se for um parceiro, buscar apenas seus roteiros
      if (user?.role === "parceiro") {
        const res = await fetch(`/api/partners/${user.id}/itineraries`);
        if (!res.ok) throw new Error("Falha ao buscar roteiros");
        return res.json();
      }
      
      // Admin busca todos os roteiros
      const res = await fetch("/api/itineraries");
      if (!res.ok) throw new Error("Falha ao buscar roteiros");
      return res.json();
    }
  });

  // Buscar usuários parceiros (para o admin selecionar)
  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
    enabled: user?.role === "admin", // Apenas admin precisa dessa lista
    queryFn: async () => {
      const res = await fetch("/api/partners");
      if (!res.ok) throw new Error("Falha ao buscar parceiros");
      return res.json();
    }
  });

  // Formulário
  const form = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      observations: "",
      partnerId: user?.role === "parceiro" ? user.id : undefined
    }
  });

  // Mutation para criar roteiro
  const createMutation = useMutation({
    mutationFn: async (data: ItineraryFormValues) => {
      const res = await apiRequest("POST", "/api/itineraries", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Roteiro criado",
        description: "O roteiro foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar roteiro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar roteiro
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ItineraryFormValues }) => {
      const res = await apiRequest("PUT", `/api/itineraries/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Roteiro atualizado",
        description: "O roteiro foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
      form.reset();
      setOpen(false);
      setSelectedItinerary(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar roteiro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir roteiro
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/itineraries/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Roteiro excluído",
        description: "O roteiro foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir roteiro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Manipuladores
  const handleOpenDialog = (itinerary?: Itinerary) => {
    if (itinerary) {
      form.reset({
        name: itinerary.name,
        description: itinerary.description || undefined,
        observations: itinerary.observations || undefined,
        partnerId: itinerary.partnerId || undefined,
      });
      setSelectedItinerary(itinerary);
    } else {
      form.reset({
        name: "",
        description: "",
        observations: "",
        partnerId: user?.role === "parceiro" ? user.id : undefined
      });
      setSelectedItinerary(null);
    }
    setOpen(true);
  };

  const handleDelete = (itinerary: Itinerary) => {
    if (window.confirm(`Tem certeza que deseja excluir o roteiro "${itinerary.name}"?`)) {
      deleteMutation.mutate(itinerary.id);
    }
  };

  const onSubmit = (data: ItineraryFormValues) => {
    if (selectedItinerary) {
      updateMutation.mutate({ id: selectedItinerary.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Obter nome do parceiro
  const getPartnerName = (partnerId: number | null) => {
    if (!partnerId) return "N/A";
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.fullName : `ID: ${partnerId}`;
  };

  // Colunas da tabela
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Descrição",
      accessorKey: "description",
      cell: (itinerary: Itinerary) => itinerary.description || "-"
    },
    ...(user?.role === "admin" ? [
      {
        header: "Parceiro",
        accessorKey: "partnerId",
        cell: (itinerary: Itinerary) => getPartnerName(itinerary.partnerId)
      }
    ] : []),
    {
      header: "Data de Criação",
      accessorKey: "createdAt",
      cell: (itinerary: Itinerary) => formatDate(itinerary.createdAt)
    },
    {
      header: "Ações",
      accessorKey: "id",
      cell: (itinerary: Itinerary) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(itinerary)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(itinerary)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Roteiros</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Novo Roteiro
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable 
            data={itineraries} 
            columns={columns}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedItinerary ? "Editar Roteiro" : "Novo Roteiro"}</DialogTitle>
            <DialogDescription>
              {selectedItinerary 
                ? "Edite os detalhes do roteiro selecionado." 
                : "Preencha os detalhes para criar um novo roteiro."}
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
                      <Input {...field} placeholder="Nome do roteiro" />
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
                        {...field} 
                        placeholder="Descreva o roteiro (opcional)" 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Observações adicionais (opcional)" 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {user?.role === "admin" && (
                <FormField
                  control={form.control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parceiro</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um parceiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id.toString()}>
                              {partner.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o parceiro que será responsável por este roteiro.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {selectedItinerary ? "Salvar Alterações" : "Criar Roteiro"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}