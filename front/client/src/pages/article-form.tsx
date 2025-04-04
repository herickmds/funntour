import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { Article, articleFormSchema, ArticleFormValues } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileInput } from "@/components/ui/file-input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash, Calendar } from "lucide-react";
import AdminLayout from "@/layouts/admin-layout";

export default function ArticleForm() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const isEditing = params.id !== undefined;
  const articleId = isEditing ? parseInt(params.id) : undefined;

  // Consulta de artigo existente quando em modo de edição
  const { data: article, isLoading: isLoadingArticle } = useQuery<Article>({
    queryKey: [`/api/articles/${articleId}`],
    queryFn: async () => {
      if (!articleId) return null;
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) throw new Error("Erro ao carregar artigo");
      return res.json();
    },
    enabled: !!articleId
  });

  // Configuração do formulário
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      path: "",
      description: "",
      author: "",
      paragraphs: [],
      tags: [],
      caption: null,
      publicationDate: null,
      enabled: true,
      isDraft: false
    }
  });

  // Gerenciar parágrafos manualmente
  const paragraphValues = form.watch('paragraphs') || [];
  
  const appendParagraph = () => {
    const currentParagraphs = form.getValues('paragraphs') || [];
    form.setValue('paragraphs', [...currentParagraphs, '']);
  };
  
  const removeParagraph = (index: number) => {
    const currentParagraphs = form.getValues('paragraphs') || [];
    form.setValue('paragraphs', currentParagraphs.filter((_, i) => i !== index));
  };

  // Mutation para criar novo artigo
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/articles", data, {
        isFormData: true
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Artigo criado",
        description: "O artigo foi criado com sucesso.",
      });
      navigate("/articles");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o artigo.",
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar artigo existente
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
      const res = await apiRequest("PATCH", `/api/articles/${id}`, data, {
        isFormData: true
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
      toast({
        title: "Artigo atualizado",
        description: "O artigo foi atualizado com sucesso.",
      });
      navigate("/articles");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar o artigo.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        path: article.path,
        description: article.description,
        author: article.author,
        paragraphs: Array.isArray(article.paragraphs) ? article.paragraphs : [],
        tags: Array.isArray(article.tags) ? article.tags : [],
        caption: article.caption,
        publicationDate: article.publicationDate,
        enabled: article.enabled,
        isDraft: article.isDraft
      });
    }
  }, [article, form]);

  const onSubmit = async (values: ArticleFormValues) => {
    const formData = new FormData();

    // Adicionar campos de texto
    formData.append("title", values.title);
    formData.append("path", values.path);
    formData.append("description", values.description);
    formData.append("author", values.author);
    
    // Converter arrays e objetos para JSON
    formData.append("paragraphs", JSON.stringify(values.paragraphs));
    formData.append("tags", JSON.stringify(values.tags));
    
    // Adicionar campos opcionais
    if (values.caption) formData.append("caption", values.caption);
    if (values.publicationDate) formData.append("publicationDate", values.publicationDate);
    
    // Adicionar campos boolean
    formData.append("enabled", (values.enabled ?? false).toString());
    formData.append("isDraft", (values.isDraft ?? false).toString());
    
    // Adicionar imagem se houver uma nova
    if (selectedImage && isImageChanged) {
      formData.append("image", selectedImage);
    }

    if (isEditing && articleId) {
      updateMutation.mutate({ id: articleId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImageChange = (files: File[]) => {
    if (files.length > 0) {
      setSelectedImage(files[0]);
      setIsImageChanged(true);
    } else {
      setSelectedImage(null);
    }
  };

  const handleAddParagraph = () => {
    appendParagraph();
  };

  const handleRemoveParagraph = (index: number) => {
    removeParagraph(index);
  };

  if (isEditing && isLoadingArticle) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar Artigo" : "Novo Artigo"}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Título */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o título do artigo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* URL (Path) */}
                  <FormField
                    control={form.control}
                    name="path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL (Path)</FormLabel>
                        <FormControl>
                          <Input placeholder="caminho-do-artigo" {...field} />
                        </FormControl>
                        <FormDescription>
                          O caminho que será usado na URL (sem espaços ou caracteres especiais)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite uma breve descrição do artigo" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Autor */}
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do autor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Publicação */}
                  <FormField
                    control={form.control}
                    name="publicationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de publicação</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              field.onChange(today);
                            }}
                            title="Usar data atual"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Imagem */}
                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel>Imagem de capa</FormLabel>
                      <FormControl>
                        <FileInput
                          onChange={handleImageChange}
                          accept="image/*"
                          multiple={false}
                          preview={true}
                          value={selectedImage ? [selectedImage] : undefined}
                          description="Recomendado: 1200x630px"
                        />
                      </FormControl>
                      {article?.image && !isImageChanged && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-2">Imagem atual:</p>
                          <img 
                            src={article.image} 
                            alt={article.title} 
                            className="w-40 h-auto rounded-md border border-gray-200" 
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Legenda da imagem */}
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legenda da imagem</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Legenda opcional para a imagem" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Parágrafos */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-base">Conteúdo do artigo</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddParagraph}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar parágrafo
                    </Button>
                  </div>
                  
                  {paragraphValues && paragraphValues.map((paragraph, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`paragraphs.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Textarea 
                                placeholder={`Parágrafo ${index + 1}`}
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParagraph(index)}
                        className="mt-1"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  
                  {(!paragraphValues || paragraphValues.length === 0) && (
                    <p className="text-sm text-gray-500 italic">
                      Nenhum parágrafo adicionado. Clique em "Adicionar parágrafo" para começar.
                    </p>
                  )}
                </div>

                {/* Opções de publicação */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Opções de publicação</h3>
                  
                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Ativo
                            </FormLabel>
                            <FormDescription>
                              Artigo será visível no site
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isDraft"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Rascunho
                            </FormLabel>
                            <FormDescription>
                              Artigo não ficará visível
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => navigate("/articles")}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {!createMutation.isPending && !updateMutation.isPending && (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditing ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}