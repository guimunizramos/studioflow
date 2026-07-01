import React from 'react';
import { Task, Client, Project, Priority } from '../types';
import { Clock, Calendar, MoreHorizontal } from 'lucide-react';
import Avatar from './Avatar';

interface TaskCardProps {
  task: Task;
  client?: Client;
  project?: Project;
  onClick?: () => void;
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.URGENT: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, client, project, onClick }) => {
  const formattedDate = new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div
        onClick={onClick}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-3 mb-3 hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 transition-all relative group cursor-pointer"
    >
      {client && (
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
          style={{ backgroundColor: client.color }}
        />
      )}

      <div className="pl-2">
        <div className="flex justify-between items-start mb-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          {client && <Avatar name={client.name} color={client.color} size="sm" />}
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{task.title}</h4>
        </div>

        {project && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 truncate">
            {project.name}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          <div className="flex items-center space-x-1" title="Estimativa">
            <Clock size={12} />
            <span className="font-semibold text-gray-600 dark:text-gray-300">{task.estimatedHours}h</span>
          </div>

          <div className={`flex items-center space-x-1 ${new Date(task.deadline) < new Date() ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {client && (
            <div className="mt-2 flex items-center">
                <span className="text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 truncate max-w-full">
                    {client.name}
                </span>
            </div>
        )}
      </div>
    </div>
  );
});

export default TaskCard;
