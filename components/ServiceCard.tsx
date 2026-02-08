import React, { useState, useEffect } from 'react';
import { NetworkService } from '../types';

interface ServiceCardProps {
  service: NetworkService;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'external'>('checking');

  useEffect(() => {
    if (service.type === 'external') {
      setStatus('external');
      return;
    }

    const checkStatus = async () => {
      setStatus('checking');
      // Simulate network latency for the check
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
      // Simulate success/fail for demonstration
      const isReachable = Math.random() > 0.1; 
      setStatus(isReachable ? 'online' : 'offline');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [service]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'external':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border border-slate-100">
            <span className="size-1.5 bg-slate-400 rounded-full"></span>
            External
          </div>
        );
      case 'online':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wider border border-emerald-100">
            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Online
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold uppercase tracking-wider border border-rose-100">
            <span className="size-1.5 bg-rose-500 rounded-full"></span>
            Offline
          </div>
        );
      case 'checking':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold uppercase tracking-wider border border-amber-100">
            <span className="size-1.5 bg-amber-400 rounded-full animate-bounce"></span>
            Checking
          </div>
        );
    }
  };

  const getIconColor = () => {
    if (service.name.toLowerCase().includes('plex')) return 'text-orange-500 bg-orange-50';
    if (service.name.toLowerCase().includes('home assistant')) return 'text-blue-600 bg-blue-50';
    if (service.name.toLowerCase().includes('pi-hole')) return 'text-red-500 bg-red-50';
    if (service.name.toLowerCase().includes('nas')) return 'text-sky-600 bg-sky-50';
    if (service.name.toLowerCase().includes('github')) return 'text-slate-900 bg-slate-100';
    return 'text-primary bg-primary/5';
  };

  // Determine if the icon is a custom image (path/URL) or a Material Symbol name
  const isCustomIcon = service.icon.includes('.') || service.icon.startsWith('/') || service.icon.startsWith('http');

  return (
    <div className="group bg-surface border border-border rounded-2xl p-6 shadow-subtle hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div className={`size-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden ${getIconColor()}`}>
          {isCustomIcon ? (
            <img 
              src={service.icon} 
              alt={service.name} 
              className="size-8 object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3208/3208679.png';
              }}
            />
          ) : (
            <span className="material-symbols-outlined text-3xl">{service.icon}</span>
          )}
        </div>
        {getStatusDisplay()}
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{service.name}</h3>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">
          {service.description}
        </p>
        <div className="text-[11px] text-slate-400 font-mono mb-6">
          <span className="block opacity-75">{service.hostname}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
        <span className="text-[11px] font-bold font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
          PORT {service.port}
        </span>
        <a 
          href={service.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary text-sm font-semibold rounded-lg group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:shadow-primary/20"
        >
          Launch
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>
      </div>
    </div>
  );
};

export default ServiceCard;