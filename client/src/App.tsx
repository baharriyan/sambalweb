import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Logout = lazy(() => import("./pages/Logout"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin Lazy Pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminLogout = lazy(() => import("./pages/admin/Logout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);
PageLoader.displayName = "PageLoader";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  const isAdmin = user?.role === "admin";

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}
Router.displayName = "Router";

import ScrollHandler from "./components/ScrollHandler";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollHandler />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;


