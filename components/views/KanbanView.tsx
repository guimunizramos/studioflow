import React, { useState, useMemo } from 'react';
import { useData } from '../../services/dataContext';
import { TaskStatus, Priority } from '../../types';
import { KANBAN_COLUMNS } from '../../constants';
import TaskCard from '../TaskCard';
import { Filter, Search } from 'lucide-react';

interface KanbanViewProps {
  filterClientId?: string; 
  setFilterClientId?: (id: string | undefined) => void;
  onTaskClick?: (task: any) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ filterClientId, setFilterClientId, onTaskClick }) => {
  const { tasks, clients, projects, updateTaskStatus, config } = useData();
  
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterClientId && task.clientId !== filterClientId) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterClientId, searchQuery, filterPriority]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {setFilterClientId ? (
           <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
             <button 
                onClick={() => setFilterClientId(undefined)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${!filterClientId ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={!filterClientId ? { backgroundColor: config.visual.primaryColor } : {}}
             >
                Todos
             </button>
             {clients.map(client => (
               <button 
                 key={client.id}
                 onClick={() => setFilterClientId(client.id)}
                 className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2 ${filterClientId === client.id ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                 style={filterClientId === client.id ? { backgroundColor: client.color, borderColor: client.color } : {}}
               >
                 <span className={`w-2 h-2 rounded-full ${filterClientId === client.id ? 'bg-white' : ''}`} style={filterClientId !== client.id ? { backgroundColor: client.color } : {}} />
                 <span>{client.name}</span>
               </button>
             ))}
           </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-800">Kanban Geral</h2>
            <p className="text-sm text-gray-500">Visão macro de todas as tarefas da agência.</p>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar tarefa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
            />
          </div>
          
          <div className="relative flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer outline-none"
            >
              <option value="ALL">Todas Prioridades</option>
              <option value={Priority.URGENT}>Urgente</option>
              <option value={Priority.HIGH}>Alta</option>
              <option value={Priority.MEDIUM}>Média</option>
              <option value={Priority.LOW}>Baixa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full space-x-4 min-w-max">
          {KANBAN_COLUMNS.map(columnId => (
            <div 
              key={columnId} 
              className="w-72 flex flex-col bg-gray-100 rounded-xl"
              onDrop={(e) => handleDrop(e, columnId as TaskStatus)}
              onDragOver={handleDragOver}
            >
              <div className="p-3 font-semibold text-gray-700 flex justify-between items-center border-b border-gray-200/50">
                <span>{columnId}</span>
                <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">
                  {filteredTasks.filter(t => t.status === columnId).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {filteredTasks
                  .filter(task => task.status === columnId)
                  .map(task => (
                    <div 
                      key={task.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="cursor-move"
                    >
                      <TaskCard 
                        task={task} 
                        client={clients.find(c => c.id === task.clientId)}
                        project={projects.find(p => p.id === task.projectId)}
                        onClick={() => onTaskClick && onTaskClick(task)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanView;