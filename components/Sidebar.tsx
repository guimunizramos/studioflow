
import React from 'react';
import { Layout, Users, Calendar, CheckSquare, Settings, Briefcase, Palette, BarChart3, Home } from 'lucide-react';
import { useData } from '../services/dataContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { config } = useData();
  const { visual } = config;

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { id: 'kanban_client', label: 'Visão Geral', icon: <Briefcase size={20} /> },
    { id: 'list_view', label: 'Minhas Tarefas', icon: <CheckSquare size={20} /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 size={20} /> },
  ];

  const configItems = [
    { id: 'clients', label: 'Clientes', icon: <Users size={20} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
    { id: 'visual', label: 'Visual', icon: <Palette size={20} /> },
  ];

  return (
    <div className={`w-64 text-gray-300 flex flex-col h-full border-r border-gray-800 transition-colors duration-300`} style={{ backgroundColor: visual.sidebarColor }}>
      <div className="p-6 border-b border-white/10 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: visual.primaryColor }}>S</div>
        <span className="text-xl font-bold text-white tracking-tight">StudioFlow</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.id
                ? 'text-white'
                : 'hover:bg-white/10 hover:text-white'
            }`}
            style={currentView === item.id ? { backgroundColor: visual.primaryColor } : {}}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-white/10">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sistema</p>
            {configItems.map((item) => (
            <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id
                    ? 'text-white'
                    : 'hover:bg-white/10 hover:text-white'
                }`}
                style={currentView === item.id ? { backgroundColor: visual.primaryColor } : {}}
            >
                {item.icon}
                <span className="font-medium">{item.label}</span>
            </button>
            ))}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10 text-sm text-gray-500">
        <p>V 1.5.0</p>
        <p>Studio Management</p>
      </div>
    </div>
  );
};

export default Sidebar;