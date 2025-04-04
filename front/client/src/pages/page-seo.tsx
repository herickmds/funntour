import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileInput } from "@/components/ui/file-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Save, Plus, Trash } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Page } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";

// Schema para o SEO
const seoSchema = z.object({
  pageId: z.coerce.number().min(1, "Selecione uma página"),
  title: z.string().min(1, "Título é obrigatório").nullable(),
  description: z.string().nullable().optional(),
  canonical: z.string().nullable().optional(),
  og: z.object({
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    type: z.string().default("website"),
    url: z.string().nullable().optional(),
    site_name: z.string().default("Funn Tour"),
    locale: z.string().default("pt_BR"),
    image: z.object({
      url: z.string().nullable().optional(),
      secure_url: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
      width: z.string().nullable().optional(),
      height: z.string().nullable().optional(),
      alt: z.string().nullable().optional(),
    }).nullable().optional(),
    published_time: z.string().nullable().optional(),
    updated_time: z.string().nullable().optional(),
  }).nullable().optional(),
  twitter: z.object({
    card: z.string().default("summary_large_image"),
    site: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    label1: z.string().nullable().optional(),
    data1: z.string().nullable().optional(),
  }).nullable().optional(),
  article: z.object({
    publisher: z.array(z.string()).nullable().optional(),
  }).nullable().optional(),
  robots: z.string().nullable().optional(),
  schema: z.string().nullable().optional(),
});

type SEOFormValues = z.infer<typeof seoSchema>;

export default function PageSEO() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isPageTypeArticle, setIsPageTypeArticle] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Buscar páginas existentes
  const { data: pages = [], isLoading: isLoadingPages } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
    enabled: true
  });
  
  // Formulário para edição SEO
  const form = useForm<SEOFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      pageId: undefined,
      title: null,
      description: null,
      canonical: null,
      og: {
        title: null,
        description: null,
        type: "website",
        url: null,
        site_name: "Funn Tour",
        locale: "pt_BR",
        image: null,
        published_time: null,
        updated_time: null,
      },
      twitter: {
        card: "summary_large_image",
        site: null,
        title: null,
        description: null,
        image: null,
        label1: null,
        data1: null,
      },
      article: {
        publisher: [],
      },
      robots: null,
      schema: null,
    }
  });
  
  // Efeito para verificar se a página selecionada é um artigo
  useEffect(() => {
    const pageId = form.watch("pageId");
    if (pageId) {
      const page = pages.find(p => p.id === pageId);
      // Verificar se a página é um artigo pela URL ou título
      const isArticle = page?.slug?.includes("artigo") || 
                        page?.slug?.includes("blog") || 
                        page?.title?.toLowerCase().includes("artigo") ||
                        page?.title?.toLowerCase().includes("blog");
      
      setIsPageTypeArticle(!!isArticle);
    } else {
      setIsPageTypeArticle(false);
    }
  }, [form.watch("pageId"), pages]);
  
  // Consulta para buscar dados SEO existentes quando a página for selecionada
  const { data: existingSEO, isLoading: isLoadingSEO } = useQuery({
    queryKey: ["/api/pages", form.watch("pageId"), "seo"],
    queryFn: async () => {
      const pageId = form.watch("pageId");
      if (!pageId) return null;
      
      try {
        const res = await apiRequest("GET", `/api/pages/${pageId}/seo`);
        
        if (!res.ok) {
          if (res.status === 404) {
            return null; // SEO não existe para esta página
          }
          throw new Error("Erro ao carregar dados SEO");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar SEO:", error);
        return null;
      }
    },
    enabled: !!form.watch("pageId")
  });
  
  // Efeito para preencher o formulário com dados existentes
  useEffect(() => {
    if (existingSEO && !isLoadingSEO) {
      // Preencher o formulário com os dados existentes
      form.reset(existingSEO);
      
      // Se tiver imagem, mostrar preview
      if (existingSEO.og?.image?.url) {
        setImagePreview(existingSEO.og.image.url);
      }
    }
  }, [existingSEO, isLoadingSEO, form]);
  
  // Mutação para salvar configurações SEO
  const saveSEOMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const pageId = form.getValues("pageId");
      const res = await apiRequest("POST", `/api/pages/${pageId}/seo`, undefined, {
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Erro ao salvar configurações SEO");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações SEO salvas",
        description: "As configurações SEO foram salvas com sucesso.",
      });
      
      // Invalidar a consulta para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/pages", form.getValues("pageId"), "seo"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    }
  });
  
  // Lidar com mudança de página
  const handlePageChange = (value: string) => {
    form.setValue("pageId", parseInt(value));
    
    // Reset do formulário para novos valores
    if (existingSEO) {
      form.reset(existingSEO);
    } else {
      form.reset({
        pageId: parseInt(value),
        title: null,
        description: null,
        canonical: null,
        og: {
          title: null,
          description: null,
          type: "website",
          url: null,
          site_name: "Funn Tour",
          locale: "pt_BR",
          image: null,
          published_time: null,
          updated_time: null,
        },
        twitter: {
          card: "summary_large_image",
          site: null,
          title: null,
          description: null,
          image: null,
          label1: null,
          data1: null,
        },
        article: {
          publisher: [],
        },
        robots: null,
        schema: null,
      });
    }
    
    // Reset da imagem
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  // Lidar com upload de imagem
  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedImage(file);
      
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Enviar formulário
  const onSubmit = (values: SEOFormValues) => {
    const formData = new FormData();
    
    // Converter valores do formulário para JSON e adicioná-los
    formData.append("seoData", JSON.stringify(values));
    
    // Adicionar imagem se houver
    if (selectedImage) {
      formData.append("image", selectedImage);
      formData.append("image_width", values.og?.image?.width || "");
      formData.append("image_height", values.og?.image?.height || "");
      formData.append("image_alt", values.og?.image?.alt || "");
    }
    
    // Enviar
    saveSEOMutation.mutate(formData);
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Configurações SEO de Páginas</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecione a Página</CardTitle>
              <CardDescription>
                Escolha a página que deseja configurar o SEO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="pageId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Página</FormLabel>
                    <Select
                      disabled={isLoadingPages}
                      value={field.value ? field.value.toString() : ''}
                      onValueChange={handlePageChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma página" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pages.map((page) => (
                          <SelectItem key={page.id} value={page.id.toString()}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {form.watch("pageId") ? (
            <Card>
              <CardHeader>
                <CardTitle>Configurações SEO</CardTitle>
                <CardDescription>Configure os metadados SEO para esta página</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
                    <TabsTrigger value="twitter">Twitter</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                    {isPageTypeArticle && (
                      <TabsTrigger value="article">Artigo</TabsTrigger>
                    )}
                  </TabsList>
                  
                  {/* Aba Geral */}
                  <TabsContent value="general" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título SEO</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Título para SEO" />
                          </FormControl>
                          <FormDescription>
                            Título que aparecerá nos resultados de busca
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição SEO</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Descrição para SEO" 
                            />
                          </FormControl>
                          <FormDescription>
                            Breve descrição para resultados de busca (recomendado: 150-160 caracteres)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="canonical"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Canônica</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="https://funntour.com/pagina-canonica" 
                            />
                          </FormControl>
                          <FormDescription>
                            URL canônica para evitar conteúdo duplicado
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="robots"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuração Robots</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''}
                              placeholder="follow, index, max-snippet:-1" 
                            />
                          </FormControl>
                          <FormDescription>
                            Controla como os motores de busca indexam a página
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  {/* Outras abas omitidas para brevidade */}
                  
                  {/* Aba OpenGraph */}
                  <TabsContent value="opengraph" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="og.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título Open Graph</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Título para compartilhamento" 
                            />
                          </FormControl>
                          <FormDescription>
                            Título usado ao compartilhar em redes sociais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="og.description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Open Graph</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Descrição para compartilhamento" 
                            />
                          </FormControl>
                          <FormDescription>
                            Descrição usada ao compartilhar em redes sociais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="og.url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Open Graph</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="https://funntour.com/pagina" 
                            />
                          </FormControl>
                          <FormDescription>
                            URL da página para compartilhamento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="og.published_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Publicação</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="datetime-local"
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="og.updated_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Atualização</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="datetime-local"
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="og.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select
                              value={field.value || 'website'}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="article">Artigo</SelectItem>
                                <SelectItem value="product">Produto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="og.locale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localidade</FormLabel>
                            <Select
                              value={field.value || 'pt_BR'}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a localidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                                <SelectItem value="en_US">Inglês (EUA)</SelectItem>
                                <SelectItem value="es_ES">Espanhol</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                      
                    <FormField
                      control={form.control}
                      name="og.site_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Site</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || 'Funn Tour'} 
                              placeholder="Funn Tour" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label>Imagem Open Graph</Label>
                      <FileInput
                        onChange={handleImageUpload}
                        accept="image/*"
                        placeholder="Selecione uma imagem para compartilhamento"
                        preview={imagePreview ? true : false}
                        value={selectedImage ? [selectedImage] : []}
                      />
                      <p className="text-sm text-muted-foreground">
                        Imagem usada ao compartilhar em redes sociais (recomendado: 1200x630px)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="og.image.alt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Texto alternativo</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="Descrição da imagem" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="og.image.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Largura</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="1024" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="og.image.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Altura</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="1024" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Aba Twitter */}
                  <TabsContent value="twitter" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="twitter.card"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Card</FormLabel>
                          <Select
                            value={field.value || 'summary_large_image'}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de card" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="summary">Summary</SelectItem>
                              <SelectItem value="summary_large_image">Large Image</SelectItem>
                              <SelectItem value="app">App</SelectItem>
                              <SelectItem value="player">Player</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Estilo de visualização do card no Twitter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="twitter.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título Twitter</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Título para o Twitter" 
                            />
                          </FormControl>
                          <FormDescription>
                            Título usado nos cards do Twitter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="twitter.description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Twitter</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Descrição para o Twitter" 
                            />
                          </FormControl>
                          <FormDescription>
                            Descrição usada nos cards do Twitter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="twitter.image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Imagem Twitter</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="https://funntour.com/image.webp" 
                            />
                          </FormControl>
                          <FormDescription>
                            URL da imagem a ser usada nos cards do Twitter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="twitter.label1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label 1</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="Preço" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="twitter.data1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dados 1</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value || ''} 
                                placeholder="R$ 1.500" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Aba Avançado */}
                  <TabsContent value="advanced" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="schema"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schema.org JSON-LD</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ''} 
                              placeholder='{"@context":"https://schema.org","@type":"WebPage",...}' 
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription>
                            Dados estruturados no formato JSON-LD
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  {/* Aba Artigo */}
                  <TabsContent value="article" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="og.published_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Publicação</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="datetime-local"
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="og.updated_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Atualização</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="datetime-local"
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Publishers (URLs)</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const currentPublishers = form.getValues("article.publisher") || [];
                            form.setValue("article.publisher", [...currentPublishers, ""], {
                              shouldValidate: true,
                            });
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Adicionar URL
                        </Button>
                      </div>
                      
                      {form.watch("article.publisher")?.map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`article.publisher.${index}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="https://publisher.com"
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const currentPublishers = form.getValues("article.publisher") || [];
                              form.setValue(
                                "article.publisher",
                                currentPublishers.filter((_, i) => i !== index),
                                { shouldValidate: true }
                              );
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {(!form.watch("article.publisher") || form.watch("article.publisher").length === 0) && (
                        <div className="text-sm text-muted-foreground italic">
                          Nenhum publisher adicionado. Clique em "Adicionar URL" para incluir.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            !isLoadingPages && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Selecione uma página</AlertTitle>
                <AlertDescription>
                  Para configurar o SEO, primeiro selecione uma página no campo acima.
                </AlertDescription>
              </Alert>
            )
          )}
          
          {/* Botão de salvar no final da página */}
          {form.watch("pageId") && (
            <div className="flex justify-end mt-6">
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={saveSEOMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveSEOMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}