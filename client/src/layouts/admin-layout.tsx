import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Bell,
  ChevronDown,
  Menu,
  Home,
  Ship,
  Map,
  DollarSign,
  Anchor,
  Calendar,
  BarChart,
  Users,
  Settings,
  Search,
  LogOut,
  FileText,
  Globe,
  MapPin,
  Building,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface AdminLayoutProps {
  children: ReactNode;
}

interface SidebarItem {
  title: string;
  icon: ReactNode;
  href: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      title: "Embarcações",
      icon: <Ship className="h-5 w-5" />,
      href: "/boats",
    },
    {
      title: "Tipos de Embarcação",
      icon: <Ship className="h-5 w-5" />,
      href: "/boat-types",
    },
    {
      title: "Roteiros",
      icon: <Map className="h-5 w-5" />,
      href: "/itineraries",
    },
    {
      title: "Preços Parceiro",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/partner-prices",
    },
    {
      title: "Marinas",
      icon: <Anchor className="h-5 w-5" />,
      href: "/marinas",
    },
    {
      title: "Reservas",
      icon: <Calendar className="h-5 w-5" />,
      href: "/bookings",
    },
    {
      title: "Artigos",
      icon: <FileText className="h-5 w-5" />,
      href: "/articles",
    },
    {
      title: "Páginas",
      icon: <FileText className="h-5 w-5" />,
      href: "/pages",
    },
    {
      title: "SEO Páginas",
      icon: <Share2 className="h-5 w-5" />,
      href: "/page-seo",
    },
    {
      title: "Países",
      icon: <Globe className="h-5 w-5" />,
      href: "/countries",
    },
    { title: "Estados", icon: <MapPin className="h-5 w-5" />, href: "/states" },
    {
      title: "Cidades",
      icon: <Building className="h-5 w-5" />,
      href: "/cities",
    },
    { title: "Usuários", icon: <Users className="h-5 w-5" />, href: "/users" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === path;
    return location.startsWith(path);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5 text-gray-500" />
            </Button>
            <h1 className="text-xl font-bold text-primary">Funn Tour Admin</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt={user?.username || "Avatar"}
                    />
                    <AvatarFallback>
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.username || "Administrador"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "admin@funntour.com"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white shadow-md flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-64" : "w-0 md:w-16",
          )}
        >
          <nav className="py-4">
            {/* Campo de busca removido para melhorar a experiência do usuário */}

            <ul className="space-y-1">
              {sidebarItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 focus:outline-none",
                      isActive(item.href) &&
                        "bg-blue-50 border-l-4 border-primary",
                      !sidebarOpen && "justify-center",
                    )}
                  >
                    <span
                      className={cn(
                        "text-gray-600",
                        isActive(item.href) && "text-primary",
                      )}
                    >
                      {item.icon}
                    </span>
                    {sidebarOpen && (
                      <span
                        className={cn(
                          "ml-3 font-medium",
                          isActive(item.href) && "text-primary",
                        )}
                      >
                        {item.title}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
