
import React, { useState, useEffect } from 'react';
import { useData } from '../services/dataContext';
import { Task, Priority, TaskStatus, TaskType } from '../types';
import { X, Trash2, Save } from 'lucide-react';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose }) => {
  const { updateTask, addTask, deleteTask, clients, projects, config, tasks } = useData();
  const [editedTask, setEditedTask] = useState<Task>({ ...task });

  // Reset state when task prop changes
  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  const handleSave = () => {
    // Check if task exists in the list
    const exists = tasks.some(t => t.id === editedTask.id);
    
    if (exists) {
        updateTask(editedTask);
    } else {
        addTask(editedTask);
    }
    onClose();
  };

  const handleDelete = () => {
    if(confirm('Tem certeza que deseja excluir esta tarefa?')) {
        deleteTask(task.id);
        onClose();
    }
  };

  const isNew = !tasks.some(t => t.id === task.id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{isNew ? 'Nova Tarefa' : 'Editar Tarefa'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
            
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Tarefa</label>
                <input 
                    type="text"
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                    placeholder="O que precisa ser feito?"
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            {/* Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select 
                        value={editedTask.clientId}
                        onChange={(e) => setEditedTask({...editedTask, clientId: e.target.value})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                    <select 
                        value={editedTask.projectId}
                        onChange={(e) => setEditedTask({...editedTask, projectId: e.target.value})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none"
                    >
                         <option value="">Selecione...</option>
                        {projects.filter(p => p.clientId === editedTask.clientId).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                        value={editedTask.status}
                        onChange={(e) => setEditedTask({...editedTask, status: e.target.value as TaskStatus})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none text-sm"
                    >
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select 
                        value={editedTask.type}
                        onChange={(e) => setEditedTask({...editedTask, type: e.target.value as TaskType})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none text-sm"
                    >
                        {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select 
                        value={editedTask.priority}
                        onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as Priority})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none text-sm"
                    >
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimativa (h)</label>
                    <input 
                        type="number"
                        value={editedTask.estimatedHours}
                        onChange={(e) => setEditedTask({...editedTask, estimatedHours: Number(e.target.value)})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (Data)</label>
                    <input 
                        type="date"
                        value={editedTask.deadline}
                        onChange={(e) => setEditedTask({...editedTask, deadline: e.target.value})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Início</label>
                    <input 
                        type="time"
                        value={editedTask.startTime || ''}
                        onChange={(e) => setEditedTask({...editedTask, startTime: e.target.value})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none"
                    />
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Link de Referência</label>
                 <input 
                        type="text"
                        placeholder="https://..."
                        value={editedTask.referenceLink || ''}
                        onChange={(e) => setEditedTask({...editedTask, referenceLink: e.target.value})}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none"
                  />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    placeholder="Detalhamento do que precisa ser feito..."
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 outline-none h-32 resize-none"
                />
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between rounded-b-xl">
            {!isNew ? (
                <button 
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Trash2 size={18} />
                    <span>Excluir</span>
                </button>
            ) : (
                <div></div>
            )}
            <div className="flex space-x-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center space-x-2 font-medium"
                    style={{ backgroundColor: config.visual.primaryColor }}
                >
                    <Save size={18} />
                    <span>{isNew ? 'Criar Tarefa' : 'Salvar Alterações'}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;
