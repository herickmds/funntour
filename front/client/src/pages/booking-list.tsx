import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import AdminLayout from "@/layouts/admin-layout";
import { DataTable } from "@/components/ui/data-table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Booking, 
  User, 
  Boat, 
  Marina, 
  Route as RouteType,
  bookingStatusOptions
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarIcon, FilePenLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function BookingList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  // Fetch bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch boats for reference
  const { data: boats = [] } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  // Fetch marinas for reference
  const { data: marinas = [] } = useQuery<Marina[]>({
    queryKey: ["/api/marinas"],
  });

  // Fetch routes for reference
  const { data: routes = [] } = useQuery<RouteType[]>({
    queryKey: ["/api/routes"],
  });

  // Fetch users for reference (admin only)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin" || user?.role === "parceiro", // Only fetch for admin/partner users
  });

  // Delete booking mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Reserva excluída com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a reserva",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Status da reserva atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setStatusDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status da reserva",
        variant: "destructive",
      });
    },
  });

  // Handle delete booking
  const handleDeleteBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  // Handle update booking status
  const handleUpdateStatus = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedStatus(booking.status);
    setStatusDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedBooking) {
      deleteMutation.mutate(selectedBooking.id);
    }
  };

  // Confirm status update
  const confirmStatusUpdate = () => {
    if (selectedBooking && selectedStatus) {
      updateStatusMutation.mutate({ id: selectedBooking.id, status: selectedStatus });
    }
  };

  // Helper to get boat name
  const getBoatName = (boatId: number) => {
    const boat = boats.find(b => b.id === boatId);
    return boat ? boat.name : "-";
  };

  // Helper to get marina name
  const getMarinaName = (marinaId: number) => {
    const marina = marinas.find(m => m.id === marinaId);
    return marina ? marina.name : "-";
  };

  // Helper to get route name
  const getRouteName = (routeId: number) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : "-";
  };

  // Helper to get user name
  const getUserName = (userId: number) => {
    const userItem = users.find(u => u.id === userId);
    return userItem ? userItem.fullName : "-";
  };

  // Helper to format the period
  const formatPeriod = (period: string) => {
    switch (period) {
      case "morning": return "Manhã";
      case "afternoon": return "Tarde";
      case "night": return "Noite";
      default: return period;
    }
  };

  // Helper to render status badge
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline" = "default";
    
    switch (status) {
      case "pending":
        variant = "warning";
        return <Badge variant={variant}>Pendente</Badge>;
      case "confirmed":
        variant = "success";
        return <Badge variant={variant}>Confirmada</Badge>;
      case "cancelled":
        variant = "destructive";
        return <Badge variant={variant}>Cancelada</Badge>;
      case "completed":
        variant = "secondary";
        return <Badge variant={variant}>Concluída</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Column definition for data table
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Data",
      accessorKey: "date",
      cell: (booking: Booking) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{formatDate(booking.date)}</span>
        </div>
      ),
    },
    {
      header: "Período",
      accessorKey: "period",
      cell: (booking: Booking) => formatPeriod(booking.period),
    },
    {
      header: "Cliente",
      accessorKey: "userId",
      cell: (booking: Booking) => getUserName(booking.userId),
    },
    {
      header: "Embarcação",
      accessorKey: "boatId",
      cell: (booking: Booking) => getBoatName(booking.boatId),
    },
    {
      header: "Roteiro",
      accessorKey: "routeId",
      cell: (booking: Booking) => getRouteName(booking.routeId),
    },
    {
      header: "Marina",
      accessorKey: "marinaId",
      cell: (booking: Booking) => getMarinaName(booking.marinaId),
    },
    {
      header: "Passageiros",
      accessorKey: "passengerCount",
    },
    {
      header: "Valor",
      accessorKey: "totalPrice",
      cell: (booking: Booking) => formatCurrency(booking.totalPrice),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (booking: Booking) => renderStatusBadge(booking.status),
    },
    {
      header: "Ações",
      accessorKey: "actions",
      cell: (booking: Booking) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateStatus(booking)}
            disabled={updateStatusMutation.isPending}
          >
            <FilePenLine className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteBooking(booking)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
          <CardDescription>
            Gerencie as reservas e agendamentos de passeios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhuma reserva encontrada.
            </div>
          ) : (
            <DataTable
              data={bookings}
              columns={columns}
              searchKey="id"
            />
          )}
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-end">
          <div className="text-xs text-muted-foreground">
            Total de reservas: {bookings.length}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar status da reserva</DialogTitle>
            <DialogDescription>
              Altere o status da reserva selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status">Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                {bookingStatusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === "pending" && "Pendente"}
                    {status === "confirmed" && "Confirmada"}
                    {status === "cancelled" && "Cancelada"}
                    {status === "completed" && "Concluída"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmStatusUpdate}
              disabled={updateStatusMutation.isPending || !selectedStatus}
            >
              {updateStatusMutation.isPending ? "Atualizando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}