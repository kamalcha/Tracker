import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
	CircleDashed,
	CircleCheck,
	CircleAlert,
	Loader,
} from "lucide-svelte";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export const getStatusDetails = (status: string) => {
	switch (status) {
		case "In Progress":
			return { icon: Loader, color: "text-blue-500", bg: "bg-blue-50" };
		case "Blocked":
			return { icon: CircleAlert, color: "text-amber-500", bg: "bg-amber-50" };
		case "Done":
			return { icon: CircleCheck, color: "text-emerald-500", bg: "bg-emerald-50" };
		default:
			return { icon: CircleDashed, color: "text-slate-400", bg: "bg-slate-50" };
	}
};

export const formatHMS = (totalSeconds: number) => {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	return `${h}h ${m}m`;
};

export function getStartOfWeek(d: Date) {
	const date = new Date(d);
	const day = date.getDay(); // 0 is Sunday
	const diff = date.getDate() - day;
	return new Date(new Date(date.setDate(diff)).setHours(0, 0, 0, 0));
}

export function getEndOfWeek(d: Date) {
	const start = getStartOfWeek(d);
	return new Date(new Date(start.setDate(start.getDate() + 6)).setHours(23, 59, 59, 999));
}
