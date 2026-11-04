import React from 'react';

/**
 * Link, der immer in einem neuen Tab aufgeht.
 *
 * target="_blank" allein reicht in Arc (Peek) und Zen (Glance) nicht: Links aus angehefteten
 * Tabs bzw. Essentials oeffnen diese Browser als Overlay. Ein normaler Linksklick oeffnet die
 * Seite deshalb per window.open; Mittelklick, Strg/Cmd-Klick und "Link kopieren" bleiben dem
 * Browser ueberlassen (href bleibt erhalten).
 */
export function inNeuemTab(e: React.MouseEvent<HTMLAnchorElement>, url: string) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.open(url, '_blank', 'noopener,noreferrer');
}

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & {
  href: string;
};

const NeuerTabLink: React.FC<Props> = ({ href, onClick, children, ...rest }) => (
  <a
    {...rest}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => {
      onClick?.(e);
      if (!e.defaultPrevented) inNeuemTab(e, href);
    }}
  >
    {children}
  </a>
);

export default NeuerTabLink;
