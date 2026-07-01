
import React, { useState } from 'react';
import { useData } from '../../services/dataContext';
import { Client, ClientCategory, ContractType, Priority, WorkBlock } from '../../types';
import { WEEKDAY_LABELS_SUN_FIRST } from '../../constants';
import { Plus, Save, Edit2, Trash2 } from 'lucide-react';
import ConfirmDialog from '../ConfirmDialog';
import Avatar from '../Avatar';

const ClientsView: React.FC = () => {
  const { clients, updateClient, addClient, deleteClient } = useData();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [newBlock, setNewBlock] = useState<WorkBlock>({ day: WEEKDAY_LABELS_SUN_FIRST[1], start: '09:00', end: '12:00' });
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const handleEdit = (client: Client) => {
    setIsEditing(client.id);
    setEditForm(client);
  };

  const handleAddNew = () => {
    setIsEditing('new');
    setEditForm({
        name: '',
        brand: '', // Hidden, will copy name
        category: ClientCategory.OTHER,
        color: '#6b7280',
        weeklyHours: 0,
        minDailyHours: 0,
        priority: Priority.MEDIUM,
        observations: '',
        contractType: ContractType.RETAINER,
        workBlocks: [],
    });
  };

  const handleSave = () => {
    // Ensure brand matches name if not set, for consistency
    const payload = { ...editForm, brand: editForm.name } as Client;

    if (isEditing === 'new') {
        const newClient: Client = {
            ...payload,
            id: `c-${Date.now()}`,
        };
        addClient(newClient);
    } else if (isEditing) {
        updateClient(payload);
    }
    setIsEditing(null);
    setEditForm({});
  };

  return (
    <div className="p-6 bg-[#f2f2f3] dark:bg-black h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Clientes</h2>
             <p className="text-gray-500 dark:text-gray-500">Gerencie seus contratos e preferências.</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-2 bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus size={18} />
            <span>Novo Cliente</span>
          </button>
        </div>

        {isEditing && (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800 mb-8 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{isEditing === 'new' ? 'Adicionar Cliente' : 'Editar Cliente'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Nome da Marca/Projeto */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Marca / Projeto</label>
                        <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            placeholder="Ex: Coca-Cola, Projeto Verão..."
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                        />
                    </div>

                    {/* 2. Cor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor de Identificação</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editForm.color || '#000000'}
                                onChange={e => setEditForm({...editForm, color: e.target.value})}
                                className="h-10 w-16 rounded cursor-pointer border border-gray-300 dark:border-gray-700 p-1 bg-white dark:bg-gray-800"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-500 uppercase">{editForm.color}</span>
                        </div>
                    </div>

                    {/* 3. Horas Semanais */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas Semanais (Contrato)</label>
                        <input
                            type="number"
                            value={editForm.weeklyHours || 0}
                            onChange={e => setEditForm({...editForm, weeklyHours: Number(e.target.value)})}
                            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none"
                        />
                    </div>

                    {/* 4. Prioridade */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                        <div className="flex space-x-4">
                            {Object.values(Priority).map((p) => (
                                <label key={p} className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="radio"
                                        name="priority"
                                        checked={editForm.priority === p}
                                        onChange={() => setEditForm({...editForm, priority: p as Priority})}
                                        className="text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{p}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4b. Categoria */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(ClientCategory).map((cat) => (
                                <label key={cat} className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={editForm.category === cat}
                                        onChange={() => setEditForm({...editForm, category: cat as ClientCategory})}
                                        className="text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4c. Tipo de Contrato */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Contrato</label>
                        <div className="flex space-x-4">
                            {Object.values(ContractType).map((ct) => (
                                <label key={ct} className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="radio"
                                        name="contractType"
                                        checked={editForm.contractType === ct}
                                        onChange={() => setEditForm({...editForm, contractType: ct as ContractType})}
                                        className="text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{ct}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4d. Janelas de Trabalho Preferenciais */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Janelas de Trabalho Preferenciais</label>
                        <div className="space-y-2 mb-3">
                            {(editForm.workBlocks || []).map((wb, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">{wb.day}: {wb.start} - {wb.end}</span>
                                    <button
                                        onClick={() => setEditForm({...editForm, workBlocks: editForm.workBlocks!.filter((_, i) => i !== idx)})}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={newBlock.day}
                                onChange={e => setNewBlock({...newBlock, day: e.target.value})}
                                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm outline-none"
                            >
                                {WEEKDAY_LABELS_SUN_FIRST.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input
                                type="time"
                                value={newBlock.start}
                                onChange={e => setNewBlock({...newBlock, start: e.target.value})}
                                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm outline-none"
                            />
                            <input
                                type="time"
                                value={newBlock.end}
                                onChange={e => setNewBlock({...newBlock, end: e.target.value})}
                                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm outline-none"
                            />
                            <button
                                onClick={() => setEditForm({...editForm, workBlocks: [...(editForm.workBlocks || []), newBlock]})}
                                className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm hover:opacity-90"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* 5. Observações */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                        <textarea
                             value={editForm.observations || ''}
                             onChange={e => setEditForm({...editForm, observations: e.target.value})}
                             placeholder="Informações importantes sobre o cliente..."
                             className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 outline-none h-24 resize-none"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90 flex items-center space-x-2 transition-opacity shadow-sm"
                    >
                        <Save size={18} />
                        <span>Salvar</span>
                    </button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
                <div key={client.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: client.color }} />

                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={client.name} color={client.color} size="lg" />
                            <div className="min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight truncate">{client.name}</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">ID: {client.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => setDeletingClientId(client.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2">
                            <span className="text-gray-500 dark:text-gray-500">Categoria:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{client.category}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2">
                            <span className="text-gray-500 dark:text-gray-500">Contrato:</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">{client.weeklyHours}h <span className="text-xs font-normal text-gray-400 dark:text-gray-600">/ semana ({client.contractType})</span></span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2">
                            <span className="text-gray-500 dark:text-gray-500">Prioridade:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                client.priority === Priority.URGENT
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}>{client.priority}</span>
                        </div>
                    </div>

                    {client.observations ? (
                        <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-3">"{client.observations}"</p>
                        </div>
                    ) : (
                        <div className="mt-4 p-3 text-xs text-gray-300 dark:text-gray-700 italic text-center">
                            Sem observações
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {deletingClientId && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir este cliente? Tarefas e projetos vinculados não serão excluídos automaticamente."
          onConfirm={() => { deleteClient(deletingClientId); setDeletingClientId(null); }}
          onCancel={() => setDeletingClientId(null)}
        />
      )}
    </div>
  );
};

export default ClientsView;
