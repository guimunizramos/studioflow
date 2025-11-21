import React from 'react';
import { Task, Client, Project, Priority } from '../types';
import { Clock, Calendar, MoreHorizontal } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  client?: Client;
  project?: Project;
  onClick?: () => void;
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.URGENT: return 'bg-red-100 text-red-800 border-red-200';
    case Priority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
    case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case Priority.LOW: return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, client, project, onClick }) => {
  const formattedDate = new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div 
        onClick={onClick}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 hover:shadow-md hover:border-blue-300 transition-all relative group cursor-pointer"
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
          <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={14} />
          </button>
        </div>

        <h4 className="text-sm font-semibold text-gray-800 mb-1 leading-snug">{task.title}</h4>
        
        {project && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            {project.name}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">
          <div className="flex items-center space-x-1" title="Estimativa">
            <Clock size={12} />
            <span>{task.estimatedHours}h</span>
          </div>
          
          <div className={`flex items-center space-x-1 ${new Date(task.deadline) < new Date() ? 'text-red-500 font-bold' : ''}`}>
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {client && (
            <div className="mt-2 flex items-center">
                <span className="text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-full">
                    {client.name}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;