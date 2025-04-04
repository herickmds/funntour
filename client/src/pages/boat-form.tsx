import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, useRoute } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { insertBoatSchema, Boat, Route as RouteType, BoatRoute, Prices, pricesSchema, BoatType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ShipIcon, 
  FileText, 
  GalleryHorizontal, 
  Map, 
  DollarSign, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileInput } from "@/components/ui/file-input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  boatTypeOptions, 
  fuelTypeOptions, 
  yesNoOptions,
  dayPeriods
} from "@/lib/utils";

// Form steps
enum FormStep {
  BASIC_INFO = 0,
  DETAILS = 1,
  PHOTOS = 2,
  ROUTES = 3,
  PRICING = 4
}

// Form schema with validation
const formSchema = insertBoatSchema.extend({
  // Fields to handle file uploads that aren't in the DB schema
  tieDocumentFile: z.any().optional(),
  boatImages: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Price form schema
const priceFormSchema = z.object({
  routeId: z.number(),
  weekdayPrices: pricesSchema,
  weekendPrices: pricesSchema,
  holidayPrices: pricesSchema,
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

export default function BoatForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.BASIC_INFO);
  const [expandedPricing, setExpandedPricing] = useState<number[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [routePrices, setRoutePrices] = useState<Record<number, PriceFormValues>>({});
  const [hasTieDocument, setHasTieDocument] = useState(false);
  
  const isEditMode = !!id;
  const boatId = isEditMode ? parseInt(id) : undefined;

  // Main form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "active",
      type: "",
      passengerCount: 0,
      hasSailor: false,
      model: "",
      size: undefined,
      marina: "",
      cruiseSpeed: "",
      allowsOvernight: false,
      country: "",
      state: "",
      city: "",
      fuel: "",
      suites: undefined,
      cabins: undefined,
      bathrooms: undefined,
      tieDocument: "",
    }
  });

  // Fetch boat data for edit mode
  const { data: boat, isLoading: isLoadingBoat } = useQuery<Boat>({
    queryKey: ["/api/boats", boatId],
    enabled: !!boatId,
  });

  // Fetch boat images
  const { data: boatImages = [] } = useQuery<any[]>({
    queryKey: ["/api/boats", boatId, "images"],
    enabled: !!boatId,
  });

  // Fetch all routes for selection
  const { data: routes = [] } = useQuery<RouteType[]>({
    queryKey: ["/api/routes"],
  });

  // Fetch boat-route associations
  const { data: boatRoutes = [] } = useQuery<(BoatRoute & { route: RouteType })[]>({
    queryKey: ["/api/boats", boatId, "routes"],
    enabled: !!boatId,
  });

  // Fetch boat types
  const { data: boatTypes = [] } = useQuery<BoatType[]>({
    queryKey: ["/api/boat-types"],
  });

  // Fetch marinas for selection
  const { data: marinas = [] } = useQuery<any[]>({
    queryKey: ["/api/marinas"],
  });

  // Update form with boat data when available
  useEffect(() => {
    if (boat) {
      // Se o tipo da embarcação é um número (ID), transforme em string para o Select
      const formattedBoat = {
        ...boat,
        type: boat.type ? String(boat.type) : "",
        tieDocumentFile: undefined,
        boatImages: undefined
      };
      
      form.reset(formattedBoat);
      setHasTieDocument(true);
    }
  }, [boat, form]);

  // Setup boat routes and pricing when data is available
  useEffect(() => {
    if (boatRoutes.length > 0) {
      const routeIds = boatRoutes.map(br => br.routeId);
      setSelectedRoutes(routeIds);
      
      const prices: Record<number, PriceFormValues> = {};
      boatRoutes.forEach(br => {
        prices[br.routeId] = {
          routeId: br.routeId,
          weekdayPrices: br.weekdayPrices as Prices,
          weekendPrices: br.weekendPrices as Prices,
          holidayPrices: br.holidayPrices as Prices,
        };
      });
      setRoutePrices(prices);
      setExpandedPricing([routeIds[0]]);
    }
  }, [boatRoutes]);

  // Create/update boat mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      
      // Add TIE document file if provided
      if (data.tieDocumentFile && data.tieDocumentFile.length > 0) {
        formData.append('tieDocument', data.tieDocumentFile[0]);
      }
      
      // Remove file fields from data before sending
      const { tieDocumentFile, boatImages, ...boatData } = data;
      
      // Add JSON data
      formData.append('data', JSON.stringify(boatData));
      
      if (isEditMode) {
        const res = await fetch(`/api/boats/${boatId}`, {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to update boat');
        }
        
        return await res.json();
      } else {
        const res = await fetch('/api/boats', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to create boat');
        }
        
        return await res.json();
      }
    },
    onSuccess: async (boat) => {
      // If there are images to upload, do it after boat creation
      const images = form.getValues('boatImages');
      if (images && images.length > 0) {
        await uploadImages(boat.id, images);
      }
      
      // Save route associations and prices
      for (const routeId of selectedRoutes) {
        if (routePrices[routeId]) {
          await saveRoutePrice(boat.id, routePrices[routeId]);
        }
      }
      
      // Show success message
      toast({
        title: isEditMode ? "Embarcação atualizada" : "Embarcação cadastrada",
        description: isEditMode 
          ? "A embarcação foi atualizada com sucesso." 
          : "A embarcação foi cadastrada com sucesso!",
      });
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
      
      // Navigate back to list
      navigate("/boats");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar embarcação",
        description: error.message || "Ocorreu um erro ao salvar a embarcação. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Upload images function
  const uploadImages = async (boatId: number, images: File[]) => {
    const formData = new FormData();
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }
    
    try {
      // Usar fetch diretamente para maior controle sobre o processo de upload
      const response = await fetch(`/api/boats/${boatId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload das imagens');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no upload de imagens:', error);
      throw error;
    }
  };

  // Save route price function
  const saveRoutePrice = async (boatId: number, priceData: PriceFormValues) => {
    await apiRequest('POST', `/api/boats/${boatId}/routes`, {
      routeId: priceData.routeId,
      weekdayPrices: priceData.weekdayPrices,
      weekendPrices: priceData.weekendPrices,
      holidayPrices: priceData.holidayPrices,
    });
  };

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    // Check if TIE document is provided
    if (!hasTieDocument && (!data.tieDocumentFile || data.tieDocumentFile.length === 0)) {
      toast({
        title: "Documento TIE obrigatório",
        description: "O documento TIE é obrigatório para cadastrar uma embarcação.",
        variant: "destructive",
      });
      return;
    }
    
    // Converte o tipo de string para número, se for um ID válido
    // Certifique-se de que o tipo é tratado corretamente
    let typeValue = data.type;
    if (data.type && !isNaN(Number(data.type))) {
      typeValue = parseInt(data.type);
    }
    
    const formattedData = {
      ...data,
      type: typeValue
    };
    
    saveMutation.mutateAsync(formattedData);
  };

  // Handle file upload for TIE document
  const handleTieDocumentUpload = (files: File[]) => {
    if (files.length > 0) {
      form.setValue('tieDocumentFile', files);
      setHasTieDocument(true);
    }
  };

  // Handle navigation between steps
  const nextStep = async () => {
    if (currentStep === FormStep.BASIC_INFO) {
      // Validate basic info step fields
      const basicFields = ['name', 'status', 'type', 'passengerCount'];
      const result = await form.trigger(basicFields as any);
      if (!result) return;
      
      // Garantindo que o tipo seja tratado corretamente
      const typeValue = form.getValues('type');
      if (typeValue && !isNaN(Number(typeValue))) {
        // Converte para número se for um valor numérico válido
        form.setValue('type', String(typeValue));
      }
    }
    
    if (currentStep === FormStep.DETAILS && !hasTieDocument) {
      // Validate TIE document
      const tieFile = form.getValues('tieDocumentFile');
      if (!tieFile || tieFile.length === 0) {
        toast({
          title: "Documento TIE obrigatório",
          description: "O documento TIE é obrigatório para cadastrar uma embarcação.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Garantir tratamento especial para a etapa de fotos
    if (currentStep === FormStep.PHOTOS) {
      // Valida que há pelo menos uma foto
      const boatImages = form.getValues('boatImages');
      
      if (!boatImages || boatImages.length === 0) {
        toast({
          title: "Fotos obrigatórias",
          description: "É necessário adicionar pelo menos uma foto da embarcação.",
          variant: "destructive",
        });
        return;
      }
      
      // Se houver imagens e o barco já tiver ID (modo de edição), podemos fazer upload agora
      if (boatImages && boatImages.length > 0 && boatId) {
        try {
          await uploadImages(boatId, boatImages);
          toast({
            title: "Imagens enviadas",
            description: "As imagens foram enviadas com sucesso.",
          });
        } catch (error) {
          toast({
            title: "Erro ao enviar imagens",
            description: "Ocorreu um erro ao enviar as imagens. Você poderá enviá-las mais tarde.",
            variant: "destructive",
          });
        }
      }
    }
    
    setCurrentStep(prev => (prev < FormStep.PRICING ? prev + 1 : prev));
  };

  const prevStep = () => {
    setCurrentStep(prev => (prev > FormStep.BASIC_INFO ? prev - 1 : prev));
  };

  // Route selection
  const toggleRouteSelection = (routeId: number) => {
    if (selectedRoutes.includes(routeId)) {
      setSelectedRoutes(prev => prev.filter(id => id !== routeId));
      
      // Remove pricing data for this route
      const newPrices = { ...routePrices };
      delete newPrices[routeId];
      setRoutePrices(newPrices);
    } else {
      setSelectedRoutes(prev => [...prev, routeId]);
      
      // Initialize pricing data for this route
      setRoutePrices(prev => ({
        ...prev,
        [routeId]: {
          routeId,
          weekdayPrices: { morning: 0, afternoon: 0, night: 0 },
          weekendPrices: { morning: 0, afternoon: 0, night: 0 },
          holidayPrices: { morning: 0, afternoon: 0, night: 0 },
        }
      }));
      
      // Expand this route's pricing section
      setExpandedPricing([routeId]);
    }
  };

  // Toggle pricing section expansion
  const togglePricingExpand = (routeId: number) => {
    if (expandedPricing.includes(routeId)) {
      setExpandedPricing(prev => prev.filter(id => id !== routeId));
    } else {
      setExpandedPricing(prev => [...prev, routeId]);
    }
  };

  // Update pricing data
  const updatePricing = (routeId: number, field: string, value: number) => {
    const [type, period] = field.split('.');
    
    setRoutePrices(prev => {
      const current = { ...prev[routeId] };
      
      if (type === 'weekday') {
        current.weekdayPrices = { 
          ...current.weekdayPrices, 
          [period]: value 
        };
      } else if (type === 'weekend') {
        current.weekendPrices = { 
          ...current.weekendPrices, 
          [period]: value 
        };
      } else if (type === 'holiday') {
        current.holidayPrices = { 
          ...current.holidayPrices, 
          [period]: value 
        };
      }
      
      return { ...prev, [routeId]: current };
    });
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate('/boats');
  };

  // Step rendering functions
  const renderProgressSteps = () => {
    const steps = [
      { title: "Dados Básicos", icon: <ShipIcon className="h-4 w-4" /> },
      { title: "Detalhes", icon: <FileText className="h-4 w-4" /> },
      { title: "Fotos", icon: <GalleryHorizontal className="h-4 w-4" /> },
      { title: "Roteiros", icon: <Map className="h-4 w-4" /> },
      { title: "Preços", icon: <DollarSign className="h-4 w-4" /> },
    ];

    return (
      <div className="flex items-center justify-center mb-8 overflow-x-auto py-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${currentStep === index 
                    ? 'border-primary bg-primary text-white' 
                    : currentStep > index 
                      ? 'border-green-500 bg-green-500 text-white' 
                      : 'border-gray-300 text-gray-400'}`}
              >
                {step.icon}
              </div>
              <span className={`text-xs font-medium mt-2 
                ${currentStep === index 
                  ? 'text-primary' 
                  : currentStep > index 
                    ? 'text-green-500' 
                    : 'text-gray-400'}`}>
                {step.title}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`w-16 h-0.5 mx-2 
                  ${currentStep > index 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBasicInfoStep = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Informações Básicas</h3>
        <p className="text-gray-500 text-sm">Preencha os dados básicos da embarcação</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Embarcação <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Nome da embarcação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Modelo da embarcação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Embarcação <span className="text-red-500">*</span></FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {boatTypes.length > 0 ? (
                    boatTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback para os tipos estáticos se a API ainda não retornou
                    boatTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tamanho (Pés)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  placeholder="Tamanho em pés" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="passengerCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de Passageiros <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  placeholder="Quantidade de passageiros" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="marina"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marina</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma marina" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {marinas.length > 0 ? (
                    marinas.map((marina) => (
                      <SelectItem key={marina.id} value={String(marina.id)}>
                        {marina.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="nenhuma">Nenhuma marina cadastrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fuel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Combustível</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o combustível" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fuelTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cruiseSpeed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Velocidade de Cruzeiro</FormLabel>
              <FormControl>
                <Input placeholder="Velocidade de cruzeiro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Situação <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="active" />
                    </FormControl>
                    <FormLabel className="font-normal">Ativa</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="inactive" />
                    </FormControl>
                    <FormLabel className="font-normal">Inativa</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasSailor"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tem Marinheiro?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value ? 'true' : 'false'}
                  value={field.value ? 'true' : 'false'}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="true" />
                    </FormControl>
                    <FormLabel className="font-normal">Sim</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="false" />
                    </FormControl>
                    <FormLabel className="font-normal">Não</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="allowsOvernight"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Permite Pernoite?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value ? 'true' : 'false'}
                  value={field.value ? 'true' : 'false'}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="true" />
                    </FormControl>
                    <FormLabel className="font-normal">Sim</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="false" />
                    </FormControl>
                    <FormLabel className="font-normal">Não</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Detalhes da Embarcação</h3>
        <p className="text-gray-500 text-sm">Informe detalhes adicionais sobre a embarcação</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BR">Brasil</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                  <SelectItem value="Angra dos Reis">Angra dos Reis</SelectItem>
                  <SelectItem value="Búzios">Búzios</SelectItem>
                  <SelectItem value="Paraty">Paraty</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="suites"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suítes</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0} 
                  placeholder="Quantidade de suítes" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cabins"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cabines</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0} 
                  placeholder="Quantidade de cabines" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banheiros</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0} 
                  placeholder="Quantidade de banheiros" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="tieDocumentFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento TIE <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <FileInput
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(files) => {
                      field.onChange(files);
                      handleTieDocumentUpload(files);
                    }}
                    description="PDF, JPG ou PNG até 10MB"
                    error={!hasTieDocument ? "O documento TIE é obrigatório para cadastrar uma embarcação." : undefined}
                  />
                </FormControl>
                <FormDescription>
                  {isEditMode && hasTieDocument && !field.value && "Documento já enviado anteriormente."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderPhotosStep = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Fotos da Embarcação</h3>
        <p className="text-gray-500 text-sm">Faça upload de fotos para mostrar sua embarcação (obrigatório)</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="boatImages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fotos da Embarcação <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <FileInput
                  accept="image/*"
                  onChange={(files) => field.onChange(files)}
                  multiple
                  preview
                  description="JPG, PNG ou WEBP até 5MB cada. Você pode selecionar várias fotos de uma vez."
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {boatImages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Imagens Existentes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {boatImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                  <img 
                    src={image.imageUrl} 
                    alt={`Imagem da embarcação ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={async () => {
                      try {
                        await apiRequest('DELETE', `/api/boats/images/${image.id}`);
                        await queryClient.invalidateQueries({ queryKey: ["/api/boats", boatId, "images"] });
                        toast({
                          title: "Imagem removida",
                          description: "A imagem foi removida com sucesso.",
                        });
                      } catch (error) {
                        toast({
                          title: "Erro ao remover imagem",
                          description: "Ocorreu um erro ao remover a imagem. Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoutesStep = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Roteiros Associados</h3>
        <p className="text-gray-500 text-sm">Associe roteiros disponíveis a esta embarcação</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Roteiros Disponíveis</label>
          <div className="border rounded-md overflow-auto max-h-64">
            <div className="divide-y">
              {routes.map((route) => (
                <div 
                  key={route.id} 
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRouteSelection(route.id)}
                >
                  <Checkbox
                    checked={selectedRoutes.includes(route.id)}
                    onCheckedChange={() => toggleRouteSelection(route.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{route.name}</p>
                    <p className="text-sm text-gray-500">Duração: {route.duration} horas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">Selecione os roteiros que esta embarcação realizará</p>
        </div>
        
        {selectedRoutes.length > 0 && (
          <div className="border rounded-md p-4 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-3">Roteiros Selecionados</h4>
            <div className="space-y-3">
              {selectedRoutes.map((routeId) => {
                const route = routes.find(r => r.id === routeId);
                if (!route) return null;
                
                return (
                  <div key={routeId} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <p className="font-medium text-gray-800">{route.name}</p>
                      <p className="text-sm text-gray-500">Duração: {route.duration} horas</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleRouteSelection(routeId)}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPricingStep = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Configuração de Preços</h3>
        <p className="text-gray-500 text-sm">Defina os preços para cada roteiro associado à embarcação</p>
      </div>
      
      {selectedRoutes.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-600">Nenhum roteiro selecionado. Volte à etapa anterior para selecionar roteiros.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={prevStep}
          >
            Voltar para Roteiros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {selectedRoutes.map((routeId) => {
            const route = routes.find(r => r.id === routeId);
            if (!route) return null;
            
            const priceData = routePrices[routeId];
            const isExpanded = expandedPricing.includes(routeId);
            
            return (
              <div key={routeId} className="border rounded-md overflow-hidden">
                <div 
                  className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer"
                  onClick={() => togglePricingExpand(routeId)}
                >
                  <h4 className="font-medium text-gray-800">{route.name}</h4>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                
                {isExpanded && priceData && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Dias da Semana</h5>
                        <div className="space-y-3">
                          {dayPeriods.map((period) => (
                            <div key={`weekday-${period.id}`}>
                              <label className="block text-sm text-gray-600 mb-1">{period.label}</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                  R$
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  className="pl-10"
                                  value={priceData.weekdayPrices[period.id as keyof Prices]}
                                  onChange={(e) => updatePricing(
                                    routeId, 
                                    `weekday.${period.id}`, 
                                    Number(e.target.value)
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Finais de Semana</h5>
                        <div className="space-y-3">
                          {dayPeriods.map((period) => (
                            <div key={`weekend-${period.id}`}>
                              <label className="block text-sm text-gray-600 mb-1">{period.label}</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                  R$
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  className="pl-10"
                                  value={priceData.weekendPrices[period.id as keyof Prices]}
                                  onChange={(e) => updatePricing(
                                    routeId, 
                                    `weekend.${period.id}`, 
                                    Number(e.target.value)
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Feriados</h5>
                        <div className="space-y-3">
                          {dayPeriods.map((period) => (
                            <div key={`holiday-${period.id}`}>
                              <label className="block text-sm text-gray-600 mb-1">{period.label}</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                  R$
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  className="pl-10"
                                  value={priceData.holidayPrices[period.id as keyof Prices]}
                                  onChange={(e) => updatePricing(
                                    routeId, 
                                    `holiday.${period.id}`, 
                                    Number(e.target.value)
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case FormStep.BASIC_INFO:
        return renderBasicInfoStep();
      case FormStep.DETAILS:
        return renderDetailsStep();
      case FormStep.PHOTOS:
        return renderPhotosStep();
      case FormStep.ROUTES:
        return renderRoutesStep();
      case FormStep.PRICING:
        return renderPricingStep();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Editar Embarcação" : "Nova Embarcação"}
          </h2>
          <p className="text-gray-500">
            {isEditMode 
              ? "Edite as informações da embarcação" 
              : "Preencha o formulário para cadastrar uma nova embarcação"}
          </p>
        </div>
      </div>
      
      {renderProgressSteps()}
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {renderCurrentStep()}
              
              <div className="mt-6 flex justify-between">
                {currentStep > 0 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                  >
                    Anterior
                  </Button>
                )}
                
                {currentStep < FormStep.PRICING ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="ml-auto"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={saveMutation.isPending || selectedRoutes.length === 0}
                    className="ml-auto bg-green-600 hover:bg-green-700"
                  >
                    {saveMutation.isPending ? "Salvando..." : isEditMode ? "Atualizar Embarcação" : "Cadastrar Embarcação"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
