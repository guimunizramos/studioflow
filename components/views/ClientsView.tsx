
import React, { useState } from 'react';
import { useData } from '../../services/dataContext';
import { Client, ClientCategory, Priority } from '../../types';
import { Plus, Save, Edit2 } from 'lucide-react';

const ClientsView: React.FC = () => {
  const { clients, updateClient, addClient, config } = useData();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  const handleEdit = (client: Client) => {
    setIsEditing(client.id);
    setEditForm(client);
  };

  const handleAddNew = () => {
    setIsEditing('new');
    setEditForm({
        name: '',
        brand: '', // Hidden, will copy name
        category: ClientCategory.OTHER, // Default hidden
        color: '#6b7280',
        weeklyHours: 0,
        minDailyHours: 0,
        priority: Priority.MEDIUM,
        observations: ''
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
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
             <p className="text-gray-500">Gerencie seus contratos e preferências.</p>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: config.visual.primaryColor }}
          >
            <Plus size={18} />
            <span>Novo Cliente</span>
          </button>
        </div>

        {isEditing && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">{isEditing === 'new' ? 'Adicionar Cliente' : 'Editar Cliente'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Nome da Marca/Projeto */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Marca / Projeto</label>
                        <input 
                            type="text" 
                            value={editForm.name || ''} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            placeholder="Ex: Coca-Cola, Projeto Verão..."
                            className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* 2. Cor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Identificação</label>
                        <div className="flex items-center space-x-3">
                            <input 
                                type="color" 
                                value={editForm.color || '#000000'} 
                                onChange={e => setEditForm({...editForm, color: e.target.value})}
                                className="h-10 w-16 rounded cursor-pointer border border-gray-300 p-1 bg-white"
                            />
                            <span className="text-sm text-gray-500 uppercase">{editForm.color}</span>
                        </div>
                    </div>

                    {/* 3. Horas Semanais */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Horas Semanais (Contrato)</label>
                        <input 
                            type="number" 
                            value={editForm.weeklyHours || 0} 
                            onChange={e => setEditForm({...editForm, weeklyHours: Number(e.target.value)})}
                            className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* 4. Prioridade */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                        <div className="flex space-x-4">
                            {Object.values(Priority).map((p) => (
                                <label key={p} className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:bg-gray-100">
                                    <input 
                                        type="radio" 
                                        name="priority"
                                        checked={editForm.priority === p}
                                        onChange={() => setEditForm({...editForm, priority: p as Priority})}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{p}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 5. Observações */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea 
                             value={editForm.observations || ''} 
                             onChange={e => setEditForm({...editForm, observations: e.target.value})}
                             placeholder="Informações importantes sobre o cliente..."
                             className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                    <button 
                        onClick={handleSave} 
                        className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center space-x-2 transition-opacity shadow-sm"
                        style={{ backgroundColor: config.visual.primaryColor }}
                    >
                        <Save size={18} />
                        <span>Salvar</span>
                    </button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
                <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: client.color }} />
                    
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">{client.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">ID: {client.id}</p>
                        </div>
                        <button onClick={() => handleEdit(client)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                            <Edit2 size={18} />
                        </button>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Contrato:</span>
                            <span className="font-bold text-gray-700">{client.weeklyHours}h <span className="text-xs font-normal text-gray-400">/ semana</span></span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Prioridade:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                client.priority === Priority.URGENT ? 'bg-red-100 text-red-700' :
                                client.priority === Priority.HIGH ? 'bg-orange-100 text-orange-700' :
                                client.priority === Priority.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }`}>{client.priority}</span>
                        </div>
                    </div>
                    
                    {client.observations ? (
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-600 italic line-clamp-3">"{client.observations}"</p>
                        </div>
                    ) : (
                        <div className="mt-4 p-3 text-xs text-gray-300 italic text-center">
                            Sem observações
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ClientsView;
