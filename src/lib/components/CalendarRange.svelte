<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		Calendar as CalendarIcon,
	} from "lucide-svelte";
	import { clickOutside } from "$lib/actions/clickOutside";

	// --- PROPS (Svelte 5) ---
	// We use "bindable" so the parent (Timer Page) updates automatically
	let { rangeStart = $bindable(), rangeEnd = $bindable() } = $props();

	// --- INTERNAL UI STATE ---
	let isCalendarOpen = $state(false);
	let calendarMonth = $state(new Date(rangeStart));
	let isSelecting = $state(false);

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

	// --- DATE HELPERS (Sunday Start) --- [cite: 18-20]
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

	// --- SELECTION LOGIC --- [cite: 27]
	const handleDateClick = (date: Date) => {
		const clickedDate = new Date(date);

		if (!isSelecting) {
			// FIRST CLICK: Always start a fresh selection
			rangeStart = new Date(clickedDate.setHours(0, 0, 0, 0));
			rangeEnd = new Date(clickedDate.setHours(23, 59, 59, 999));
			isSelecting = true;
		} else {
			// SECOND CLICK: Decide whether to close or extend
			if (clickedDate.toDateString() === rangeStart.toDateString()) {
				// Clicked same date: Close as single day
				isCalendarOpen = false;
				isSelecting = false;
			} else if (clickedDate > rangeStart) {
				// Clicked later date: Complete range and close
				rangeEnd = new Date(clickedDate.setHours(23, 59, 59, 999));
				isCalendarOpen = false;
				isSelecting = false;
			} else {
				// Clicked earlier date: Treat as new start point
				rangeStart = new Date(clickedDate.setHours(0, 0, 0, 0));
				rangeEnd = new Date(clickedDate.setHours(23, 59, 59, 999));
				isSelecting = true;
			}
		}
	};
</script>

<div class="relative">
	<button
		onclick={() => (isCalendarOpen = !isCalendarOpen)}
		class="px-4 py-2 hover:bg-zinc-50 rounded-2xl transition-all flex items-center gap-2 group"
	>
		<span
			class="text-sm font-black uppercase tracking-widest text-zinc-900 group-hover:text-zinc-500 transition-colors"
		>
			{rangeLabel()}
		</span>
		<CalendarIcon size={14} class="text-zinc-400" />
	</button>

	{#if isCalendarOpen}
		<div
			use:clickOutside={() => (isCalendarOpen = false)}
			class="absolute top-full left-0 mt-4 p-6 bg-white border border-zinc-100 shadow-2xl rounded-[32px] z-[100] w-80 animate-in fade-in zoom-in-95 duration-200"
		>
			<div class="flex items-center justify-between mb-4 px-2">
				<span class="text-xs font-black uppercase tracking-widest">
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
						class="p-1 hover:bg-zinc-100 rounded-lg"
						><ChevronLeft size={14} /></button
					>
					<button
						onclick={() =>
							(calendarMonth = new Date(
								calendarMonth.setMonth(
									calendarMonth.getMonth() + 1,
								),
							))}
						class="p-1 hover:bg-zinc-100 rounded-lg"
						><ChevronRight size={14} /></button
					>
				</div>
			</div>

			<div class="grid grid-cols-7 gap-1 text-center">
				{#each ["S", "M", "T", "W", "T", "F", "S"] as d}
					<span class="text-[10px] font-black text-zinc-300 py-2"
						>{d}</span
					>
				{/each}

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
									: 'text-zinc-600 hover:bg-zinc-200/50'}"
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
	{/if}
</div>
