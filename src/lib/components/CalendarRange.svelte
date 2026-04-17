<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		Calendar as CalendarIcon,
	} from "lucide-svelte";
	import { clickOutside } from "$lib/actions/clickOutside";

	// --- PROPS (Svelte 5) ---
	interface Props {
		rangeStart: Date;
		rangeEnd: Date;
		onRangeComplete?: (start: Date, end: Date) => void;
	}

	let {
		rangeStart = $bindable(),
		rangeEnd = $bindable(),
		onRangeComplete,
	}: Props = $props();

	// --- INTERNAL UI STATE ---
	let isCalendarOpen = $state(false);
	let calendarMonth = $state(new Date(rangeStart));
	let isSelecting = $state(false);
	let activePreset = $state<string | null>("This Week");

	// --- SYNC MONTH WITH PARENT ---
	$effect(() => {
		calendarMonth = new Date(rangeStart);
	});

	// Reset selection state whenever calendar is opened
	$effect(() => {
		if (isCalendarOpen) {
			isSelecting = false;
		}
	});

	// --- PRESET ACTIONS ---
	const selectPreset = (preset: string) => {
		activePreset = preset;
		const today = new Date();
		const tStart = new Date(today.setHours(0, 0, 0, 0));
		
		if (preset === 'Today') {
			rangeStart = new Date(tStart);
			rangeEnd = new Date(today.setHours(23, 59, 59, 999));
		} else if (preset === 'Yesterday') {
			const y = new Date(tStart);
			y.setDate(y.getDate() - 1);
			rangeStart = new Date(y);
			rangeEnd = new Date(new Date(y).setHours(23, 59, 59, 999));
		} else if (preset === 'This Week') {
			const d = tStart.getDay();
			const startOfWeek = new Date(tStart);
			startOfWeek.setDate(tStart.getDate() - d);
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6);
			rangeStart = new Date(startOfWeek);
			rangeEnd = new Date(endOfWeek.setHours(23, 59, 59, 999));
		} else if (preset === 'Last Week') {
			const d = tStart.getDay();
			const startOfWeek = new Date(tStart);
			startOfWeek.setDate(tStart.getDate() - d - 7);
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6);
			rangeStart = new Date(startOfWeek);
			rangeEnd = new Date(endOfWeek.setHours(23, 59, 59, 999));
		} else if (preset === 'This Month') {
			const start = new Date(today.getFullYear(), today.getMonth(), 1);
			const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
			rangeStart = new Date(start);
			rangeEnd = new Date(end);
		} else if (preset === 'Last Month') {
			const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
			rangeStart = new Date(start);
			rangeEnd = new Date(end);
		}

		calendarMonth = new Date(rangeStart);
		isCalendarOpen = false;
		if (onRangeComplete) onRangeComplete(rangeStart, rangeEnd);
	};

	// --- DATE HELPERS (Sunday Start) ---
	let daysInMonth = $derived(() => {
		const year = calendarMonth.getFullYear();
		const month = calendarMonth.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysCount = new Date(year, month + 1, 0).getDate();

		const days = [];
		for (let i = 0; i < firstDay; i++) days.push(null);
		for (let i = 1; i <= daysCount; i++)
			days.push(new Date(year, month, i));
		return days;
	});

	let rangeLabel = $derived(() => {
		const opt: Intl.DateTimeFormatOptions = {
			day: "2-digit",
			month: "short",
			year: "numeric",
		};
		if (rangeStart.toDateString() === rangeEnd.toDateString()) {
			return rangeStart.toLocaleDateString("en-ID", opt);
		}
		const startOpt: Intl.DateTimeFormatOptions = {
			day: "2-digit",
			month: "short",
		};
		return `${rangeStart.toLocaleDateString("en-ID", startOpt)} - ${rangeEnd.toLocaleDateString("en-ID", opt)}`;
	});

	// --- SELECTION LOGIC ---
	const handleDateClick = (date: Date) => {
		activePreset = null; // Clear preset when custom selected
		const clickedDate = new Date(date);
		const startStr = rangeStart.toDateString();
		const clickedStr = clickedDate.toDateString();

		if (!isSelecting) {
			// FIRST CLICK: Always start a fresh selection
			rangeStart = new Date(clickedDate.setHours(0, 0, 0, 0));
			rangeEnd = new Date(clickedDate.setHours(23, 59, 59, 999));
			isSelecting = true;
		} else {
			if (clickedStr === startStr) {
				// Finish Single Day
				isCalendarOpen = false;
				isSelecting = false;
				if (onRangeComplete) onRangeComplete(rangeStart, rangeEnd);
			} else if (clickedDate > rangeStart) {
				// Finish Range
				rangeEnd = new Date(clickedDate.setHours(23, 59, 59, 999));
				isCalendarOpen = false;
				isSelecting = false;
				if (onRangeComplete) onRangeComplete(rangeStart, rangeEnd);
			} else {
				// Reset Start Point
				rangeStart = new Date(clickedDate.setHours(0, 0, 0, 0));
				rangeEnd = new Date(clickedDate.setHours(23, 59, 59, 999));
				isSelecting = true;
			}
		}
	};
</script>

<div class="relative z-50">
	<button
		onclick={() => (isCalendarOpen = !isCalendarOpen)}
		class="px-5 py-2.5 hover:bg-zinc-100 rounded-2xl transition-all flex items-center gap-3 group"
	>
		<CalendarIcon size={16} strokeWidth={2.5} class="text-zinc-500" />
		<span class="text-sm font-bold text-zinc-900 transition-colors">
			{rangeLabel()}
		</span>
	</button>

	{#if isCalendarOpen}
		<div
			use:clickOutside={() => (isCalendarOpen = false)}
			class="absolute top-full left-0 mt-3 bg-white border border-zinc-100 shadow-2xl rounded-[32px] z-[100] w-[460px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex"
		>
			<!-- LEFT SIDEBAR -->
			<div class="w-[140px] border-r border-zinc-100 p-4 space-y-1 bg-zinc-50/50 shrink-0">
				{#each ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month"] as p}
					<button 
						onclick={() => selectPreset(p)}
						class="w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all {activePreset === p ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900'}"
					>
						{p}
					</button>
				{/each}
			</div>

			<!-- RIGHT CALENDAR -->
			<div class="flex-1 p-6 bg-white">
				<div class="flex items-center justify-between mb-4 px-2">
					<span class="text-xs font-black uppercase tracking-widest text-zinc-900">
						{calendarMonth.toLocaleDateString("en-ID", {
							month: "long",
							year: "numeric",
						})}
					</span>
					<div class="flex gap-1">
						<button
							onclick={() =>
								(calendarMonth = new Date(
									calendarMonth.setMonth(
										calendarMonth.getMonth() - 1,
									),
								))}
							class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
							><ChevronLeft size={14} strokeWidth={2.5} /></button
						>
						<button
							onclick={() =>
								(calendarMonth = new Date(
									calendarMonth.setMonth(
										calendarMonth.getMonth() + 1,
									),
								))}
							class="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
							><ChevronRight size={14} strokeWidth={2.5}/></button
						>
					</div>
				</div>

				<div class="grid grid-cols-7 gap-1 text-center mb-1">
					{#each ["S", "M", "T", "W", "T", "F", "S"] as d}
						<span class="text-[10px] font-black text-zinc-300 py-1"
							>{d}</span
						>
					{/each}
				</div>

				<div class="grid grid-cols-7 gap-1 text-center">
					{#each daysInMonth() as date}
						{#if date}
							{@const dateMs = date.setHours(0, 0, 0, 0)}
							{@const startMs = new Date(rangeStart).setHours(
								0,
								0,
								0,
								0,
							)}
							{@const endMs = new Date(rangeEnd).setHours(0, 0, 0, 0)}

							{@const isStart = dateMs === startMs}
							{@const isEnd = dateMs === endMs}
							{@const isBetween = dateMs > startMs && dateMs < endMs}
							{@const isSingle = isStart && isEnd}

							<div class="relative py-0.5">
								{#if isStart || isEnd || isBetween}
									<div
										class="absolute inset-y-0.5 left-0 right-0 bg-zinc-100
										{isStart && !isSingle
											? 'rounded-l-full ml-1'
											: ''}
										{isEnd && !isSingle
											? 'rounded-r-full mr-1'
											: ''}
										{isSingle ? 'rounded-full mx-1' : ''}"
									></div>
								{/if}

								<button
									onclick={() => handleDateClick(date)}
									class="relative z-10 aspect-square w-full flex items-center justify-center text-[11px] font-bold rounded-full transition-all
									{isStart || isEnd
										? 'bg-zinc-900 text-white shadow-lg'
										: 'text-zinc-600 hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-zinc-200'}"
								>
									{date.getDate()}
								</button>
							</div>
						{:else}
							<div class="aspect-square"></div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
