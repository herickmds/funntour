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
import { Country, State, City, InsertCity } from "@shared/schema";

// Form schema com validação
const cityFormSchema = z.object({
  name: z.string().min(1, "Nome da cidade é obrigatório"),
  stateId: z.string().min(1, "Estado é obrigatório").transform(val => parseInt(val)),
});

type CityFormValues = z.infer<typeof cityFormSchema>;

export default function CityList() {
  const [open, setOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      name: "",
      stateId: "",
    }
  });

  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ["/api/cities"],
    enabled: true,
  });

  const { data: states = [], isLoading: isLoadingStates } = useQuery<State[]>({
    queryKey: ["/api/states"],
    enabled: true,
  });

  const { data: countries = [], isLoading: isLoadingCountries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
    enabled: true,
  });

  // Filtra os estados com base no país selecionado
  const filteredStates = selectedCountryId 
    ? states.filter(state => state.countryId === parseInt(selectedCountryId))
    : states;

  const createMutation = useMutation({
    mutationFn: async (data: CityFormValues) => {
      const res = await apiRequest("POST", "/api/cities", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      toast({
        title: "Cidade criada",
        description: "A cidade foi criada com sucesso.",
      });
      setOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CityFormValues }) => {
      const res = await apiRequest("PATCH", `/api/cities/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      toast({
        title: "Cidade atualizada",
        description: "A cidade foi atualizada com sucesso.",
      });
      setOpen(false);
      setEditingCity(null);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
      toast({
        title: "Cidade excluída",
        description: "A cidade foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      setCityToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir cidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (city?: City) => {
    if (city) {
      const cityState = states.find(s => s.id === city.stateId);
      setEditingCity(city);
      if (cityState) {
        setSelectedCountryId(cityState.countryId.toString());
      }
      reset({
        name: city.name,
        stateId: city.stateId.toString(),
      });
    } else {
      setEditingCity(null);
      setSelectedCountryId("");
      reset({
        name: "",
        stateId: "",
      });
    }
    setOpen(true);
  };

  const handleDelete = (city: City) => {
    setCityToDelete(city);
    setDeleteDialogOpen(true);
  };

  const getStateName = (stateId: number) => {
    const state = states.find(s => s.id === stateId);
    return state ? state.name : "Desconhecido";
  };

  const getCountryName = (stateId: number) => {
    const state = states.find(s => s.id === stateId);
    if (!state) return "Desconhecido";
    
    const country = countries.find(c => c.id === state.countryId);
    return country ? country.name : "Desconhecido";
  };

  const onSubmit = (data: CityFormValues) => {
    if (editingCity) {
      updateMutation.mutate({ id: editingCity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Nome", accessorKey: "name" },
    { header: "Estado", accessorKey: "stateId", 
      cell: (city: City) => getStateName(city.stateId)
    },
    { header: "País", accessorKey: "country", 
      cell: (city: City) => getCountryName(city.stateId)
    },
    { header: "Criado em", accessorKey: "createdAt", 
      cell: (city: City) => formatDate(city.createdAt)
    },
    { header: "Ações", accessorKey: "actions",
      cell: (city: City) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleOpenDialog(city)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(city)}
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
        <h1 className="text-3xl font-bold">Gerenciamento de Cidades</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Cidade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader">Carregando...</div>
        </div>
      ) : (
        <DataTable
          data={cities}
          columns={columns}
          searchKey="name"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCity ? "Editar Cidade" : "Adicionar Cidade"}
            </DialogTitle>
            <DialogDescription>
              {editingCity
                ? "Edite as informações da cidade no formulário abaixo."
                : "Preencha as informações da nova cidade abaixo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Cidade</Label>
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
                <Label htmlFor="country">País</Label>
                <Select
                  value={selectedCountryId}
                  onValueChange={(value) => {
                    setSelectedCountryId(value);
                    // Reset stateId when country changes
                    setValue("stateId", "");
                  }}
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stateId">Estado</Label>
                <Select
                  value={watch("stateId")}
                  onValueChange={(value) => setValue("stateId", value)}
                  disabled={!selectedCountryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStates.map((state) => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stateId && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.stateId.message}
                  </p>
                )}
                {!selectedCountryId && (
                  <p className="text-sm text-amber-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Selecione um país primeiro
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
                  setEditingCity(null);
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
              Esta ação não pode ser desfeita. Isto irá excluir permanentemente a cidade 
              {cityToDelete && ` ${cityToDelete.name}`} e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cityToDelete && deleteMutation.mutate(cityToDelete.id)}
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