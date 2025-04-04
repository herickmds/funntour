import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AdminLayout from "@/layouts/admin-layout";

export default function ReportPage() {
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
          <CardDescription>
            Visualize relatórios e estatísticas de vendas e reservas
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