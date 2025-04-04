import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AdminLayout from "@/layouts/admin-layout";

export default function SettingsPage() {
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>
            Gerencie as configurações do sistema e da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-muted-foreground">
            Esta funcionalidade será implementada em breve.
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}