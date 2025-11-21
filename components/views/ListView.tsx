import React from 'react';
import { useData } from '../../services/dataContext';
import { TaskStatus, Priority, Task } from '../../types';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ListViewProps {
    onTaskClick?: (task: Task) => void;
}

const ListView: React.FC<ListViewProps> = ({ onTaskClick }) => {
  const { tasks, clients, projects, updateTaskStatus } = useData();

  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const date = new Date(dateStr);
    date.setHours(0,0,0,0);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const upcomingTasks = tasks.filter(task => {
    const diff = getDaysDiff(task.deadline);
    return diff <= 7 && task.status !== TaskStatus.COMPLETED;
  });

  const priorityWeight = {
    [Priority.URGENT]: 4,
    [Priority.HIGH]: 3,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 1
  };

  upcomingTasks.sort((a, b) => {
    const pA = priorityWeight[a.priority];
    const pB = priorityWeight[b.priority];
    if (pA !== pB) return pB - pA;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const getDayLabel = (diff: number) => {
    if (diff < 0) return 'Atrasado';
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    return `Em ${diff} dias`;
  };

  const getStatusColor = (status: TaskStatus) => {
    if (status === TaskStatus.IN_PROGRESS) return 'bg-blue-100 text-blue-700';
    if (status === TaskStatus.WAITING_CLIENT) return 'bg-purple-100 text-purple-700';
    if (status === TaskStatus.APPROVAL) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h2>
          <p className="text-gray-500">Próximos 7 dias e pendências urgentes.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {upcomingTasks.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
              <p>Tudo limpo! Nenhuma tarefa urgente para os próximos dias.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingTasks.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                const project = projects.find(p => p.id === task.projectId);
                const diff = getDaysDiff(task.deadline);
                const dayLabel = getDayLabel(diff);

                return (
                  <div 
                    key={task.id} 
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    
                    <div className="flex items-start space-x-4">
                       <button 
                          onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, TaskStatus.COMPLETED); }}
                          className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-all group"
                          title="Concluir tarefa"
                       >
                         <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100 text-green-600" />
                       </button>

                       <div>
                         <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${diff < 0 ? 'bg-red-100 text-red-700' : diff === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {dayLabel}
                            </span>
                            <span className={`text-[10px] uppercase font-semibold tracking-wider text-gray-500`}>
                              {task.type}
                            </span>
                         </div>
                         <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
                         <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client?.color || '#ccc' }}></span>
                              <span>{client?.name}</span>
                            </span>
                            <span>•</span>
                            <span>{project?.name}</span>
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center space-x-4 pl-9 sm:pl-0">
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded text-xs font-medium mb-1 ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <div className="flex items-center text-xs text-gray-400 space-x-3">
                           <div className="flex items-center" title="Prioridade">
                              <AlertCircle size={12} className={`mr-1 ${task.priority === Priority.URGENT ? 'text-red-500' : 'text-gray-400'}`} />
                              <span>{task.priority}</span>
                           </div>
                           <div className="flex items-center" title="Estimativa">
                              <Clock size={12} className="mr-1" />
                              <span>{task.estimatedHours}h</span>
                           </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListView;