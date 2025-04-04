import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export const boatStatusOptions = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" },
];

export const boatTypeOptions = [
  { value: "Superyacht", label: "Superyacht" },
  { value: "Yacht", label: "Yacht" },
  { value: "Lancha", label: "Lancha" },
  { value: "Jet ski", label: "Jet ski" },
  { value: "Veleiro", label: "Veleiro" },
  { value: "Catamarã", label: "Catamarã" },
  { value: "Offshore", label: "Offshore" },
  { value: "Outro", label: "Outro" },
];

export const fuelTypeOptions = [
  { value: "Gasolina", label: "Gasolina" },
  { value: "Diesel", label: "Diesel" },
];

export const yesNoOptions = [
  { value: true, label: "Sim" },
  { value: false, label: "Não" },
];

export const dayPeriods = [
  { id: 'morning', label: 'Manhã' },
  { id: 'afternoon', label: 'Tarde' },
  { id: 'night', label: 'Noite' },
];
