import { BrainCircuit } from 'lucide-react';

interface BrandLogoProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandLogo({ compact = false, inverse = false }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl'} bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-soft`}>
        <BrainCircuit className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
      </span>
      <span className={`text-lg font-bold tracking-tight ${inverse ? 'text-white' : 'text-navy-900 dark:text-white'}`}>
        Resume<span className="text-brand-600 dark:text-brand-300">AI</span>
      </span>
    </span>
  );
}
