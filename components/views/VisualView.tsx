import React from 'react';
import { useData } from '../../services/dataContext';
import { Check } from 'lucide-react';

const COLORS = ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
const SIDEBAR_COLORS = ['#111827', '#1e293b', '#0f172a', '#312e81', '#374151', '#000000'];

const VisualView: React.FC = () => {
  const { config, updateConfig } = useData();
  const { visual } = config;

  const updateVisual = (key: string, value: any) => {
      updateConfig({
          visual: {
              ...visual,
              [key]: value
          }
      });
  };

  return (
    <div className="p-6 bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personalização Visual</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            
            <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Cor de Destaque (Botões e Links)</h3>
                <div className="flex space-x-3">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => updateVisual('primaryColor', color)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ${visual.primaryColor === color ? 'ring-gray-400' : 'ring-transparent'}`}
                            style={{ backgroundColor: color }}
                        >
                            {visual.primaryColor === color && <Check size={20} className="text-white" />}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Cor da Barra Lateral</h3>
                <div className="flex space-x-3">
                    {SIDEBAR_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => updateVisual('sidebarColor', color)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ${visual.sidebarColor === color ? 'ring-gray-400' : 'ring-transparent'}`}
                            style={{ backgroundColor: color }}
                        >
                            {visual.sidebarColor === color && <Check size={20} className="text-white" />}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Pré-visualização</h3>
                <div className="p-4 border border-gray-200 rounded-lg flex items-center space-x-4 bg-gray-50">
                    <button 
                        className="px-4 py-2 text-white rounded-lg shadow-sm"
                        style={{ backgroundColor: visual.primaryColor }}
                    >
                        Botão Principal
                    </button>
                    <div className="px-4 py-2 text-white rounded-lg" style={{ backgroundColor: visual.sidebarColor }}>
                        Sidebar
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default VisualView;