import { useState } from 'react';
import { useToast } from '../state/toast';
import { copyText } from './clipboard';

export function CopyButton({ text, label = 'Copier', className = 'btn btn--secondary' }: { text: string; label?: string; className?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
          toast('Message copié. À vous de jouer, on n’envoie rien à votre place.');
        } else {
          toast('Copie impossible : sélectionnez le texte à la main.');
        }
      }}
    >
      {copied ? 'Copié ✓' : label}
    </button>
  );
}
