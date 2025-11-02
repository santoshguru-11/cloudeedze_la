import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/calculator" className="flex items-center">
              <img
                src="/dZlens.png"
                alt="DZlens"
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Navigation Links - Only show when authenticated */}
          {isAuthenticated && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/calculator">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Calculator
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Inventory
                  </Button>
                </Link>
                <Link href="/excel">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Excel Upload
                  </Button>
                </Link>
                <Link href="/terraform">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Terraform
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Reports
                  </Button>
                </Link>
                <Link href="/analyses">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Saved Analyses
                  </Button>
                </Link>
                {(user as any)?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                      Admin
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.firstName || user?.email}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setLocation('/login')} 
                  variant="ghost"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => setLocation('/login')} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
