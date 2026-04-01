
import React from 'react';
import { Home, BarChart, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  className?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={cn("h-screen bg-sidebar fixed flex flex-col items-center py-8 w-20", className)}>
      <div className="mb-10">
        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
          <User className="h-6 w-6 text-sidebar" />
        </div>
      </div>
      
      <div className="flex flex-col gap-8 items-center">
        <button 
          className={cn(
            "h-12 w-12 rounded-full transition-colors flex items-center justify-center",
            activeTab === "dashboard" ? "bg-white" : "hover:bg-sidebar-accent"
          )}
          onClick={() => handleNavigation("dashboard")}
        >
          <Home className={cn("h-7 w-7", activeTab === "dashboard" ? "text-sidebar" : "text-white")} />
        </button>
        <button 
          className={cn(
            "h-12 w-12 rounded-full transition-colors flex items-center justify-center",
            activeTab === "weekly-summary" ? "bg-white" : "hover:bg-sidebar-accent"
          )}
          onClick={() => handleNavigation("weekly-summary")}
        >
          <BarChart className={cn("h-7 w-7", activeTab === "weekly-summary" ? "text-sidebar" : "text-white")} />
        </button>
        <button 
          className={cn(
            "h-12 w-12 rounded-full transition-colors flex items-center justify-center",
            activeTab === "historical-search" ? "bg-white" : "hover:bg-sidebar-accent"
          )}
          onClick={() => handleNavigation("historical-search")}
        >
          <Search className={cn("h-7 w-7", activeTab === "historical-search" ? "text-sidebar" : "text-white")} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
