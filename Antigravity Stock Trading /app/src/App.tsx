import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLivePrices } from '@/hooks/useLivePrices';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { PortfolioView } from '@/components/dashboard/PortfolioView';
import { MarketView } from '@/components/dashboard/MarketView';
import { PaymentMethodView } from '@/components/dashboard/PaymentMethodView';
import { ProjectionsView } from '@/components/dashboard/ProjectionsView';
import { ProfileView } from '@/components/dashboard/ProfileView';
import { AdminDashboardView } from '@/components/dashboard/AdminDashboardView';
import './App.css';

type View = 'login' | 'signup' | 'dashboard' | 'portfolio' | 'market' | 'payment' | 'projections' | 'profile' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Mount the real-time WebSocket connection to listen for Finnhub stock prices
  useLivePrices();

  useEffect(() => {
    if (isAuthenticated && (currentView === 'login' || currentView === 'signup')) {
      setCurrentView('dashboard');
    } else if (!isAuthenticated && currentView !== 'login' && currentView !== 'signup') {
      setCurrentView('login');
    }
  }, [isAuthenticated, currentView]);

  const handleViewChange = (view: 'dashboard' | 'portfolio' | 'market' | 'payment' | 'projections' | 'profile') => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm onSwitchToSignup={() => setCurrentView('signup')} />;
      case 'signup':
        return <SignupForm onSwitchToLogin={() => setCurrentView('login')} />;
      case 'dashboard':
        return <DashboardView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'market':
        return <MarketView onGoToPayment={() => setCurrentView('payment')} />;
      case 'payment':
        return <PaymentMethodView 
          onBack={() => setCurrentView('market')} 
          onComplete={() => setCurrentView('portfolio')} 
        />;
      case 'projections':
        return <ProjectionsView />;
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <DashboardView />;
    }
  };

  // Auth pages (login/signup) don't show header/sidebar
  if (currentView === 'login' || currentView === 'signup') {
    return (
      <div className="min-h-screen bg-slate-900">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header onMenuClick={() => setSidebarOpen(true)} onViewChange={handleViewChange} />
      
      <div className="flex">
        <Sidebar 
          currentView={currentView} 
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
