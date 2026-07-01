import React from 'react';
import { useData } from '../../services/dataContext';
import { Sun, Moon } from 'lucide-react';

const VisualView: React.FC = () => {
  const { config, updateConfig } = useData();
  const { visual } = config;

  const setThemeMode = (mode: 'light' | 'dark') => {
      updateConfig({
          visual: {
              ...visual,
              themeMode: mode
          }
      });
  };

  return (
    <div className="p-6 bg-[#f2f2f3] dark:bg-black h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">Personalização Visual</h2>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-8">

            <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Tema</h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setThemeMode('light')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            visual.themeMode === 'light'
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Sun size={16} />
                        <span>Claro</span>
                    </button>
                    <button
                        onClick={() => setThemeMode('dark')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            visual.themeMode === 'dark'
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Moon size={16} />
                        <span>Escuro</span>
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Pré-visualização</h3>
                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center space-x-4 bg-[#f2f2f3] dark:bg-black">
                    <button className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg shadow-sm">
                        Botão Principal
                    </button>
                    <div className="px-4 py-2 bg-black text-white rounded-lg">
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
