import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Country, State, InsertState } from "@shared/schema";

// Form schema com validação
const stateFormSchema = z.object({
  name: z.string().min(1, "Nome do estado é obrigatório"),
  code: z.string().min(2, "Código do estado deve ter pelo menos 2 caracteres").max(3, "Código do estado deve ter no máximo 3 caracteres"),
  countryId: z.string().min(1, "País é obrigatório").transform(val => parseInt(val)),
});

type StateFormValues = z.infer<typeof stateFormSchema>;

export default function StateList() {
  const [open, setOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState<State | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<StateFormValues>({
    resolver: zodResolver(stateFormSchema),
    defaultValues: {
      name: "",
      code: "",
      countryId: "",
    }
  });

  const { data: states = [], isLoading } = useQuery<State[]>({
    queryKey: ["/api/states"],
    enabled: true,
  });

  const { data: countries = [], isLoading: isLoadingCountries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: StateFormValues) => {
      const res = await apiRequest("POST", "/api/states", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/states"] });
      toast({
        title: "Estado criado",
        description: "O estado foi criado com sucesso.",
      });
      setOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StateFormValues }) => {
      const res = await apiRequest("PATCH", `/api/states/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/states"] });
      toast({
        title: "Estado atualizado",
        description: "O estado foi atualizado com sucesso.",
      });
      setOpen(false);
      setEditingState(null);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/states/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/states"] });
      toast({
        title: "Estado excluído",
        description: "O estado foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setStateToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (state?: State) => {
    if (state) {
      setEditingState(state);
      reset({
        name: state.name,
        code: state.code,
        countryId: state.countryId.toString(),
      });
    } else {
      setEditingState(null);
      reset({
        name: "",
        code: "",
        countryId: "",
      });
    }
    setOpen(true);
  };

  const handleDelete = (state: State) => {
    setStateToDelete(state);
    setDeleteDialogOpen(true);
  };

  const getCountryName = (countryId: number) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : "Desconhecido";
  };

  const onSubmit = (data: StateFormValues) => {
    if (editingState) {
      updateMutation.mutate({ id: editingState.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Nome", accessorKey: "name" },
    { header: "Código", accessorKey: "code", 
      cell: (state: State) => (
        <Badge variant="outline">{state.code}</Badge>
      )
    },
    { header: "País", accessorKey: "countryId", 
      cell: (state: State) => getCountryName(state.countryId)
    },
    { header: "Criado em", accessorKey: "createdAt", 
      cell: (state: State) => formatDate(state.createdAt)
    },
    { header: "Ações", accessorKey: "actions",
      cell: (state: State) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleOpenDialog(state)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(state)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciamento de Estados</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Estado
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader">Carregando...</div>
        </div>
      ) : (
        <DataTable
          data={states}
          columns={columns}
          searchKey="name"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingState ? "Editar Estado" : "Adicionar Estado"}
            </DialogTitle>
            <DialogDescription>
              {editingState
                ? "Edite as informações do estado no formulário abaixo."
                : "Preencha as informações do novo estado abaixo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Estado</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="São Paulo"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">Código do Estado (2-3 letras)</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="SP"
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="countryId">País</Label>
                <Select
                  value={watch("countryId")}
                  onValueChange={(value) => setValue("countryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id.toString()}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countryId && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.countryId.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setEditingState(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá excluir permanentemente o estado 
              {stateToDelete && ` ${stateToDelete.name}`} e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stateToDelete && deleteMutation.mutate(stateToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}