import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-card rounded-lg shadow-md border border-border p-6 ${className}`}>
      {children}
    </div>
  );
}
