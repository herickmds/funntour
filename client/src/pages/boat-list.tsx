import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boat } from "@shared/schema";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { boatTypeOptions } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function BoatList() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [boatToDelete, setBoatToDelete] = useState<Boat | null>(null);

  const { data: boats = [], isLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  const handleNavigateToNew = () => {
    navigate("/boats/new");
  };

  const handleEditBoat = (boat: Boat) => {
    navigate(`/boats/${boat.id}`);
  };

  const handleDeleteBoat = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/boats/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
      
      toast({
        title: "Embarcação excluída",
        description: "A embarcação foi excluída com sucesso.",
      });
      setBoatToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir embarcação",
        description: "Ocorreu um erro ao excluir a embarcação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Filter boats based on selected type and status
  const filteredBoats = boats.filter((boat) => {
    let typeMatch = true;
    let statusMatch = true;

    if (selectedType !== "all") {
      typeMatch = boat.type === selectedType;
    }

    if (selectedStatus !== "all") {
      statusMatch = boat.status === selectedStatus;
    }

    return typeMatch && statusMatch;
  });

  const columns = [
    {
      header: "Nome",
      accessorKey: "name" as keyof Boat,
      cell: (boat: Boat) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
            {/* We'll use a placeholder if there's no image available */}
            <div className="h-full w-full flex items-center justify-center text-gray-500">
              <span className="material-icons text-lg">directions_boat</span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{boat.name}</div>
            <div className="text-xs text-gray-500">{boat.size ? `${boat.size} pés` : "Tamanho não informado"}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Tipo",
      accessorKey: "type" as keyof Boat,
    },
    {
      header: "Passageiros",
      accessorKey: "passengerCount" as keyof Boat,
    },
    {
      header: "Marina",
      accessorKey: "marina" as keyof Boat,
      cell: (boat: Boat) => (
        <div>
          <div className="text-sm text-gray-900">{boat.marina || "Não informado"}</div>
          <div className="text-xs text-gray-500">
            {boat.city ? `${boat.city}, ${boat.state || ""}` : "Localização não informada"}
          </div>
        </div>
      ),
    },
    {
      header: "Situação",
      accessorKey: "status" as keyof Boat,
      cell: (boat: Boat) => (
        <Badge 
          className={`capitalize ${boat.status === "active" ? "bg-green-500 hover:bg-green-600" : "bg-destructive hover:bg-destructive/90"}`}
        >
          {boat.status === "active" ? "Ativa" : "Inativa"}
        </Badge>
      ),
    },
    {
      header: "Ações",
      accessorKey: "id" as keyof Boat,
      cell: (boat: Boat) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEditBoat(boat);
            }}
          >
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setBoatToDelete(boat);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir embarcação</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a embarcação "{boat.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBoatToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDeleteBoat(boat.id)}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Embarcações</h1>
          <p className="text-gray-500">Gerencie suas embarcações cadastradas</p>
        </div>
        <Button onClick={handleNavigateToNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Embarcação
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {boatTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DataTable
          data={filteredBoats}
          columns={columns}
          searchKey="name"
          onRowClick={handleEditBoat}
        />
      </div>
    </div>
  );
}
