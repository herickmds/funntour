import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PartnerPrice, Boat } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schema para o formulário
const priceFormSchema = z.object({
  boatId: z.number(),
  partnerId: z.number().optional(),
  pricingType: z.enum(["hourly", "daily"]),
  weekdayMorningPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  weekdayAfternoonPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  weekdayNightPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  weekendMorningPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  weekendAfternoonPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  weekendNightPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  holidayMorningPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  holidayAfternoonPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  holidayNightPrice: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" })
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

export default function PartnerPriceList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PartnerPrice | null>(null);
  const [activeTab, setActiveTab] = useState<string>("weekday");

  // Buscar todos os preços de parceiros
  const { data: partnerPrices = [], isLoading } = useQuery<PartnerPrice[]>({
    queryKey: ["/api/partner-prices"],
    queryFn: async () => {
      // Se for um parceiro, buscar apenas seus preços
      if (user?.role === "parceiro") {
        const res = await fetch(`/api/partners/${user.id}/prices`);
        if (!res.ok) throw new Error("Falha ao buscar preços de parceiro");
        return res.json();
      }
      
      // Admin busca todos os preços
      const res = await fetch("/api/partner-prices");
      if (!res.ok) throw new Error("Falha ao buscar preços de parceiros");
      return res.json();
    }
  });

  // Buscar embarcações
  const { data: boats = [] } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
    queryFn: async () => {
      const res = await fetch("/api/boats");
      if (!res.ok) throw new Error("Falha ao buscar embarcações");
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
  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      boatId: 0,
      partnerId: user?.role === "parceiro" ? user.id : undefined,
      pricingType: "hourly",
      weekdayMorningPrice: 0,
      weekdayAfternoonPrice: 0,
      weekdayNightPrice: 0,
      weekendMorningPrice: 0,
      weekendAfternoonPrice: 0,
      weekendNightPrice: 0,
      holidayMorningPrice: 0,
      holidayAfternoonPrice: 0,
      holidayNightPrice: 0
    }
  });

  // Mutation para criar preço
  const createMutation = useMutation({
    mutationFn: async (data: PriceFormValues) => {
      const res = await apiRequest("POST", "/api/partner-prices", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preço criado",
        description: "O preço foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-prices"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar preço",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar preço
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PriceFormValues }) => {
      const res = await apiRequest("PUT", `/api/partner-prices/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preço atualizado",
        description: "O preço foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-prices"] });
      form.reset();
      setOpen(false);
      setSelectedPrice(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar preço",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir preço
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/partner-prices/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Preço excluído",
        description: "O preço foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-prices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir preço",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Manipuladores
  const handleOpenDialog = (price?: PartnerPrice) => {
    if (price) {
      form.reset({
        boatId: price.boatId,
        partnerId: price.partnerId,
        pricingType: price.pricingType,
        weekdayMorningPrice: price.weekdayMorningPrice,
        weekdayAfternoonPrice: price.weekdayAfternoonPrice,
        weekdayNightPrice: price.weekdayNightPrice,
        weekendMorningPrice: price.weekendMorningPrice,
        weekendAfternoonPrice: price.weekendAfternoonPrice,
        weekendNightPrice: price.weekendNightPrice,
        holidayMorningPrice: price.holidayMorningPrice,
        holidayAfternoonPrice: price.holidayAfternoonPrice,
        holidayNightPrice: price.holidayNightPrice
      });
      setSelectedPrice(price);
    } else {
      form.reset({
        boatId: 0,
        partnerId: user?.role === "parceiro" ? user.id : undefined,
        pricingType: "hourly",
        weekdayMorningPrice: 0,
        weekdayAfternoonPrice: 0,
        weekdayNightPrice: 0,
        weekendMorningPrice: 0,
        weekendAfternoonPrice: 0,
        weekendNightPrice: 0,
        holidayMorningPrice: 0,
        holidayAfternoonPrice: 0,
        holidayNightPrice: 0
      });
      setSelectedPrice(null);
    }
    setOpen(true);
  };

  const handleDelete = (price: PartnerPrice) => {
    if (window.confirm(`Tem certeza que deseja excluir este preço?`)) {
      deleteMutation.mutate(price.id);
    }
  };

  const onSubmit = (data: PriceFormValues) => {
    if (selectedPrice) {
      updateMutation.mutate({ id: selectedPrice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Obter nome da embarcação
  const getBoatName = (boatId: number) => {
    const boat = boats.find(b => b.id === boatId);
    return boat ? boat.name : `ID: ${boatId}`;
  };

  // Obter nome do parceiro
  const getPartnerName = (partnerId: number) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.fullName : `ID: ${partnerId}`;
  };

  // Formatador de tipo de preço
  const formatPricingType = (type: string) => {
    return type === "hourly" ? "Por Hora" : "Diária";
  };

  // Colunas da tabela
  const columns = [
    {
      header: "Embarcação",
      accessorKey: "boatId",
      cell: (price: PartnerPrice) => getBoatName(price.boatId)
    },
    ...(user?.role === "admin" ? [
      {
        header: "Parceiro",
        accessorKey: "partnerId",
        cell: (price: PartnerPrice) => getPartnerName(price.partnerId)
      }
    ] : []),
    {
      header: "Tipo de Preço",
      accessorKey: "pricingType",
      cell: (price: PartnerPrice) => formatPricingType(price.pricingType)
    },
    {
      header: "Preço (Semana/Manhã)",
      accessorKey: "weekdayMorningPrice",
      cell: (price: PartnerPrice) => formatCurrency(price.weekdayMorningPrice)
    },
    {
      header: "Preço (Fim de Semana/Manhã)",
      accessorKey: "weekendMorningPrice",
      cell: (price: PartnerPrice) => formatCurrency(price.weekendMorningPrice)
    },
    {
      header: "Data de Criação",
      accessorKey: "createdAt",
      cell: (price: PartnerPrice) => formatDate(price.createdAt)
    },
    {
      header: "Ações",
      accessorKey: "id",
      cell: (price: PartnerPrice) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(price)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(price)}>
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
        <h1 className="text-3xl font-bold">Preços de Parceiros</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Novo Preço
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable 
            data={partnerPrices} 
            columns={columns}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedPrice ? "Editar Preço" : "Novo Preço"}</DialogTitle>
            <DialogDescription>
              {selectedPrice 
                ? "Edite os detalhes do preço selecionado." 
                : "Preencha os detalhes para criar um novo preço para parceiro."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="boatId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embarcação</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                        disabled={!!selectedPrice}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma embarcação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {boats.map((boat) => (
                            <SelectItem key={boat.id} value={boat.id.toString()}>
                              {boat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        A embarcação para a qual será definido o preço.
                      </FormDescription>
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
                          value={field.value ? field.value.toString() : ""}
                          disabled={!!selectedPrice}
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
                          O parceiro para o qual será definido este preço.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="pricingType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Preço</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="hourly" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Por Hora
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="daily" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Diária
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <Tabs defaultValue="weekday" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="weekday">Dias de Semana</TabsTrigger>
                  <TabsTrigger value="weekend">Final de Semana</TabsTrigger>
                  <TabsTrigger value="holiday">Feriados</TabsTrigger>
                </TabsList>
                <TabsContent value="weekday" className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Preços para Dias de Semana</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="weekdayMorningPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manhã</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekdayAfternoonPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarde</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekdayNightPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Noite</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="weekend" className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Preços para Final de Semana</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="weekendMorningPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manhã</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekendAfternoonPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarde</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekendNightPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Noite</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="holiday" className="pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Preços para Feriados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="holidayMorningPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manhã</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="holidayAfternoonPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarde</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="holidayNightPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Noite</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="pl-10" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {selectedPrice ? "Salvar Alterações" : "Criar Preço"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}