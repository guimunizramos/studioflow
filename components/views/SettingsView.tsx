
import React, { useState } from 'react';
import { useData } from '../../services/dataContext';
import { Save, Calculator, AlertTriangle } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { config, updateConfig, clients, updateClient } = useData();
  const [localConfig, setLocalConfig] = useState({
      totalHoursPerDay: config.totalHoursPerDay,
      workWindowStart: config.workWindowStart,
      workWindowEnd: config.workWindowEnd,
  });

  const handleSave = () => {
    updateConfig(localConfig);
    alert('Configurações salvas!');
  };

  const handleClientHoursChange = (id: string, value: string, type: 'weekly' | 'daily') => {
    const client = clients.find(c => c.id === id);
    if (client) {
        let newWeekly = 0;
        if (type === 'weekly') {
            newWeekly = Number(value);
        } else {
            newWeekly = Number(value) * 5; // Assume 5 dias úteis
        }
        updateClient({ ...client, weeklyHours: newWeekly });
    }
  };

  const totalAllocatedWeekly = clients.reduce((sum, client) => sum + client.weeklyHours, 0);
  const capacityWeekly = config.totalHoursPerDay * 5; 

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Configurações Gerais</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Configurações da Agência */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Jornada de Trabalho</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Horas Totais por Dia</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={localConfig.totalHoursPerDay} 
                                    onChange={e => setLocalConfig({...localConfig, totalHoursPerDay: Number(e.target.value)})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="absolute right-3 top-2 text-gray-400 text-sm">h</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Capacidade diária da agência.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                <input 
                                    type="time" 
                                    value={localConfig.workWindowStart} 
                                    onChange={e => setLocalConfig({...localConfig, workWindowStart: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                                <input 
                                    type="time" 
                                    value={localConfig.workWindowEnd} 
                                    onChange={e => setLocalConfig({...localConfig, workWindowEnd: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleSave} 
                            className="w-full mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center justify-center space-x-2"
                            style={{ backgroundColor: config.visual.primaryColor }}
                        >
                            <Save size={18} />
                            <span>Salvar Config</span>
                        </button>
                    </div>
                </div>

                {/* Resumo de Capacidade */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">Saúde da Agência</h3>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Ocupação Semanal</span>
                            <span className={`font-bold ${totalAllocatedWeekly > capacityWeekly ? 'text-red-600' : 'text-gray-900'}`}>
                                {totalAllocatedWeekly}h / {capacityWeekly}h
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ${totalAllocatedWeekly > capacityWeekly ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min((totalAllocatedWeekly / capacityWeekly) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {totalAllocatedWeekly > capacityWeekly ? (
                        <div className="flex items-start space-x-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>Você vendeu <strong>{totalAllocatedWeekly - capacityWeekly} horas</strong> a mais do que sua capacidade de entrega!</p>
                        </div>
                    ) : (
                        <div className="flex items-start space-x-2 p-3 bg-green-50 text-green-700 rounded-lg text-xs">
                            <Calculator size={16} className="shrink-0 mt-0.5" />
                            <p>Você ainda tem <strong>{capacityWeekly - totalAllocatedWeekly} horas</strong> livres para vender por semana.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Distribuição por Cliente */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Horas por Cliente</h3>
                    <p className="text-sm text-gray-500 mb-6">Defina o contrato semanal ou a meta diária. O cálculo é feito automaticamente considerando 5 dias úteis.</p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase border-b border-gray-100 pb-2">
                            <div className="col-span-6">Cliente</div>
                            <div className="col-span-3 text-center">Horas/Semana</div>
                            <div className="col-span-3 text-center">Média/Dia</div>
                        </div>

                        {clients.map(client => (
                            <div key={client.id} className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-gray-50 rounded-lg transition-colors px-2 -mx-2">
                                <div className="col-span-6 flex items-center space-x-3">
                                     <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: client.color }}></div>
                                     <div>
                                        <span className="font-medium text-gray-700 block truncate">{client.name}</span>
                                        <span className="text-xs text-gray-400 block truncate">{client.category}</span>
                                     </div>
                                </div>
                                
                                <div className="col-span-3 relative">
                                    <input 
                                        type="number" 
                                        value={client.weeklyHours}
                                        onChange={(e) => handleClientHoursChange(client.id, e.target.value, 'weekly')}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="col-span-3 relative">
                                    <input 
                                        type="number" 
                                        value={client.weeklyHours / 5}
                                        onChange={(e) => handleClientHoursChange(client.id, e.target.value, 'daily')}
                                        className="w-full border border-gray-300 bg-gray-50 text-gray-600 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
