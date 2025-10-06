import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  Menu, 
  X,
  MessageSquare,
  Settings,
  User
} from 'lucide-react';

const Button = ({ children, className, onClick, variant, size, ...props }: any) => (
  <button className={`px-4 py-2 rounded ${className || ''}`} onClick={onClick} {...props}>
    {children}
  </button>
);

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Proposals', href: '/proposal', icon: FileText },
  { name: 'Recruiting', href: '/recruiting', icon: Users },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MT</span>
              </div>
              <span className="font-semibold text-lg">MicroTech</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r">
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">MT</span>
              </div>
              <div>
                <span className="font-bold text-xl">MicroTech</span>
                <p className="text-xs text-muted-foreground">Platform</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">User</p>
                <p className="text-xs text-muted-foreground truncate">user@microtech.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="lg:hidden flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">MT</span>
                </div>
                <span className="font-semibold">MicroTech</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="relative"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
