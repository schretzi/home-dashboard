import React from 'react';
import { Dienst, Verweis } from '../types';
import NeuerTabLink from './NeuerTabLink';

type Status = 'online' | 'offline' | 'link';

const STATUS: Record<Status, { text: string; klasse: string; punkt: string }> = {
  online: {
    text: 'Online',
    klasse: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    punkt: 'bg-emerald-500 animate-pulse',
  },
  offline: {
    text: 'Offline',
    klasse: 'bg-rose-50 text-rose-600 border-rose-100',
    punkt: 'bg-rose-500',
  },
  link: {
    text: 'Link',
    klasse: 'bg-slate-50 text-slate-500 border-slate-100',
    punkt: 'bg-slate-400',
  },
};

/** Icon: Dateiname aus /icons, URL, oder Name eines Material-Symbols */
function Icon({ icon, name }: { icon?: string | null; name: string }) {
  const bild = icon && (icon.includes('.') || icon.startsWith('/') || icon.startsWith('http'));
  if (bild) {
    const src = icon!.startsWith('http') || icon!.startsWith('/') ? icon! : '/icons/' + icon;
    return (
      <img
        src={src}
        alt=""
        className="size-6 object-contain"
        onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
      />
    );
  }
  return (
    <span className="material-symbols-outlined text-2xl" aria-label={name}>
      {icon || 'dns'}
    </span>
  );
}

interface Props {
  dienst?: Dienst;
  verweis?: Verweis;
}

const ServiceCard: React.FC<Props> = ({ dienst, verweis }) => {
  const name = dienst?.name ?? verweis!.name;
  const link = dienst ? dienst.link : verweis!.url;
  const status: Status = dienst ? (dienst.ok ? 'online' : 'offline') : 'link';
  const s = STATUS[status];
  const beschreibung = dienst?.beschreibung ?? verweis?.beschreibung;
  const unterzeile = dienst ? dienst.ziel.replace(/^https?:\/\//, '') : verweis!.url.replace(/^https?:\/\//, '');

  return (
    <div
      className={`group bg-surface border rounded-2xl p-4 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col h-full ${
        status === 'offline' ? 'border-rose-200' : 'border-border hover:border-primary/20'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="size-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden text-primary bg-primary/5">
          <Icon icon={dienst?.icon ?? verweis?.icon} name={name} />
        </div>
        <div
          className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.klasse}`}
        >
          <span className={`size-1.5 rounded-full ${s.punkt}`}></span>
          {s.text}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 mb-1">{name}</h3>
        {beschreibung && (
          <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{beschreibung}</p>
        )}
        <div className="text-[10px] text-slate-400 font-mono mb-4 break-all">{unterzeile}</div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
        <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
          {dienst?.dauer_ms != null && dienst.ok ? `${dienst.dauer_ms} ms` : dienst?.host ?? ''}
        </span>
        {link && (
          <NeuerTabLink
            href={link}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary text-xs font-semibold rounded-lg group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:shadow-primary/20"
          >
            Öffnen
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </NeuerTabLink>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
