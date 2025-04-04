import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, userRoles } from "@shared/schema";
import { Edit, Trash2, Plus, Search, UserPlus, Users } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

export default function UserList() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const handleNavigateToNew = () => {
    navigate("/users/new");
  };

  const handleEditUser = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/users/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao excluir o usuário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Filter users based on selected role
  const filteredUsers = users.filter((user) => {
    if (selectedRole === "all") return true;
    return user.role === selectedRole;
  });

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-green-500 text-white">Admin</Badge>;
      case "cliente":
        return <Badge variant="secondary">Cliente</Badge>;
      case "parceiro":
        return <Badge variant="default">Parceiro</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const columns = [
    {
      header: "Usuário",
      accessorKey: "username" as keyof User,
      cell: (user: User) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-primary/10">
            {user.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt={user.username} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.username}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Nome Completo",
      accessorKey: "fullName" as keyof User,
    },
    {
      header: "Documento",
      accessorKey: "document" as keyof User,
      cell: (user: User) => (
        <div>
          <div className="text-sm text-gray-900">{user.document}</div>
          <div className="text-xs text-gray-500">{user.documentType}</div>
        </div>
      ),
    },
    {
      header: "Data de Cadastro",
      accessorKey: "createdAt" as keyof User,
      cell: (user: User) => (
        <div className="text-sm text-gray-900">
          {formatDate(user.createdAt)}
        </div>
      ),
    },
    {
      header: "Perfil",
      accessorKey: "role" as keyof User,
      cell: (user: User) => getUserRoleBadge(user.role),
    },
    {
      header: "Ações",
      accessorKey: "id" as keyof User,
      cell: (user: User) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEditUser(user);
            }}
          >
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserToDelete(user);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o usuário "{user.username}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDeleteUser(user.id)}
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
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <p className="text-gray-500">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={handleNavigateToNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todos os perfis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  {userRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === "admin" ? "Administrador" : 
                       role === "cliente" ? "Cliente" : 
                       role === "parceiro" ? "Parceiro" : role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DataTable
          data={filteredUsers}
          columns={columns}
          searchKey="username"
          onRowClick={handleEditUser}
        />
      </div>
    </div>
  );
}