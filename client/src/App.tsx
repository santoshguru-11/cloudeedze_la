import { Switch, Route, Redirect } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from './lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/navbar';
import Login from '@/pages/login';
import Landing from '@/pages/landing';
import Calculator from '@/pages/calculator';
import Results from '@/pages/results';
import { InventoryPage } from '@/pages/inventory';
import CloudCredentialsPage from '@/pages/cloud-credentials.tsx';
import TerraformUploadPage from '@/pages/terraform-upload';
import ExcelToIaC from '@/pages/excel-to-iac';
import AdminDashboard from '@/pages/admin-dashboard';
import UserReports from '@/pages/user-reports';
import SavedAnalyses from '@/pages/saved-analyses';
import NotFound from '@/pages/not-found';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('Router - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {isLoading ? (
        <Route path="/" component={() => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        )} />
      ) : isAuthenticated ? (
        <>
          <Route path="/" component={() => <Redirect to="/calculator" />} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/excel" component={ExcelToIaC} />
          <Route path="/terraform" component={TerraformUploadPage} />
          <Route path="/credentials" component={CloudCredentialsPage} />
          <Route path="/reports" component={UserReports} />
          <Route path="/analyses" component={SavedAnalyses} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/results/:id" component={Results} />
        </>
      ) : (
        <Route path="/" component={Landing} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component - Rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
