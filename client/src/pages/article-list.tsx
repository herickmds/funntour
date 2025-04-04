import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Article } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { formatDate, truncateText } from "@/lib/utils";
import { Edit, FilePenLine, FileX, Trash, Trash2, Eye } from "lucide-react";
import AdminLayout from "@/layouts/admin-layout";

export default function ArticleList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<number | null>(null);

  // Buscar todos os artigos
  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("Erro ao carregar artigos");
      return res.json();
    }
  });

  // Mutation para alternar o status (enabled, isDraft, isDeleted)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number, field: 'enabled' | 'isDraft' | 'isDeleted', value: boolean }) => {
      const res = await apiRequest("PATCH", `/api/articles/${id}/status`, { field, value });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Status atualizado",
        description: "O status do artigo foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar o status do artigo.",
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir (move para lixeira)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Artigo movido para lixeira",
        description: "O artigo foi movido para a lixeira com sucesso.",
      });
      setConfirmDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao mover o artigo para a lixeira.",
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir permanentemente
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}?permanent=true`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Artigo excluído",
        description: "O artigo foi excluído permanentemente com sucesso.",
      });
      setConfirmPermanentDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir o artigo permanentemente.",
        variant: "destructive",
      });
    }
  });

  const handleCreateArticle = () => {
    navigate("/articles/new");
  };

  const handleEditArticle = (article: Article) => {
    navigate(`/articles/edit/${article.id}`);
  };

  const handleViewArticle = (article: Article) => {
    window.open(`/api/articles/public/${article.path}`, '_blank');
  };

  const handleDeleteArticle = (article: Article) => {
    setConfirmDeleteId(article.id);
  };

  const handlePermanentDeleteArticle = (article: Article) => {
    setConfirmPermanentDeleteId(article.id);
  };

  const toggleArticleStatus = (article: Article, field: 'enabled' | 'isDraft' | 'isDeleted') => {
    toggleStatusMutation.mutate({
      id: article.id,
      field,
      value: !article[field]
    });
  };

  const filteredArticles = articles.filter(article => {
    let matchesTab = true;
    
    if (selectedTab === "published") {
      matchesTab = article.enabled && !article.isDraft && !article.isDeleted;
    } else if (selectedTab === "drafts") {
      matchesTab = article.isDraft && !article.isDeleted;
    } else if (selectedTab === "disabled") {
      matchesTab = !article.enabled && !article.isDraft && !article.isDeleted;
    } else if (selectedTab === "trash") {
      matchesTab = article.isDeleted;
    }
    
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const renderStatusBadge = (article: Article) => {
    if (article.isDeleted) {
      return <Badge variant="destructive">Na lixeira</Badge>;
    } else if (article.isDraft) {
      return <Badge variant="outline">Rascunho</Badge>;
    } else if (article.enabled) {
      return <Badge className="bg-green-500">Publicado</Badge>;
    } else {
      return <Badge variant="secondary">Desativado</Badge>;
    }
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { 
      header: "Título", 
      accessorKey: "title",
      cell: (article: Article) => (
        <div className="font-medium">{truncateText(article.title, 30)}</div>
      )
    },
    { 
      header: "Descrição", 
      accessorKey: "description",
      cell: (article: Article) => truncateText(article.description, 50)
    },
    { 
      header: "Autor", 
      accessorKey: "author" 
    },
    { 
      header: "Data de Publicação", 
      accessorKey: "publicationDate",
      cell: (article: Article) => article.publicationDate ? formatDate(article.publicationDate) : "-"
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (article: Article) => renderStatusBadge(article)
    },
    { 
      header: "Ações", 
      accessorKey: "actions",
      cell: (article: Article) => (
        <div className="flex items-center gap-2">
          {!article.isDeleted && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleViewArticle(article)}
                title="Visualizar"
              >
                <Eye className="h-4 w-4 text-blue-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEditArticle(article)}
                title="Editar"
              >
                <Edit className="h-4 w-4 text-amber-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toggleArticleStatus(article, 'isDraft')}
                title={article.isDraft ? "Retirar do modo rascunho" : "Marcar como rascunho"}
              >
                <FilePenLine className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toggleArticleStatus(article, 'enabled')}
                title={article.enabled ? "Desativar" : "Ativar"}
              >
                <FileX className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeleteArticle(article)}
                title="Mover para lixeira"
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          {article.isDeleted && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toggleArticleStatus(article, 'isDeleted')}
                title="Restaurar da lixeira"
              >
                <Edit className="h-4 w-4 text-green-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handlePermanentDeleteArticle(article)}
                title="Excluir permanentemente"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Artigos</h1>
          <Button onClick={handleCreateArticle}>Novo Artigo</Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="published">Publicados</TabsTrigger>
                <TabsTrigger value="drafts">Rascunhos</TabsTrigger>
                <TabsTrigger value="disabled">Desativados</TabsTrigger>
                <TabsTrigger value="trash">Lixeira</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-64">
              <Input 
                type="text" 
                placeholder="Buscar artigos..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <DataTable 
            data={filteredArticles} 
            columns={columns} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      {/* Confirmação para mover para lixeira */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a mover este artigo para a lixeira. Você poderá restaurá-lo mais tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação para excluir permanentemente */}
      <AlertDialog open={confirmPermanentDeleteId !== null} onOpenChange={() => setConfirmPermanentDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir permanentemente este artigo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmPermanentDeleteId && permanentDeleteMutation.mutate(confirmPermanentDeleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}