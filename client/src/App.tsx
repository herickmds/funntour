import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AdminLayout from "./layouts/admin-layout";
import Dashboard from "./pages/dashboard";
import AuthPage from "./pages/auth-page";
import RecoverPassword from "./pages/recover-password";
import BoatList from "./pages/boat-list";
import BoatForm from "./pages/boat-form";
import UserList from "./pages/user-list";
import UserForm from "./pages/user-form";
import BoatTypeList from "./pages/boat-type-list";
import RouteList from "./pages/route-list";
import PricingPage from "./pages/pricing-page";
import MarinaList from "./pages/marina-list";
import BookingList from "./pages/booking-list";
import ArticleList from "./pages/article-list";
import ArticleForm from "./pages/article-form";
import PageList from "./pages/page-list";
import PageForm from "./pages/page-form";
import PageSEO from "./pages/page-seo";
import ReportPage from "./pages/report-page";
import SettingsPage from "./pages/settings-page";
import CountryList from "./pages/country-list";
import StateList from "./pages/state-list";
import CityList from "./pages/city-list";
import ProfilePage from "./pages/profile-page";
import ItineraryList from "./pages/itinerary-list";
import PartnerPriceList from "./pages/partner-price-list";
import LandingPage from "./pages/landing-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/recover-password" component={RecoverPassword} />
      <ProtectedRoute path="/dashboard" component={() => 
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      } />
      <ProtectedRoute path="/boats" component={() => 
        <AdminLayout>
          <BoatList />
        </AdminLayout>
      } />
      <ProtectedRoute path="/boats/new" component={() => 
        <AdminLayout>
          <BoatForm />
        </AdminLayout>
      } />
      <ProtectedRoute path="/boats/:id" component={() => 
        <AdminLayout>
          <BoatForm />
        </AdminLayout>
      } />
      <ProtectedRoute path="/users" component={() => 
        <AdminLayout>
          <UserList />
        </AdminLayout>
      } />
      <ProtectedRoute path="/users/new" component={() => 
        <AdminLayout>
          <UserForm />
        </AdminLayout>
      } />
      <ProtectedRoute path="/users/:id" component={() => 
        <AdminLayout>
          <UserForm />
        </AdminLayout>
      } />
      <ProtectedRoute path="/boat-types" component={BoatTypeList} />
      <ProtectedRoute path="/routes" component={RouteList} />
      <ProtectedRoute path="/pricing" component={PricingPage} />
      <ProtectedRoute path="/marinas" component={MarinaList} />
      <ProtectedRoute path="/bookings" component={BookingList} />
      <ProtectedRoute path="/articles" component={ArticleList} />
      <ProtectedRoute path="/articles/new" component={ArticleForm} />
      <ProtectedRoute path="/articles/edit/:id" component={ArticleForm} />
      <ProtectedRoute path="/pages" component={PageList} />
      <ProtectedRoute path="/page-form" component={PageForm} />
      <ProtectedRoute path="/page-form/:id" component={PageForm} />
      <ProtectedRoute path="/page-seo" component={() => 
        <AdminLayout>
          <PageSEO />
        </AdminLayout>
      } />
      <ProtectedRoute path="/countries" component={() => 
        <AdminLayout>
          <CountryList />
        </AdminLayout>
      } />
      <ProtectedRoute path="/states" component={() => 
        <AdminLayout>
          <StateList />
        </AdminLayout>
      } />
      <ProtectedRoute path="/cities" component={() => 
        <AdminLayout>
          <CityList />
        </AdminLayout>
      } />
      <ProtectedRoute path="/reports" component={ReportPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile" component={() => 
        <AdminLayout>
          <ProfilePage />
        </AdminLayout>
      } />
      <ProtectedRoute path="/itineraries" component={() => 
        <AdminLayout>
          <ItineraryList />
        </AdminLayout>
      } />
      <ProtectedRoute path="/partner-prices" component={() => 
        <AdminLayout>
          <PartnerPriceList />
        </AdminLayout>
      } />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
