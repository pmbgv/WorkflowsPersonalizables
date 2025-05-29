import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'Pendiente':
      return 'secondary';
    case 'Aprobado':
      return 'default';
    case 'Rechazado':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'Pendiente':
      return 'bg-yellow-100 text-yellow-800';
    case 'Aprobado':
      return 'bg-green-100 text-green-800';
    case 'Rechazado':
      return 'bg-red-100 text-red-800';
    case 'Cancelada':
      return 'bg-gray-100 text-gray-800';
    case 'Anulada':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
