import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Calendar, Tag, Clock, Sun, Sunset, Moon, 
  PlusCircle, Pencil, Trash2, ShipIcon, BookText 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Route, Boat, BoatRoute, Prices } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/layouts/admin-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PeriodKey = "morning" | "afternoon" | "night";
type PriceType = "weekday" | "weekend" | "holiday";

// Form schema
const priceFormSchema = z.object({
  routeId: z.number().min(1, { message: "Roteiro é obrigatório" }),
  weekdayPrices: z.object({
    morning: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
    afternoon: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
    night: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
  }),
  weekendPrices: z.object({
    morning: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
    afternoon: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
    night: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
  }),
  holidayPrices: z.object({
    morning: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
    afternoon: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
    night: z.coerce.number().min(0, { message: "Preço precisa ser igual ou maior que zero" }),
  }),
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

export default function PricingPage() {
  const { toast } = useToast();
  const [selectedBoat, setSelectedBoat] = useState<number | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedBoatRoute, setSelectedBoatRoute] = useState<number | null>(null);
  
  // Define form
  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      routeId: 0,
      weekdayPrices: {
        morning: 0,
        afternoon: 0,
        night: 0
      },
      weekendPrices: {
        morning: 0,
        afternoon: 0,
        night: 0
      },
      holidayPrices: {
        morning: 0,
        afternoon: 0,
        night: 0
      }
    }
  });

  // Load data
  const { data: boats = [], isLoading: isLoadingBoats } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });
  
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });
  
  const { data: boatRoutes = [], isLoading: isLoadingBoatRoutes } = useQuery<(BoatRoute & { route: Route })[]>({
    queryKey: ["/api/boats", selectedBoat, "routes"],
    enabled: selectedBoat !== null,
  });

  // Add price mutation
  const addPriceMutation = useMutation({
    mutationFn: async (data: PriceFormValues) => {
      if (!selectedBoat) throw new Error("Embarcação não selecionada");
      const response = await apiRequest(
        "POST", 
        `/api/boats/${selectedBoat}/routes`, 
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preço adicionado",
        description: "Preço do roteiro adicionado com sucesso",
      });
      setIsAddingPrice(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/boats", selectedBoat, "routes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar preço",
        variant: "destructive",
      });
    }
  });

  // Delete price mutation
  const deletePriceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/boat-routes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Preço removido",
        description: "Preço do roteiro removido com sucesso",
      });
      setIsConfirmDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/boats", selectedBoat, "routes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover preço",
        variant: "destructive",
      });
    }
  });
  
  const handleSelectBoat = (boatId: number) => {
    setSelectedBoat(boatId);
  };

  const handleAddPrice = () => {
    setIsAddingPrice(true);
  };

  const handleDeletePrice = (boatRouteId: number) => {
    setSelectedBoatRoute(boatRouteId);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeletePrice = () => {
    if (selectedBoatRoute) {
      deletePriceMutation.mutate(selectedBoatRoute);
    }
  };

  const onSubmit = (values: PriceFormValues) => {
    addPriceMutation.mutate(values);
  };
  
  const getPeriodIcon = (period: PeriodKey) => {
    switch(period) {
      case 'morning':
        return <Sun className="h-4 w-4 mr-1" />;
      case 'afternoon':
        return <Sunset className="h-4 w-4 mr-1" />;
      case 'night':
        return <Moon className="h-4 w-4 mr-1" />;
    }
  };
  
  const getPeriodName = (period: PeriodKey) => {
    switch(period) {
      case 'morning':
        return 'Manhã';
      case 'afternoon':
        return 'Tarde';
      case 'night':
        return 'Noite';
    }
  };

  // Check if route is already associated with the boat
  const isRouteAssociated = (routeId: number) => {
    return boatRoutes.some(br => br.routeId === routeId);
  };
  
  const renderPriceTable = (boatRoutes: (BoatRoute & { route: Route })[], priceType: PriceType) => {
    if (boatRoutes.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          Nenhum roteiro associado a esta embarcação.
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Roteiro</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="w-[120px]">Manhã</TableHead>
            <TableHead className="w-[120px]">Tarde</TableHead>
            <TableHead className="w-[120px]">Noite</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boatRoutes.map((boatRoute) => (
            <TableRow key={boatRoute.id}>
              <TableCell className="font-medium">{boatRoute.route.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  {boatRoute.route.duration} {boatRoute.route.duration > 1 ? 'horas' : 'hora'}
                </div>
              </TableCell>
              <TableCell>
                {formatCurrency(boatRoute[`${priceType}Prices`].morning)}
              </TableCell>
              <TableCell>
                {formatCurrency(boatRoute[`${priceType}Prices`].afternoon)}
              </TableCell>
              <TableCell>
                {formatCurrency(boatRoute[`${priceType}Prices`].night)}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeletePrice(boatRoute.id)}
                  disabled={deletePriceMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  const isLoading = isLoadingBoats || isLoadingRoutes || (selectedBoat !== null && isLoadingBoatRoutes);
  
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Preços</CardTitle>
          <CardDescription>
            Visualize e gerencie os preços para cada roteiro por embarcação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Selecione uma embarcação:</h3>
                <div className="flex flex-wrap gap-2">
                  {boats.map((boat) => (
                    <Button 
                      key={boat.id}
                      variant={selectedBoat === boat.id ? "default" : "outline"}
                      onClick={() => handleSelectBoat(boat.id)}
                      className="flex items-center"
                    >
                      <ShipIcon className="h-4 w-4 mr-2" />
                      {boat.name}
                    </Button>
                  ))}
                  
                  {boats.length === 0 && (
                    <div className="py-2 text-muted-foreground">
                      Nenhuma embarcação cadastrada.
                    </div>
                  )}
                </div>
              </div>
              
              {selectedBoat !== null && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Preços por Roteiro:</h3>
                    <Button
                      onClick={handleAddPrice}
                      disabled={routes.length === 0}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Adicionar Preço
                    </Button>
                  </div>
                  
                  <Tabs defaultValue="weekday">
                    <div className="flex justify-between items-center mb-4">
                      <TabsList>
                        <TabsTrigger value="weekday">
                          <Calendar className="h-4 w-4 mr-2" />
                          Dias Úteis
                        </TabsTrigger>
                        <TabsTrigger value="weekend">
                          <Calendar className="h-4 w-4 mr-2" />
                          Fins de Semana
                        </TabsTrigger>
                        <TabsTrigger value="holiday">
                          <Tag className="h-4 w-4 mr-2" />
                          Feriados
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          <Clock className="h-4 w-4 mr-1" />
                          Duração
                        </Badge>
                        <Badge variant="outline" className="mr-2">
                          <Sun className="h-4 w-4 mr-1" />
                          Manhã
                        </Badge>
                        <Badge variant="outline" className="mr-2">
                          <Sunset className="h-4 w-4 mr-1" />
                          Tarde
                        </Badge>
                        <Badge variant="outline">
                          <Moon className="h-4 w-4 mr-1" />
                          Noite
                        </Badge>
                      </div>
                    </div>
                    
                    <TabsContent value="weekday" className="mt-4">
                      {renderPriceTable(boatRoutes, 'weekday')}
                    </TabsContent>
                    
                    <TabsContent value="weekend" className="mt-4">
                      {renderPriceTable(boatRoutes, 'weekend')}
                    </TabsContent>
                    
                    <TabsContent value="holiday" className="mt-4">
                      {renderPriceTable(boatRoutes, 'holiday')}
                    </TabsContent>
                  </Tabs>
                </>
              )}
              
              {!selectedBoat && boats.length > 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Selecione uma embarcação para visualizar os preços.
                </div>
              )}
            </>
          )}
        </CardContent>
        {selectedBoat && (
          <CardFooter className="border-t p-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              Total de roteiros associados: {boatRoutes.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Total de roteiros disponíveis: {routes.length}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Add Price Dialog */}
      <Dialog open={isAddingPrice} onOpenChange={setIsAddingPrice}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar Preço de Roteiro</DialogTitle>
            <DialogDescription>
              Defina os preços para um roteiro associado à embarcação selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="routeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roteiro</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um roteiro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem 
                            key={route.id} 
                            value={route.id.toString()}
                            disabled={isRouteAssociated(route.id)}
                          >
                            <div className="flex items-center">
                              <BookText className="h-4 w-4 mr-2" />
                              {route.name} ({route.duration}h)
                              {isRouteAssociated(route.id) && (
                                <span className="ml-2 text-xs text-muted-foreground">(Já associado)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-md font-medium mb-3">Preços para Dias Úteis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weekdayPrices.morning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Sun className="h-4 w-4 mr-1" />
                            Manhã
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekdayPrices.afternoon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Sunset className="h-4 w-4 mr-1" />
                            Tarde
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekdayPrices.night"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Moon className="h-4 w-4 mr-1" />
                            Noite
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-md font-medium mb-3">Preços para Fins de Semana</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weekendPrices.morning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Sun className="h-4 w-4 mr-1" />
                            Manhã
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekendPrices.afternoon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Sunset className="h-4 w-4 mr-1" />
                            Tarde
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekendPrices.night"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Moon className="h-4 w-4 mr-1" />
                            Noite
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="text-md font-medium mb-3">Preços para Feriados</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="holidayPrices.morning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Sun className="h-4 w-4 mr-1" />
                            Manhã
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="holidayPrices.afternoon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Sunset className="h-4 w-4 mr-1" />
                            Tarde
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="holidayPrices.night"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Moon className="h-4 w-4 mr-1" />
                            Noite
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input className="pl-8" {...field} type="number" min="0" step="0.01" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingPrice(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPriceMutation.isPending}
                >
                  {addPriceMutation.isPending ? "Salvando..." : "Salvar Preço"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Preço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este preço? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={deletePriceMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePrice}
              disabled={deletePriceMutation.isPending}
            >
              {deletePriceMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}