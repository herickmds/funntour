import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Ship, Anchor, Calendar, MapPin, DollarSign, Sun } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto py-4 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ship className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Funn Tour</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-sm font-medium hover:text-primary">Home</a>
            <a href="#boats" className="text-sm font-medium hover:text-primary">Embarcações</a>
            <a href="#destinations" className="text-sm font-medium hover:text-primary">Destinos</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary">Preços</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary">Contato</a>
          </nav>
          <Link href="/auth">
            <Button className="bg-primary hover:bg-primary/90">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-r from-blue-600 to-primary py-20 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Navegue em Estilo nas Melhores Embarcações</h1>
              <p className="text-lg mb-8 text-blue-100">Alugue lanchas, veleiros e iates para uma experiência inesquecível. Explore águas cristalinas com conforto e elegância.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-white text-primary hover:bg-blue-50" size="lg">
                  Ver Embarcações
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10" size="lg">
                  Saiba Mais
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="attached_assets/funn-tour-1.webp" 
                alt="Yacht on water" 
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher a Funn Tour?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Ship className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Frota Premium</h3>
              <p className="text-gray-600">Embarcações de luxo mantidas com os mais altos padrões de qualidade e segurança.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Destinos Incríveis</h3>
              <p className="text-gray-600">Acesso aos mais belos destinos litorâneos e ilhas paradisíacas do Brasil.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Preços Competitivos</h3>
              <p className="text-gray-600">Opções para todos os orçamentos com a melhor relação custo-benefício do mercado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Boats */}
      <section id="boats" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Embarcações Populares</h2>
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
              Ver Todas <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Boat Card 1 */}
            <div className="rounded-lg overflow-hidden bg-white shadow-md">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute top-3 left-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Popular
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold">Azimut 55</h3>
                  <p className="text-primary font-bold">R$ 5.000 <span className="text-sm font-normal text-gray-500">/dia</span></p>
                </div>
                <div className="flex items-center text-gray-600 mb-4">
                  <Ship className="h-4 w-4 mr-1" />
                  <span className="text-sm mr-3">Iate</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">12 pessoas</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">Luxuoso iate com 3 suítes, área gourmet, solário e sistema de som premium para uma experiência única.</p>
                <Button className="w-full">Reservar Agora</Button>
              </div>
            </div>
            
            {/* Boat Card 2 */}
            <div className="rounded-lg overflow-hidden bg-white shadow-md">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Promoção
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold">Boston Whaler 320</h3>
                  <p className="text-primary font-bold">R$ 3.200 <span className="text-sm font-normal text-gray-500">/dia</span></p>
                </div>
                <div className="flex items-center text-gray-600 mb-4">
                  <Ship className="h-4 w-4 mr-1" />
                  <span className="text-sm mr-3">Lancha</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">8 pessoas</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">Lancha esportiva ideal para passeios rápidos, pesca e diversão. Equipada com todo conforto necessário.</p>
                <Button className="w-full">Reservar Agora</Button>
              </div>
            </div>
            
            {/* Boat Card 3 */}
            <div className="rounded-lg overflow-hidden bg-white shadow-md">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Novo
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold">Beneteau Oceanis 45</h3>
                  <p className="text-primary font-bold">R$ 4.200 <span className="text-sm font-normal text-gray-500">/dia</span></p>
                </div>
                <div className="flex items-center text-gray-600 mb-4">
                  <Anchor className="h-4 w-4 mr-1" />
                  <span className="text-sm mr-3">Veleiro</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">10 pessoas</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">Veleiro moderno com 3 cabines, cozinha completa e deck espaçoso. Perfeito para passeios mais longos.</p>
                <Button className="w-full">Reservar Agora</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Destinos Populares</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative h-64 rounded-lg overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-white text-xl font-bold mb-1">Ilha Grande</h3>
                <p className="text-white/90 text-sm">Angra dos Reis, RJ</p>
              </div>
              <div className="bg-gray-200 h-full w-full transition-transform duration-500 group-hover:scale-110"></div>
            </div>
            
            <div className="group relative h-64 rounded-lg overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-white text-xl font-bold mb-1">Arraial do Cabo</h3>
                <p className="text-white/90 text-sm">Região dos Lagos, RJ</p>
              </div>
              <div className="bg-gray-200 h-full w-full transition-transform duration-500 group-hover:scale-110"></div>
            </div>
            
            <div className="group relative h-64 rounded-lg overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-white text-xl font-bold mb-1">Fernando de Noronha</h3>
                <p className="text-white/90 text-sm">Pernambuco</p>
              </div>
              <div className="bg-gray-200 h-full w-full transition-transform duration-500 group-hover:scale-110"></div>
            </div>
            
            <div className="group relative h-64 rounded-lg overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-white text-xl font-bold mb-1">Baía de Paraty</h3>
                <p className="text-white/90 text-sm">Costa Verde, RJ</p>
              </div>
              <div className="bg-gray-200 h-full w-full transition-transform duration-500 group-hover:scale-110"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gradient-to-r from-blue-600 to-primary text-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Planos e Preços</h2>
          <p className="text-blue-100 text-center max-w-2xl mx-auto mb-12">Escolha a opção que melhor se adapta às suas necessidades, desde passeios por hora até pacotes de dias completos.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Pricing */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-transform hover:-translate-y-2">
              <div className="p-8 text-center">
                <h3 className="text-primary text-2xl font-bold mb-4">Passeio Básico</h3>
                <div className="text-gray-900 font-bold">
                  <span className="text-4xl">R$ 500</span>
                  <span className="text-lg text-gray-600">/hora</span>
                </div>
                <p className="text-gray-600 mt-4 mb-6">Ideal para passeios curtos e celebrações rápidas.</p>
                <ul className="space-y-3 text-left text-gray-600 mb-8">
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Embarcações de até 30 pés
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Capacidade para até 8 pessoas
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Tripulação básica incluída
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Bebidas não alcoólicas inclusas
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90">Reservar</Button>
              </div>
            </div>
            
            {/* Standard Pricing */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-transform hover:-translate-y-2 relative">
              <div className="absolute top-0 inset-x-0 flex justify-center">
                <div className="bg-primary text-white text-sm font-semibold py-1 px-4 rounded-b-lg">
                  Mais Popular
                </div>
              </div>
              <div className="p-8 text-center">
                <h3 className="text-primary text-2xl font-bold mb-4">Passeio Premium</h3>
                <div className="text-gray-900 font-bold">
                  <span className="text-4xl">R$ 3.000</span>
                  <span className="text-lg text-gray-600">/dia</span>
                </div>
                <p className="text-gray-600 mt-4 mb-6">Perfeito para passeios completos com todo conforto.</p>
                <ul className="space-y-3 text-left text-gray-600 mb-8">
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Embarcações de 30 a 50 pés
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Capacidade para até 12 pessoas
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Tripulação completa
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Refeições e bebidas inclusas
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Equipamentos para atividades aquáticas
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90">Reservar</Button>
              </div>
            </div>
            
            {/* Luxury Pricing */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-transform hover:-translate-y-2">
              <div className="p-8 text-center">
                <h3 className="text-primary text-2xl font-bold mb-4">Experiência Luxo</h3>
                <div className="text-gray-900 font-bold">
                  <span className="text-4xl">R$ 8.000</span>
                  <span className="text-lg text-gray-600">/dia</span>
                </div>
                <p className="text-gray-600 mt-4 mb-6">A experiência mais exclusiva e sofisticada.</p>
                <ul className="space-y-3 text-left text-gray-600 mb-8">
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Embarcações de luxo acima de 50 pés
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Capacidade para até 20 pessoas
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Tripulação VIP e serviço personalizado
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Gastronomia gourmet e bar completo
                  </li>
                  <li className="flex items-center">
                    <Sun className="h-5 w-5 text-green-500 mr-2" />
                    Atividades exclusivas e personalizadas
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90">Reservar</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para navegar?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">Entre em contato conosco para saber mais sobre nossas embarcações e planos disponíveis. Estamos prontos para tornar sua experiência náutica inesquecível!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-primary hover:bg-primary/90" size="lg">
              Fale Conosco
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" size="lg">
              (21) 9876-5432
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ship className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Funn Tour</h3>
              </div>
              <p className="text-gray-400 mb-4">Oferecendo as melhores experiências náuticas desde 2015.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Embarcações</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Lanchas</a></li>
                <li><a href="#" className="hover:text-white">Veleiros</a></li>
                <li><a href="#" className="hover:text-white">Iates</a></li>
                <li><a href="#" className="hover:text-white">Catamarãs</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Destinos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Ilha Grande</a></li>
                <li><a href="#" className="hover:text-white">Arraial do Cabo</a></li>
                <li><a href="#" className="hover:text-white">Fernando de Noronha</a></li>
                <li><a href="#" className="hover:text-white">Paraty</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-gray-400">
                <li>contato@funntour.com</li>
                <li>(21) 9876-5432</li>
                <li>Av. das Américas, 3434</li>
                <li>Rio de Janeiro, RJ</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 Funn Tour. Todos os direitos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white">Termos de Uso</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">Política de Privacidade</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">FAQs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}