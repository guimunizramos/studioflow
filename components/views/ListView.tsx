import React, { useMemo } from 'react';
import { useData } from '../../services/dataContext';
import { TaskStatus, Priority, Task } from '../../types';
import { CheckCircle2 } from 'lucide-react';
import Avatar from '../Avatar';

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

  const priorityWeight = {
    [Priority.URGENT]: 4,
    [Priority.HIGH]: 3,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 1
  };

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const diff = getDaysDiff(task.deadline);
        return diff <= 7 && task.status !== TaskStatus.COMPLETED;
      })
      .sort((a, b) => {
        const pA = priorityWeight[a.priority];
        const pB = priorityWeight[b.priority];
        if (pA !== pB) return pB - pA;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }, [tasks]);

  const clientsById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const getDayLabel = (diff: number) => {
    if (diff < 0) return 'Atrasado';
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    return `Em ${diff} dias`;
  };

  const getStatusColor = (status: TaskStatus) => {
    if (status === TaskStatus.COMPLETED) return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="p-6 bg-[#f2f2f3] dark:bg-black h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Minhas Tarefas</h2>
          <p className="text-gray-500 dark:text-gray-500">Próximos 7 dias e pendências urgentes.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {upcomingTasks.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
              <p>Tudo limpo! Nenhuma tarefa urgente para os próximos dias.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {upcomingTasks.map(task => {
                const client = clientsById.get(task.clientId);
                const project = projectsById.get(task.projectId);
                const diff = getDaysDiff(task.deadline);
                const dayLabel = getDayLabel(diff);

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >

                    <div className="flex items-center gap-4 min-w-0">
                       <Avatar name={client?.name || '?'} color={client?.color || '#9ca3af'} size="lg" />

                       <div className="min-w-0">
                         <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${diff < 0 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : diff === 0 ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {dayLabel}
                            </span>
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-500">
                              {task.type}
                            </span>
                         </div>
                         <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 truncate">
                            {client?.name} • {project?.name}
                         </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-50">{task.estimatedHours}h</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>

                      <button
                          onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, TaskStatus.COMPLETED); }}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 flex items-center justify-center transition-all group shrink-0"
                          title="Concluir tarefa"
                       >
                         <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-100 text-green-600 dark:text-green-400" />
                       </button>
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