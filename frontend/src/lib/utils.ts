import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  onboarded: "Onboarded",
  active: "Active",
  returning: "Returning",
  alumni: "Alumni",
  ambassador: "Ambassador",
};

export const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700",
  onboarded: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  returning: "bg-yellow-100 text-yellow-700",
  alumni: "bg-purple-100 text-purple-700",
  ambassador: "bg-orange-100 text-orange-700",
};
