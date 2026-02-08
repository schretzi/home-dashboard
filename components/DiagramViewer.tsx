
import React, { useState } from 'react';
import { NetworkDiagram } from '../types';

interface DiagramViewerProps {
  diagram: NetworkDiagram;
  onClose: () => void;
}

const DiagramViewer: React.FC<DiagramViewerProps> = ({ diagram, onClose }) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">schema</span>
          </div>
          <div>
            <h3 className="text-white font-bold">{diagram.filename}</h3>
            <p className="text-slate-400 text-xs">{diagram.description} • {diagram.metadata}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 mr-4">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 text-white rounded-md transition-colors" title="Zoom Out">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button onClick={handleReset} className="px-3 text-white text-xs font-bold hover:bg-white/10 rounded-md transition-colors">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 text-white rounded-md transition-colors" title="Zoom In">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="size-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-rose-500 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto p-12 flex items-center justify-center custom-scrollbar cursor-grab active:cursor-grabbing">
        <div 
          className="transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <img 
            src={diagram.imageUrl} 
            alt={diagram.filename} 
            className="max-w-none shadow-2xl rounded-sm border border-white/10"
          />
        </div>
      </div>
      
      {/* Footer / Info */}
      <div className="h-12 flex items-center justify-center px-6 bg-slate-900/50 text-white/50 text-xs">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">info</span>
          Interactive View: Use scroll to pan, controls above to zoom.
        </span>
      </div>
    </div>
  );
};

export default DiagramViewer;
