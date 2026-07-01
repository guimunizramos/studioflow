
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../services/dataContext';
import { Task, Priority, TaskStatus, TaskType } from '../types';
import { X, Trash2, Save } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose }) => {
  const { updateTask, addTask, deleteTask, clients, projects, tasks } = useData();
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset state when task prop changes
  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  const isNew = useMemo(() => !tasks.some(t => t.id === task.id), [tasks, task.id]);

  const handleSave = () => {
    if (isNew) {
        addTask(editedTask);
    } else {
        updateTask(editedTask);
    }
    onClose();
  };

  const handleDelete = () => {
    setConfirmingDelete(true);
  };

  const confirmDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{isNew ? 'Nova Tarefa' : 'Editar Tarefa'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">

            {/* Title */}
            <div>
                <label className={labelClass}>Título da Tarefa</label>
                <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                    placeholder="O que precisa ser feito?"
                    className={inputClass}
                />
            </div>

            {/* Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Cliente</label>
                    <select
                        value={editedTask.clientId}
                        onChange={(e) => setEditedTask({...editedTask, clientId: e.target.value})}
                        className={inputClass}
                    >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Projeto</label>
                    <select
                        value={editedTask.projectId}
                        onChange={(e) => setEditedTask({...editedTask, projectId: e.target.value})}
                        className={inputClass}
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
                    <label className={labelClass}>Status</label>
                    <select
                        value={editedTask.status}
                        onChange={(e) => setEditedTask({...editedTask, status: e.target.value as TaskStatus})}
                        className={`${inputClass} text-sm`}
                    >
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Tipo</label>
                    <select
                        value={editedTask.type}
                        onChange={(e) => setEditedTask({...editedTask, type: e.target.value as TaskType})}
                        className={`${inputClass} text-sm`}
                    >
                        {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Prioridade</label>
                    <select
                        value={editedTask.priority}
                        onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as Priority})}
                        className={`${inputClass} text-sm`}
                    >
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Estimativa (h)</label>
                    <input
                        type="number"
                        value={editedTask.estimatedHours}
                        onChange={(e) => setEditedTask({...editedTask, estimatedHours: Number(e.target.value)})}
                        className={`${inputClass} text-sm`}
                    />
                </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-2">
                    <label className={labelClass}>Prazo (Data)</label>
                    <input
                        type="date"
                        value={editedTask.deadline}
                        onChange={(e) => setEditedTask({...editedTask, deadline: e.target.value})}
                        className={inputClass}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className={labelClass}>Hora de Início</label>
                    <input
                        type="time"
                        value={editedTask.startTime || ''}
                        onChange={(e) => setEditedTask({...editedTask, startTime: e.target.value})}
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                 <label className={labelClass}>Link de Referência</label>
                 <input
                        type="text"
                        placeholder="https://..."
                        value={editedTask.referenceLink || ''}
                        onChange={(e) => setEditedTask({...editedTask, referenceLink: e.target.value})}
                        className={inputClass}
                  />
            </div>

            <div>
                <label className={labelClass}>Descrição</label>
                <textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    placeholder="Detalhamento do que precisa ser feito..."
                    className={`${inputClass} h-32 resize-none`}
                />
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex justify-between rounded-b-xl">
            {!isNew ? (
                <button
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center space-x-2 font-medium"
                >
                    <Save size={18} />
                    <span>{isNew ? 'Criar Tarefa' : 'Salvar Alterações'}</span>
                </button>
            </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta tarefa?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
};

export default TaskEditModal;
