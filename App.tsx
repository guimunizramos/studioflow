
import React, { useState } from 'react';
import { DataProvider, useData } from './services/dataContext';
import Sidebar from './components/Sidebar';
import KanbanView from './components/views/KanbanView';
import ListView from './components/views/ListView';
import AgendaView from './components/views/AgendaView';
import ClientsView from './components/views/ClientsView';
import SettingsView from './components/views/SettingsView';
import VisualView from './components/views/VisualView';
import ReportsView from './components/views/ReportsView';
import HomeView from './components/views/HomeView';
import TaskEditModal from './components/TaskEditModal';
import { Task, TaskStatus, TaskType, Priority } from './types';
import { Plus } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  const [filterClientId, setFilterClientId] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { config } = useData();

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
    if (viewId !== 'kanban_client') {
       setFilterClientId(undefined);
    }
  };

  const handleCreateTask = () => {
    const newTask: Task = {
        id: `t-${Date.now()}`,
        title: '',
        description: '',
        clientId: '',
        projectId: '',
        status: TaskStatus.BACKLOG,
        type: TaskType.COPY,
        priority: Priority.MEDIUM,
        estimatedHours: 1,
        deadline: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        isRecurring: false
    };
    setEditingTask(newTask);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onTaskClick={setEditingTask} onChangeView={handleViewChange} />;
      case 'kanban_general':
        return <KanbanView onTaskClick={setEditingTask} />;
      case 'kanban_client':
        return <KanbanView filterClientId={filterClientId} setFilterClientId={setFilterClientId} onTaskClick={setEditingTask} />;
      case 'list_view':
        return <ListView onTaskClick={setEditingTask} />;
      case 'agenda':
        return <AgendaView onTaskClick={setEditingTask} />;
      case 'reports':
        return <ReportsView />;
      case 'clients':
        return <ClientsView />;
      case 'settings':
        return <SettingsView />;
      case 'visual':
        return <VisualView />;
      default:
        return <HomeView onTaskClick={setEditingTask} onChangeView={handleViewChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {renderContent()}
        
        {/* FAB - New Task Button */}
        <button 
            onClick={handleCreateTask}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40"
            style={{ backgroundColor: config.visual.primaryColor }}
            title="Nova Tarefa"
        >
            <Plus size={28} />
        </button>

        {editingTask && (
            <TaskEditModal 
                task={editingTask} 
                onClose={() => setEditingTask(null)} 
            />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
};

export default App;
