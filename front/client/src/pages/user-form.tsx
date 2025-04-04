import { useState, useEffect } from "react";
import { useLocation, useRoute, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  validationUserSchema, 
  userRoles, 
  User, 
  InsertUser,
  State,
  City,
} from "@shared/schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Upload, X, User as UserIcon } from "lucide-react";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Create a schema for the form with required fields
// We need to recreate the validation schema to avoid using `.omit` and `.extend` methods
// since they're causing TypeScript issues

const userEditSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(userRoles, {
    errorMap: () => ({ message: "Perfil de usuário inválido" })
  }),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  document: z.string().min(1, "CPF/CNPJ é obrigatório"),
  documentType: z.enum(["CPF", "CNPJ"], {
    errorMap: () => ({ message: "Tipo de documento inválido" })
  }),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isAdult: z.boolean().refine((val) => val === true, {
    message: "É necessário confirmar que o usuário é maior de idade"
  }),
});

// Schema for new user with password requirements
const userFormSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/,
      "A senha deve conter 1 caractere especial, 1 caractere numérico, 1 letra maiúscula e 1 letra minúscula e ser maior que 8 dígitos!"
    ),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  role: z.enum(userRoles, {
    errorMap: () => ({ message: "Perfil de usuário inválido" })
  }),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  document: z.string().min(1, "CPF/CNPJ é obrigatório"),
  documentType: z.enum(["CPF", "CNPJ"], {
    errorMap: () => ({ message: "Tipo de documento inválido" })
  }),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isAdult: z.boolean().refine((val) => val === true, {
    message: "É necessário confirmar que o usuário é maior de idade"
  }),
  profileImage: z.instanceof(FileList).optional().refine(
    (files) => {
      if (!files) return true;
      return files.length > 0;
    },
    { message: "A foto de perfil é obrigatória" }
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não são iguais!",
  path: ["confirmPassword"]
});

// Type for form values
type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserForm() {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute("/users/:id");
  const { toast } = useToast();
  const { id } = match ? params : { id: "new" };
  const isEditMode = id !== "new";
  
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("informacoes-pessoais");
  const [selectedStateId, setSelectedStateId] = useState<string>("");

  // Carregar estados
  const { data: states = [] } = useQuery<State[]>({
    queryKey: ["/api/states"],
  });

  // Carregar cidades com base no estado selecionado
  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities", selectedStateId],
    enabled: !!selectedStateId,
    queryFn: async () => {
      const response = await fetch(`/api/cities?stateId=${selectedStateId}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar cidades");
      }
      return response.json();
    },
  });

  // Get user data if in edit mode
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${id}`],
    enabled: isEditMode,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? userEditSchema : userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      document: "",
      documentType: "CPF",
      birthDate: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      role: "cliente",
      isAdult: false,
      ...(isEditMode ? { password: undefined, confirmPassword: undefined } : {}),
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user && isEditMode) {
      form.reset({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        document: user.document,
        documentType: user.documentType as "CPF" | "CNPJ",
        birthDate: user.birthDate,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        role: user.role as typeof userRoles[number],
        isAdult: true,
      });
      
      if (user.photoUrl) {
        setProfilePreview(user.photoUrl);
      }
      
      // Se tiver um estado selecionado, atualize o selectedStateId
      if (user.state) {
        const state = states.find(s => s.name === user.state);
        if (state) {
          setSelectedStateId(state.id.toString());
        }
      }
    }
  }, [user, form, isEditMode, states]);
  
  // Monitorar mudanças no estado selecionado no formulário
  useEffect(() => {
    const stateSubscription = form.watch((value, { name }) => {
      if (name === 'state') {
        const stateName = value.state;
        const state = states.find(s => s.name === stateName);
        if (state) {
          setSelectedStateId(state.id.toString());
          // Limpar cidade quando trocar de estado
          form.setValue('city', '');
        }
      }
    });
    
    return () => stateSubscription.unsubscribe();
  }, [form, states]);

  // Handle file upload preview
  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setProfilePreview(user?.photoUrl || null);
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // API mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/users", data, {
        isFormData: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
        description: "O usuário foi adicionado ao sistema.",
      });
      navigate("/users");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data, {
        isFormData: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso",
        description: "As informações do usuário foram atualizadas.",
      });
      navigate("/users");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    const formData = new FormData();
    
    // Add all form fields except file to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "profileImage" && key !== "isAdult" && value !== undefined) {
        formData.append(key, value as string);
      }
    });
    
    // Add file if available
    if (data.profileImage && data.profileImage.length > 0) {
      formData.append("profileImage", data.profileImage[0]);
    }
    
    if (isEditMode) {
      updateUserMutation.mutate(formData);
    } else {
      createUserMutation.mutate(formData);
    }
  };

  if (isEditMode && isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/users")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? "Editar Usuário" : "Novo Usuário"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile sidebar */}
            <Card className="col-span-1">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2 flex flex-col items-center">
                  <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20">
                    {profilePreview ? (
                      <>
                        <img
                          src={profilePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={() => {
                            setProfilePreview(null);
                            form.setValue("profileImage", undefined);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <UserIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Foto de Perfil</FormLabel>
                        <FormControl>
                          <div className="flex justify-center">
                            <label
                              htmlFor="profileImage"
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                            >
                              <Upload className="h-4 w-4" />
                              <span>Upload</span>
                              <input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  onChange(e.target.files);
                                  handleFileChange(e.target.files);
                                }}
                                {...field}
                              />
                            </label>
                          </div>
                        </FormControl>
                        <FormDescription className="text-center">
                          JPG, PNG ou GIF. Máximo 2MB.
                        </FormDescription>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perfil de Usuário</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um perfil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role === "admin" ? "Administrador" : 
                                 role === "cliente" ? "Cliente" : 
                                 role === "parceiro" ? "Parceiro" : role}
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
                    name="isAdult"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Confirmar Idade
                          </FormLabel>
                          <FormDescription>
                            Confirmo que o usuário é maior de idade
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Main form */}
            <div className="col-span-1 lg:col-span-3">
              <Card>
                <CardContent className="pt-6">
                  <Tabs
                    value={selectedTab}
                    onValueChange={setSelectedTab}
                    className="space-y-6"
                  >
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="informacoes-pessoais">
                        Informações Pessoais
                      </TabsTrigger>
                      <TabsTrigger value="conta">
                        Conta
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="informacoes-pessoais"
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="documentType"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Tipo de Documento</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                  >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="CPF" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        CPF
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="CNPJ" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        CNPJ
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="document"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {form.watch("documentType") === "CPF"
                                    ? "CPF"
                                    : "CNPJ"}
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um estado" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {states.map((state) => (
                                    <SelectItem key={state.id} value={state.name}>
                                      {state.name}
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
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                disabled={!selectedStateId}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={selectedStateId ? "Selecione uma cidade" : "Selecione um estado primeiro"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.name}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="conta" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome de Usuário</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {!isEditMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormDescription>
                                  A senha deve conter pelo menos 8 caracteres, com 
                                  letras minúsculas, maiúsculas, números e caracteres especiais.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Atualizar" : "Criar"} Usuário
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}