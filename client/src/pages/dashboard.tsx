import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boat, Route, BoatRoute } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { 
  Ship, 
  Route as RouteIcon, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Users
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("6months");

  const { data: boats = [] } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  // Mock data for charts and statistics
  // In a real application, this would come from API endpoints
  const bookingsData = [
    { month: "Jan", count: 42 },
    { month: "Fev", count: 63 },
    { month: "Mar", count: 47 },
    { month: "Abr", count: 84 },
    { month: "Mai", count: 68 },
    { month: "Jun", count: 95 },
  ];

  const boatTypeData = [
    { name: "Yacht", value: 38 },
    { name: "Lancha", value: 27 },
    { name: "Catamarã", value: 15 },
    { name: "Veleiro", value: 12 },
    { name: "Jet ski", value: 8 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#0F52BA'];

  const popularBoats = [
    {
      name: "Yacht Eclipse",
      image: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=100&q=80",
      bookings: 42,
      occupancy: 92
    },
    {
      name: "Catamarã Oceanic",
      image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=100&q=80",
      bookings: 38,
      occupancy: 85
    },
    {
      name: "Lancha Speedster",
      image: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=100&q=80",
      bookings: 31,
      occupancy: 78
    },
    {
      name: "Veleiro Freedom",
      image: "https://images.unsplash.com/photo-1575986711002-b1e7452c8b17?auto=format&fit=crop&w=100&q=80",
      bookings: 27,
      occupancy: 65
    }
  ];

  const stats = [
    {
      title: "Embarcações",
      value: boats.length,
      icon: <Ship className="h-5 w-5 text-primary" />,
      change: 12,
      period: "desde o último mês",
    },
    {
      title: "Roteiros",
      value: routes.length,
      icon: <RouteIcon className="h-5 w-5 text-blue-500" />,
      change: 5,
      period: "desde o último mês",
    },
    {
      title: "Reservas",
      value: 128,
      icon: <Calendar className="h-5 w-5 text-rose-500" />,
      change: 18,
      period: "desde o último mês",
    },
    {
      title: "Receita",
      value: 86400,
      isMonetary: true,
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      change: 24,
      period: "desde o último mês",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500">Visão geral do sistema</p>
        </div>
      </div>

      {/* Primeira linha: Embarcações e Roteiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.slice(0, 2).map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {stat.isMonetary ? formatCurrency(stat.value) : stat.value}
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}%
                </span>
                <span className="text-gray-500 ml-2">{stat.period}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segunda linha: Reservas e Receita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.slice(2, 4).map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {stat.isMonetary ? formatCurrency(stat.value) : stat.value}
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}%
                </span>
                <span className="text-gray-500 ml-2">{stat.period}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Reservas por Mês</CardTitle>
              <Select 
                defaultValue={timeRange} 
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="12months">Últimos 12 meses</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} reservas`, 'Reservas']} 
                    labelStyle={{ color: '#111' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="count" fill="#0F52BA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Embarcações Populares</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4 mt-4">
              {popularBoats.map((boat, index) => (
                <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <img 
                    src={boat.image} 
                    alt={boat.name} 
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-800">{boat.name}</h4>
                    <p className="text-xs text-gray-500">{boat.bookings} reservas</p>
                  </div>
                  <span className={`font-medium ${boat.occupancy >= 80 ? 'text-green-500' : boat.occupancy >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {boat.occupancy}%
                  </span>
                </div>
              ))}
            </div>

            <button className="mt-4 text-primary text-sm font-medium hover:underline w-full text-center">
              Ver todas
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Tipos de Embarcações</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={boatTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {boatTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} embarcações`, name]} 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Estatísticas de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Novos usuários</p>
                    <h4 className="text-2xl font-bold text-gray-800">42</h4>
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-green-500 text-sm flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    12%
                  </span>
                  <span className="text-gray-500 text-xs ml-2">desde o último mês</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Reservas por Usuário</p>
                    <h4 className="text-2xl font-bold text-gray-800">3.2</h4>
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-green-500 text-sm flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    8%
                  </span>
                  <span className="text-gray-500 text-xs ml-2">desde o último mês</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Valor Médio</p>
                    <h4 className="text-2xl font-bold text-gray-800">R$ 675</h4>
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-green-500 text-sm flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    5%
                  </span>
                  <span className="text-gray-500 text-xs ml-2">desde o último mês</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Taxa de Retenção</p>
                    <h4 className="text-2xl font-bold text-gray-800">78%</h4>
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <span className="text-green-500 text-sm flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    3%
                  </span>
                  <span className="text-gray-500 text-xs ml-2">desde o último mês</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
