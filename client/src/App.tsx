import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Lifestyle from "@/pages/lifestyle";
import Property from "@/pages/property";
import AuthPage from "@/pages/auth";
import ProfilePage from "@/pages/profile";
import { ProtectedRoute } from "@/lib/protected-route";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import AdminDashboard from "@/pages/admin/dashboard";
import Messages from "@/pages/messages";
import AddProperty from "@/pages/add-property";
import { ProtectedLandlordRoute } from "@/lib/protected-landlord-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/search" component={Search} />
      <ProtectedRoute path="/lifestyle" component={Lifestyle} />
      <ProtectedRoute path="/property/:id" component={Property} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedLandlordRoute path="/properties/add" component={AddProperty} />
      <ProtectedAdminRoute path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />
        <main>
          <Router />
        </main>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;