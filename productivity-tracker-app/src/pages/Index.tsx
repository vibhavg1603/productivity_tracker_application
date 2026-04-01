
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import WeeklySummaryTab from '@/components/WeeklySummaryTab';
import HistoricalSearchTab from '@/components/HistoricalSearchTab';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-6 ml-20 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold dark:text-white">Productivity Tracker</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Track and improve your productivity over time</p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            <Switch 
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
            <Moon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
        </div>

        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "weekly-summary" && <WeeklySummaryTab />}
        {activeTab === "historical-search" && <HistoricalSearchTab />}
      </div>
    </div>
  );
};

export default Index;
