import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wishlist from "./pages/Wishlist";
import Logout from "./pages/Logout";
import AdminLogin from "./pages/admin/Login";
import AdminLogout from "./pages/admin/Logout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/logout" component={Logout} />
      
      {/* Protected Customer Routes */}
      <Route path="/checkout">
        {user ? <Checkout /> : <Redirect to="/login" />}
      </Route>
      <Route path="/order-confirmation">
        {user ? <OrderConfirmation /> : <Redirect to="/login" />}
      </Route>
      <Route path="/dashboard">
        {user ? <Dashboard /> : <Redirect to="/login" />}
      </Route>
      <Route path="/wishlist">
        {user ? <Wishlist /> : <Redirect to="/login" />}
      </Route>

      {/* Admin Routes */}
      <Route path="/rahasia/logout" component={AdminLogout} />
      
      {/* Admin Dashboard & Management - Protected by role check */}
      <Route path="/rahasia/dashboard">
        {isAdmin ? <AdminDashboard /> : <Redirect to="/rahasia" />}
      </Route>
      <Route path="/rahasia/products">
        {isAdmin ? <AdminProducts /> : <Redirect to="/rahasia" />}
      </Route>
      <Route path="/rahasia/orders">
        {isAdmin ? <AdminOrders /> : <Redirect to="/rahasia" />}
      </Route>
      <Route path="/rahasia/users">
        {isAdmin ? <AdminUsers /> : <Redirect to="/rahasia" />}
      </Route>
      <Route path="/rahasia/reports">
        {isAdmin ? <AdminReports /> : <Redirect to="/rahasia" />}
      </Route>
      <Route path="/rahasia/settings">
        {isAdmin ? <AdminSettings /> : <Redirect to="/rahasia" />}
      </Route>
      
      {/* Admin Auth / Root */}
      <Route path="/rahasia">
        {isAdmin ? <Redirect to="/rahasia/dashboard" /> : <AdminLogin />}
      </Route>

      {/* Admin Catch-all */}
      <Route path="/rahasia/:rest*">
        {isAdmin ? <NotFound /> : <Redirect to="/rahasia" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
