import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Page, pageFormSchema } from "@shared/schema";
import { z } from "zod";
import AdminLayout from "@/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileInput } from "@/components/ui/file-input";
import { PrefixedInput } from "@/components/ui/prefixed-input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save as SaveIcon } from "lucide-react";

type PageFormValues = z.infer<typeof pageFormSchema>;

export default function PageForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const isEditMode = Boolean(id);

  // Formulário
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      slug: "",
      canonicalUrl: "",
      metaTitle: "",
      metaDescription: "",
      status: "draft",
    },
  });

  // Buscar página específica quando estiver em modo de edição
  const { isLoading: isLoadingPage } = useQuery({
    queryKey: ["/api/pages", id],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar página");
      const pageData: Page = await res.json();
      
      // Atualizar o formulário com os dados carregados
      form.reset({
        title: pageData.title,
        description: pageData.description || "",
        content: pageData.content || "",
        slug: pageData.slug,
        canonicalUrl: pageData.canonicalUrl || "",
        metaTitle: pageData.metaTitle || "",
        metaDescription: pageData.metaDescription || "",
        status: pageData.status,
      });
      
      return pageData;
    },
    enabled: Boolean(id),
  });

  // Mutation para criar página
  const createPageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/pages", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Página criada com sucesso",
        description: "A página foi criada e está disponível no sistema.",
      });
      navigate("/pages");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar página",
        description: error.message,
      });
    },
  });

  // Mutation para atualizar página
  const updatePageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/pages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Página atualizada com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pages", id] });
      navigate("/pages");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar página",
        description: error.message,
      });
    },
  });

  // Enviar formulário
  const onSubmit = (values: PageFormValues) => {
    // Verificar se os campos obrigatórios estão preenchidos
    if (!values.title || !values.slug) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Os campos Título e URL da página são obrigatórios.",
      });
      return;
    }
    
    // Criar objeto básico com apenas os campos necessários
    const pageData = {
      title: values.title,
      slug: values.slug.toLowerCase().replace(/\s+/g, '-')
    };
    
    // Usar diretamente o objeto JSON em vez de FormData para simplicidade
    if (isEditMode) {
      updatePageMutation.mutate(new FormData());
    } else {
      // Chamar a API diretamente
      apiRequest("POST", "/api/pages", pageData)
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || "Erro ao criar página");
            });
          }
          return response.json();
        })
        .then(data => {
          toast({
            title: "Página criada com sucesso",
            description: "A página foi criada e está disponível no sistema.",
          });
          navigate("/pages");
        })
        .catch(error => {
          toast({
            variant: "destructive",
            title: "Erro ao criar página",
            description: error.message,
          });
        });
    }
  };

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/pages")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isEditMode ? "Editar Página" : "Nova Página"}
            </h1>
          </div>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={createPageMutation.isPending || updatePageMutation.isPending}
            className="flex items-center gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            Salvar
          </Button>
        </div>

        {isLoadingPage ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Página</CardTitle>
                  <CardDescription>Preencha os dados básicos da página</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="Título da página" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da página</FormLabel>
                          <FormControl>
                            <PrefixedInput 
                              prefix="https://funntour.com/" 
                              value={field.value || ''} 
                              onChange={field.onChange}
                              placeholder="caminho-da-pagina" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={createPageMutation.isPending || updatePageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <SaveIcon className="h-4 w-4" />
                    Salvar
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        )}
      </div>
    </AdminLayout>
  );
}