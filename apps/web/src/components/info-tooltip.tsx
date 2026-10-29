import { useId } from 'react';

export function InfoTooltip({ text, label = 'Ver orientação desta seção' }: { text: string; label?: string }) {
  const id = useId();
  return <span className="info-tooltip">
    <button type="button" className="info-tooltip-trigger" aria-label={label} aria-describedby={id}>i</button>
    <span id={id} role="tooltip" aria-hidden="true" className="info-tooltip-content">{text}</span>
  </span>;
}
