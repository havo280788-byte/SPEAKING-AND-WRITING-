import React from 'react';
import { AIModelType, SUPPORTED_MODELS } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    setApiKey: (key: string) => void;
    selectedModel: AIModelType;
    setSelectedModel: (model: AIModelType) => void;
}

const SettingsModal: React.FC<Props> = ({
    isOpen,
    onClose,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel
}) => {
    if (!isOpen) return null;

    const handleSave = () => {
        localStorage.setItem('lingua_api_key', apiKey);
        localStorage.setItem('lingua_selected_model', selectedModel);
        onClose();
        // Force reload to apply new settings effectively if needed, or state update is enough
        // window.location.reload(); 
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 p-0">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-cog text-2xl"></i>
                        <h3 className="text-2xl font-bold">Settings & Configuration</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* API Key Section */}
                    <div>
                        <label className="block text-gray-700 font-bold mb-2 text-lg">
                            Gemini API Key <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your API Key here (starts with AIza...)"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-gray-800"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2 ml-1">
                            Your key is stored locally in your browser. Get one at <a href="https://aistudio.google.com/" target="_blank" className="text-blue-600 font-bold hover:underline">Google AI Studio</a>.
                        </p>
                    </div>

                    {/* Model Selection Section */}
                    <div>
                        <label className="block text-gray-700 font-bold mb-4 text-lg">
                            Select AI Model
                            <span className="block text-sm font-normal text-gray-500 mt-1">
                                Choose your preferred intelligence level. System works best with Flash 3.
                            </span>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SUPPORTED_MODELS.map((model) => (
                                <div
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`cursor-pointer relative p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col gap-2 ${selectedModel === model.id
                                            ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                                            : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-lg ${selectedModel === model.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {model.name}
                                        </h4>
                                        {selectedModel === model.id && (
                                            <span className="text-blue-500 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                                                <i className="fas fa-check text-xs"></i>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{model.desc}</p>
                                    {model.isNew && (
                                        <span className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            NEW
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!apiKey}
                        className="px-8 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        Save Configuration
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
