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
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Country, InsertCountry } from "@shared/schema";

// Form schema com validação
const countryFormSchema = z.object({
  name: z.string().min(1, "Nome do país é obrigatório"),
  code: z.string().min(2, "Código do país deve ter pelo menos 2 caracteres").max(3, "Código do país deve ter no máximo 3 caracteres"),
});

type CountryFormValues = z.infer<typeof countryFormSchema>;

export default function CountryList() {
  const [open, setOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: {
      name: "",
      code: "",
    }
  });

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CountryFormValues) => {
      const res = await apiRequest("POST", "/api/countries", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "País criado",
        description: "O país foi criado com sucesso.",
      });
      setOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar país",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CountryFormValues }) => {
      const res = await apiRequest("PATCH", `/api/countries/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "País atualizado",
        description: "O país foi atualizado com sucesso.",
      });
      setOpen(false);
      setEditingCountry(null);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar país",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/countries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "País excluído",
        description: "O país foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setCountryToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir país",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (country?: Country) => {
    if (country) {
      setEditingCountry(country);
      reset({
        name: country.name,
        code: country.code,
      });
    } else {
      setEditingCountry(null);
      reset({
        name: "",
        code: "",
      });
    }
    setOpen(true);
  };

  const handleDelete = (country: Country) => {
    setCountryToDelete(country);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: CountryFormValues) => {
    if (editingCountry) {
      updateMutation.mutate({ id: editingCountry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Nome", accessorKey: "name" },
    { header: "Código", accessorKey: "code", 
      cell: (country: Country) => (
        <Badge variant="outline">{country.code}</Badge>
      )
    },
    { header: "Criado em", accessorKey: "createdAt", 
      cell: (country: Country) => formatDate(country.createdAt)
    },
    { header: "Ações", accessorKey: "actions",
      cell: (country: Country) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleOpenDialog(country)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(country)}
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
        <h1 className="text-3xl font-bold">Gerenciamento de Países</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar País
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader">Carregando...</div>
        </div>
      ) : (
        <DataTable
          data={countries}
          columns={columns}
          searchKey="name"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCountry ? "Editar País" : "Adicionar País"}
            </DialogTitle>
            <DialogDescription>
              {editingCountry
                ? "Edite as informações do país no formulário abaixo."
                : "Preencha as informações do novo país abaixo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do País</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Brasil"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">Código do País (2-3 letras)</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="BR"
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.code.message}
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
                  setEditingCountry(null);
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
              Esta ação não pode ser desfeita. Isto irá excluir permanentemente o país 
              {countryToDelete && ` ${countryToDelete.name}`} e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => countryToDelete && deleteMutation.mutate(countryToDelete.id)}
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