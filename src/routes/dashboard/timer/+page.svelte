<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { navigating } from "$app/stores";
	import { timer } from "$lib/timerState.svelte";
	import {
		CircleDashed,
		CircleCheck,
		CircleAlert,
		Loader,
		Plus,
		Trash2,
		Briefcase,
		ChevronDown,
		Calendar,
		Pencil,
		Check,
		X,
		Search,
		ChevronLeft,
		ChevronRight,
	} from "lucide-svelte";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import CalendarRange from "$lib/components/CalendarRange.svelte";

	let { data } = $props();

	// Selection State
	let selectedIds = $state<number[]>([]);
	let selectedDates = $state<string[]>([]);
	let selectedTaskIds = $state<number[]>([]);

	// UI State
	let newTaskName = $state("");
	let editingDay = $state<string | null>(null);
	let editH = $state(0);
	let editM = $state(0);
	let isShaking = $state(false);
	// let rangeStart = $state<Date>(getStartOfWeek(new Date()));
	// let rangeEnd = $state<Date>(getEndOfWeek(new Date()));
	let rangeStart = $state(new Date(data.filters.startDate));
	let rangeEnd = $state(new Date(data.filters.endDate));
	// Update rangeStart/End when data changes (navigation occurs)
	$effect(() => {
		if (data.activeTimer && timer.status === "idle") {
			timer.resume(data.activeTimer.seconds, data.activeTimer.date);
		}
		rangeStart = new Date(data.filters.startDate);
		rangeEnd = new Date(data.filters.endDate);
	});

	// Interactive State
	let activeStatusDropdown = $state<number | null>(null);
	let activeProjectDropdown = $state<number | null>(null);
	let projectSearch = $state("");

	let totalEditSeconds = $derived(editH * 3600 + editM * 60);
	let isOverLimit = $derived(totalEditSeconds > 86400);

	// 1. CALCULATE SAVED TIME SUMMARY
	// let weekTotalSeconds = $derived(
	// 	data.dailyLogs.reduce((acc, day) => acc + day.totalSeconds, 0),
	// );
	// Use headerWeekTotal from server (Saved time only)
	let weekTotalDisplay = $derived(data.headerWeekTotal);
	// let formattedWeekTotal = $derived(() => {
	// 	const h = Math.floor(weekTotalSeconds / 3600);
	// 	const m = Math.floor((weekTotalSeconds % 3600) / 60);
	// 	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
	// });

	// Filtered Projects for Dropdown
	let filteredProjects = $derived(
		data.projects.filter(
			(p) =>
				!p.isArchived &&
				p.name.toLowerCase().includes(projectSearch.toLowerCase()),
		),
	);

	interface DayLog {
		date: string;
		totalSeconds: number;
		isManual: boolean;
		calculatedSum: number;
		entries: any[];
		dayTasks: any[]; // You can use your Task type here if you have it
	}

	// Grab browser timezone for the server
	onMount(() => {
		const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		document.cookie = `user_timezone=${userTz}; path=/; max-age=31536000; SameSite=Lax`;
	});

	// Helper for Today's Date String
	const todayStr = new Date().toLocaleDateString("en-CA");

	const formatHMS = (totalSeconds: number) => {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		return `${h}h ${m}m`;
	};

	const startEditing = (day: any) => {
		editingDay = day.date;
		editH = Math.floor(day.totalSeconds / 3600);
		editM = Math.floor((day.totalSeconds % 3600) / 60);
	};

	// Helper to find today's specific log card
	const getTodayLog = () => {
		const todayStr = new Date().toLocaleDateString("en-CA");
		return data.dailyLogs.find((day) => day.date === todayStr);
	};

	// Live Total Helper: Combines DB time + current live session if Today
	const getLiveTotal = (day: any) => {
		let total = day.totalSeconds;
		// If this is the "Today" card and the timer is running, add live seconds
		if (day.date === todayStr && timer.status === "working") {
			total += timer.seconds;
		}
		return total;
	};

	// --- DATE HELPERS ---
	function getStartOfWeek(d: Date) {
		const date = new Date(d);
		const day = date.getDay(); // 0 is Sunday
		const diff = date.getDate() - day;
		return new Date(new Date(date.setDate(diff)).setHours(0, 0, 0, 0));
	}

	function getEndOfWeek(d: Date) {
		const start = getStartOfWeek(d);
		return new Date(
			new Date(start.setDate(start.getDate() + 6)).setHours(
				23,
				59,
				59,
				999,
			),
		);
	}

	const updateTimeWindow = (start: Date, end: Date) => {
		const s = start.toLocaleDateString("en-CA");
		const e = end.toLocaleDateString("en-CA");
		goto(`?start=${s}&end=${e}`, { keepFocus: true, noScroll: true });
	};

	// Navigation functions
	// const goPrevWeek = () => {
	// 	rangeStart = new Date(rangeStart.setDate(rangeStart.getDate() - 7));
	// 	rangeEnd = new Date(rangeEnd.setDate(rangeEnd.getDate() - 7));
	// };
	const goPrevWeek = () => {
		const s = new Date(rangeStart);
		const e = new Date(rangeEnd);
		s.setDate(s.getDate() - 7);
		e.setDate(e.getDate() - 7);
		updateTimeWindow(s, e);
	};

	// const goNextWeek = () => {
	// 	const nextS = new Date(
	// 		new Date(rangeStart).setDate(rangeStart.getDate() + 7),
	// 	);
	// 	const nextE = new Date(
	// 		new Date(rangeEnd).setDate(rangeEnd.getDate() + 7),
	// 	);
	// 	if (nextS > new Date()) return;
	// 	rangeStart = nextS;
	// 	rangeEnd = nextE;
	// };
	const goNextWeek = () => {
		const s = new Date(rangeStart);
		const e = new Date(rangeEnd);
		s.setDate(s.getDate() + 7);
		e.setDate(e.getDate() + 7);
		if (s > new Date()) return;
		updateTimeWindow(s, e);
	};

	// const goToday = () => {
	// 	const today = new Date();
	// 	const tStart = getStartOfWeek(today);
	// 	const tEnd = getEndOfWeek(today);
	// 	if (
	// 		rangeStart.toDateString() === tStart.toDateString() &&
	// 		rangeEnd.toDateString() === tEnd.toDateString()
	// 	) {
	// 		triggerShake();
	// 		return;
	// 	}
	// 	rangeStart = tStart;
	// 	rangeEnd = tEnd;
	// };
	const goToday = () => {
		const today = new Date();
		const tStart = getStartOfWeek(today);
		if (rangeStart.toDateString() === tStart.toDateString()) {
			triggerShake();
			return;
		}
		goto("?", { noScroll: true }); // Clearing params triggers server default (Current Week)
	};

	// let filteredLogs = $derived(() => {
	// 	return data.dailyLogs.filter((log) => {
	// 		const d = new Date(log.date);
	// 		return d >= rangeStart && d <= rangeEnd;
	// 	});
	// });

	const triggerShake = () => {
		isShaking = false;
		setTimeout(() => {
			isShaking = true;
			setTimeout(() => {
				isShaking = false;
			}, 300);
		}, 10);
	};

	const isFutureBlocked = $derived(
		new Date(new Date(rangeStart).setDate(rangeStart.getDate() + 7)) >
			new Date(),
	);

	async function saveManualTime(dayDate: string) {
		if (isOverLimit) return;
		await fetch("/api/timer", {
			method: "POST",
			body: JSON.stringify({
				action: "manual_save",
				date: dayDate,
				totalSeconds: totalEditSeconds,
			}),
		});
		editingDay = null;
		await invalidateAll();
	}

	const isToday = (dateStr: string) => {
		return dateStr === new Date().toLocaleDateString("en-CA");
	};

	const getStatusDetails = (status: string) => {
		switch (status) {
			case "In Progress":
				return {
					icon: Loader,
					color: "text-blue-500",
					bg: "bg-blue-50",
				};
			case "Blocked":
				return {
					icon: CircleAlert,
					color: "text-amber-500",
					bg: "bg-amber-50",
				};
			case "Done":
				return {
					icon: CircleCheck,
					color: "text-emerald-500",
					bg: "bg-emerald-50",
				};
			default:
				return {
					icon: CircleDashed,
					color: "text-slate-400",
					bg: "bg-slate-50",
				};
		}
	};

	// Helper for date-level selection
	function toggleDay(date: string, tasks: any[]) {
		const taskIds = tasks.map((t) => t.id);
		const isDateSelected = selectedDates.includes(date);
		const allSelected = taskIds.every((id) => selectedIds.includes(id));
		if (isDateSelected) {
			selectedDates = selectedDates.filter((d) => d !== date);
			selectedTaskIds = selectedTaskIds.filter(
				(id) => !taskIds.includes(id),
			);
		} else {
			selectedDates = [...selectedDates, date];
			selectedTaskIds = [...new Set([...selectedTaskIds, ...taskIds])];
		}
	}

	function toggleTask(id: number) {
		selectedTaskIds = selectedTaskIds.includes(id)
			? selectedTaskIds.filter((i) => i !== id)
			: [...selectedTaskIds, id];
	}

	// 1. PARSE BASE TIME: Convert "HH:MM" string from server to total seconds
	const parseHHMMToSeconds = (hhmm: string) => {
		const [h, m] = hhmm.split(":").map(Number);
		return h * 3600 + m * 60;
	};

	// 2. LIVE DERIVED TOTAL: Combines DB time + current active timer
	let baseSeconds = $derived(parseHHMMToSeconds(data.headerWeekTotal));
	let totalLiveSeconds = $derived(baseSeconds + timer.seconds);

	// 3. FORMAT BACK TO HH:MM: This updates the UI every minute
	let liveWeekTotalDisplay = $derived(() => {
		const h = Math.floor(totalLiveSeconds / 3600);
		const m = Math.floor((totalLiveSeconds % 3600) / 60);
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
	});
</script>

{#snippet DayCard(day: DayLog)}
	<div class="relative">
		<div class="flex justify-between items-end">
			<div class="flex items-center gap-4">
				<button
					onclick={() => toggleDay(day.date, day.dayTasks)}
					class="size-6 rounded-lg border-2 flex items-center justify-center transition-all {selectedDates.includes(
						day.date,
					)
						? 'bg-zinc-900 border-zinc-900 text-white shadow-lg'
						: 'border-zinc-200 text-transparent hover:border-zinc-900'}"
				>
					<Check size={14} strokeWidth={4} />
				</button>
				<h2 class="text-xl font-black text-zinc-900">
					{day.date === todayStr ? "Today, " : ""}
					<span
						class="date-label {day.date === todayStr
							? 'text-sm font-medium text-zinc-400'
							: ''}"
					>
						{new Date(day.date).toLocaleDateString("en-ID", {
							day: "2-digit",
							month: day.date === todayStr ? "long" : "short",
							year: "numeric",
						})}
					</span>
				</h2>
			</div>

			<!-- <div class="flex items-center gap-4 text-right">
				<div class="text-right">
					<p
						class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
					>
						Total Logged
					</p>
					<p class="text-2xl font-mono font-black text-zinc-900">
						{formatHMS(getLiveTotal(day))}
					</p>
				</div>
			</div> -->
			<div class="flex items-center gap-4">
				<div class="text-right">
					{#if editingDay === day.date}
						<div
							class="flex items-center gap-1 font-mono font-black text-2xl"
						>
							<input
								type="number"
								bind:value={editH}
								class="w-12 bg-white border {isOverLimit
									? 'border-red-500'
									: 'border-zinc-200'} rounded-lg text-center"
							/>
							<span class="text-xs">h</span>
							<input
								type="number"
								bind:value={editM}
								class="w-12 bg-white border {isOverLimit
									? 'border-red-500'
									: 'border-zinc-200'} rounded-lg text-center"
							/>
							<span class="text-xs">m</span>
						</div>
					{:else}
						<p
							class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
						>
							Total Logged
						</p>
						<p class="text-2xl font-mono font-black text-zinc-900">
							{formatHMS(getLiveTotal(day))}
						</p>
					{/if}
				</div>

				<div class="flex gap-2">
					{#if editingDay === day.date}
						<button
							onclick={() => (editingDay = null)}
							class="p-2.5 rounded-xl border border-zinc-200 text-zinc-400 hover:text-red-500 transition-all"
						>
							<X size={18} strokeWidth={2.5} />
						</button>
					{/if}

					{#if timer.status === "idle"}
						<button
							onclick={() =>
								editingDay === day.date
									? saveManualTime(day.date)
									: startEditing(day)}
							disabled={isOverLimit && editingDay === day.date}
							class="p-2.5 rounded-xl border border-zinc-200 bg-white {isOverLimit &&
							editingDay === day.date
								? 'opacity-20'
								: 'text-zinc-400 hover:text-zinc-900'} transition-all shadow-sm"
						>
							{#if editingDay === day.date}
								<Check
									size={18}
									strokeWidth={3}
									class="text-emerald-500"
								/>
							{:else}
								<Pencil size={18} strokeWidth={2.5} />
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<div class="py-4 space-y-3">
			{#each day.dayTasks as task (task.id)}
				{@const details = getStatusDetails(task.status)}
				<div
					class="flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 transition-all group/task"
				>
					<div class="flex items-center gap-5">
						<button
							onclick={() => toggleTask(task.id)}
							class="size-6 rounded-lg border-2 flex items-center justify-center transition-all {selectedTaskIds.includes(
								task.id,
							)
								? 'bg-zinc-900 border-zinc-900 text-white'
								: 'border-zinc-100 text-transparent group-hover/task:border-zinc-400'}"
						>
							<Check size={14} strokeWidth={4} />
						</button>
						<div>
							<h4 class="font-bold text-zinc-900">{task.name}</h4>
							<div
								class="relative flex items-center gap-1.5 mt-1"
							>
								<button
									onclick={() => {
										activeStatusDropdown = null;
										activeProjectDropdown =
											activeProjectDropdown === task.id
												? null
												: task.id;
									}}
									class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-100 text-[10px] font-bold uppercase text-zinc-500 hover:border-zinc-900"
								>
									<Briefcase size={12} />
									<span
										>{task.projectName ||
											"Unassigned"}</span
									>
									<ChevronDown size={10} />
								</button>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-4">
						<div class="relative">
							<button
								onclick={() => {
									activeProjectDropdown = null;
									activeStatusDropdown =
										activeStatusDropdown === task.id
											? null
											: task.id;
								}}
								class="flex items-center gap-2 text-xs font-bold {details.color}"
							>
								<details.icon size={14} strokeWidth={2.5} />
								{task.status}
								<ChevronDown size={14} />
							</button>
						</div>
						<form action="?/deleteTasks" method="POST" use:enhance>
							<input type="hidden" name="ids" value={task.id} />
							<button
								type="submit"
								class="p-2 text-zinc-200 hover:text-red-500 transition-all opacity-0 group-hover/task:opacity-100"
							>
								<Trash2 size={20} />
							</button>
						</form>
					</div>
				</div>
			{/each}

			{#if day.dayTasks.length === 0}
				<div
					class="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-100 rounded-[32px] bg-zinc-50/30"
				>
					<p
						class="text-[10px] font-black text-zinc-400 uppercase tracking-widest"
					>
						No tasks created for this day
					</p>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<div class="mx-auto p-8 space-y-12">
	{#if selectedTaskIds.length > 0 || selectedDates.length > 0}
		<div
			class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-8 py-4 rounded-[32px] shadow-2xl z-[100] flex items-center gap-10 animate-in slide-in-from-bottom-8 duration-500"
		>
			<div class="flex-1 min-w-0 flex-col">
				<span class="text-sm leading-snug">
					{#if selectedDates.length === 1}
						Are you sure you want to delete {selectedDates[0]} log? Deleting
						this will also removes all tasks related to it. This cannot
						be undone.
					{:else if selectedDates.length > 1}
						Are you sure you want to delete these logs? Deleting
						them will also remove all tasks related to them. This
						cannot be undone.
					{:else}
						Are you sure you want to delete {selectedTaskIds.length}
						selected tasks?
					{/if}
				</span>
			</div>
			<div class="shrink-0 flex items-center gap-3">
				<form
					action="?/deleteBulk"
					method="POST"
					use:enhance={() => {
						if (selectedDates.includes(todayStr)) {
							timer.reset();
						}
						return async ({ update }) => {
							selectedTaskIds = [];
							selectedDates = [];
							await update();
						};
					}}
				>
					<input
						type="hidden"
						name="taskIds"
						value={selectedTaskIds.join(",")}
					/>
					<input
						type="hidden"
						name="wipeDates"
						value={selectedDates.join(",")}
					/>
					<button
						type="submit"
						class="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-2xl text-[10px] font-black uppercase transition-all"
					>
						<Trash2 size={14} /> Delete Selection
					</button>
				</form>
				<button
					onclick={() => {
						selectedTaskIds = [];
						selectedDates = [];
					}}
					class="p-2 hover:bg-zinc-800 rounded-xl transition-all"
					><X size={20} /></button
				>
			</div>
		</div>
	{/if}

	<header class="sticky-header py-4 border-b border-zinc-50">
		<div class="relative group">
			<form
				action="?/createTask"
				method="POST"
				use:enhance={({ formData, cancel }) => {
					const name = formData.get("name")?.toString();

					// 1. Prevent empty creation
					if (!name || name.trim() === "") {
						cancel();
						return;
					}

					// 2. The "Morning Trigger" Check
					const todayLog = getTodayLog();
					const isFirstTask =
						!todayLog || todayLog.dayTasks.length === 0;

					// 3. Start Global Timer only if first task and idle
					if (isFirstTask && timer.status === "idle") {
						timer.start();
					}

					// Reset input after submission
					return async ({ update }) => {
						newTaskName = "";
						await update();
					};
				}}
				class="relative group"
			>
				<input
					type="text"
					name="name"
					bind:value={newTaskName}
					placeholder="What are you working on today?"
					class="w-full h-20 bg-white border-2 border-zinc-100 rounded-[32px] pl-16 pr-6 text-2xl font-bold outline-none focus:border-zinc-900 focus:ring-8 focus:ring-zinc-50 transition-all placeholder:text-zinc-200"
				/>
				<Plus
					class="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900"
					size={28}
				/>
				<button type="submit" class="hidden"></button>
			</form>
		</div>
	</header>

	{#if $navigating}
		<div class="fixed top-0 left-0 right-0 h-1 z-[200] overflow-hidden">
			<div class="h-full bg-zinc-900 animate-progress"></div>
		</div>
	{/if}
	<nav class="relative flex items-center gap-4 py-2">
		<div
			class="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-4xl"
		>
			<button
				onclick={goPrevWeek}
				class="p-2 transition-all text-zinc-400 hover:text-zinc-900"
			>
				<ChevronLeft size={20} />
			</button>
			<CalendarRange
				bind:rangeStart
				bind:rangeEnd
				onRangeComplete={(s, e) => updateTimeWindow(s, e)}
			/>
			<button
				onclick={goNextWeek}
				disabled={isFutureBlocked}
				class="p-2 transition-all text-zinc-400 hover:text-zinc-900 disabled:opacity-20"
			>
				<ChevronRight size={20} />
			</button>
		</div>
		<button
			onclick={goToday}
			class="px-5 py-2 bg-zinc-900 text-white rounded-4xl text-[14px] transition-all hover:bg-zinc-800 {isShaking
				? 'shake-anim'
				: ''}"
		>
			Today
		</button>
		<span class="text-[14px]">
			Week Total {liveWeekTotalDisplay()}
		</span>
	</nav>

	<div class="space-y-10">
		{#each data.dailyLogs as day}
			<!-- <div class="relative">
				<div class="flex justify-between items-end">
					<div class="flex items-center gap-4">
						<button
							onclick={() => toggleDay(day.date, day.dayTasks)}
							class="size-6 rounded-lg border-2 flex items-center justify-center transition-all {selectedDates.includes(
								day.date,
							)
								? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200'
								: 'border-zinc-200 text-transparent hover:border-zinc-900'}"
						>
							<Check size={14} strokeWidth={4} />
						</button>
						<h2 class="text-xl font-black text-zinc-900">
							{#if day.date === new Date().toLocaleDateString("en-CA")}
								<span class="day-label">Today, </span>
								<span
									class="date-label text-sm font-medium text-zinc-400"
								>
									{new Date(day.date).toLocaleDateString(
										"en-ID",
										{
											day: "2-digit",
											month: "long",
											year: "numeric",
										},
									)}
								</span>
							{:else}
								<span class="date-label">
									{new Date(day.date).toLocaleDateString(
										"en-ID",
										{
											day: "2-digit",
											month: "short",
											year: "numeric",
										},
									)}
								</span>
							{/if}
						</h2>
					</div>
					<div class="flex items-center gap-4">
						<div class="text-right">
							{#if editingDay === day.date}
								<div
									class="flex items-center gap-1 font-mono font-black text-2xl"
								>
									<input
										type="number"
										bind:value={editH}
										class="w-12 bg-white border {isOverLimit
											? 'border-red-500'
											: 'border-zinc-200'} rounded-lg text-center outline-none"
									/>
									<span class="text-xs">h</span>
									<input
										type="number"
										bind:value={editM}
										class="w-12 bg-white border {isOverLimit
											? 'border-red-500'
											: 'border-zinc-200'} rounded-lg text-center outline-none"
									/>
									<span class="text-xs">m</span>
									<input
										type="number"
										bind:value={editS}
										class="w-12 bg-white border {isOverLimit
											? 'border-red-500'
											: 'border-zinc-200'} rounded-lg text-center outline-none"
									/>
									<span class="text-xs">s</span>
								</div>
							{:else}
								<p
									class="text-[10px] font-black uppercase tracking-widest mb-1
            {timer.isOverTime && isToday(day.date)
										? 'text-amber-500'
										: 'text-zinc-400'}"
								>
									{timer.isOverTime && isToday(day.date)
										? "Session Over 12h"
										: "Total Logged"}
								</p>
								<p
									class="text-2xl font-mono font-black transition-colors duration-500
        {timer.isOverTime && isToday(day.date)
										? 'text-amber-600'
										: 'text-zinc-900'}"
								>
									{formatHMS(getLiveTotal(day))}
								</p>
							{/if}
						</div>
						<div class="flex gap-2">
							{#if editingDay === day.date}
								<button
									onclick={() => (editingDay = null)}
									class="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-red-500 transition-all shadow-sm"
								>
									<X size={18} strokeWidth={2.5} />
								</button>
							{/if}

							{#if timer.status === "idle"}
								<button
									onclick={() =>
										editingDay === day.date
											? saveManualTime(day.date)
											: startEditing(day)}
									disabled={isOverLimit &&
										editingDay === day.date}
									class="p-2.5 rounded-xl border border-zinc-200 bg-white {isOverLimit &&
									editingDay === day.date
										? 'opacity-20'
										: 'text-zinc-400 hover:text-zinc-900 hover:border-zinc-900'} transition-all shadow-sm"
								>
									{#if editingDay === day.date}
										<Check
											size={18}
											strokeWidth={3}
											class="text-emerald-500"
										/>
									{:else}
										<Pencil size={18} strokeWidth={2.5} />
									{/if}
								</button>
							{/if}
						</div>
					</div>
				</div>

				<div class="py-4 space-y-3">
					{#each day.dayTasks as task (task.id)}
						{@const details = getStatusDetails(task.status)}
						<div
							class="flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 transition-all group/task"
						>
							<div class="flex items-center gap-5">
								<button
									onclick={() => toggleTask(task.id)}
									class="size-6 rounded-lg border-2 flex items-center justify-center transition-all {selectedTaskIds.includes(
										task.id,
									)
										? 'bg-zinc-900 border-zinc-900 text-white'
										: 'border-zinc-100 text-transparent group-hover/task:border-zinc-400'}"
								>
									<Check size={14} strokeWidth={4} />
								</button>
								<div class="overflow-visible">
									<h4
										class="font-bold text-zinc-900 leading-tight truncate"
									>
										{task.name}
									</h4>

									<div
										class="relative flex items-center gap-1.5 mt-1"
									>
										<button
											onclick={() => {
												activeStatusDropdown = null;
												activeProjectDropdown =
													activeProjectDropdown ===
													task.id
														? null
														: task.id;
											}}
											class="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full border border-zinc-100 text-[10px] font-bold uppercase text-zinc-500 hover:border-zinc-900 transition-all"
										>
											<Briefcase size={12} />
											<span
												class="uppercase tracking-tighter"
												>{task.projectName ||
													"Unassigned"}</span
											>
											<ChevronDown size={10} />
										</button>

										{#if activeProjectDropdown === task.id}
											<div
												class="absolute top-full left-0 mt-2 w-56 bg-white border border-zinc-100 shadow-2xl rounded-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
											>
												<div
													class="p-2 border-b border-zinc-50 flex gap-2 bg-zinc-50"
												>
													<Search
														size={12}
														class="text-zinc-400"
													/>
													<input
														type="text"
														bind:value={
															projectSearch
														}
														placeholder="Filter projects..."
														class="bg-transparent text-xs outline-none w-full font-bold"
													/>
												</div>
												<div
													class="max-h-48 overflow-auto py-1 scrollbar-thin"
												>
													<form
														action="?/updateTask"
														method="POST"
														use:enhance={() => {
															activeProjectDropdown =
																null;
															projectSearch = "";
														}}
													>
														<input
															type="hidden"
															name="id"
															value={task.id}
														/><input
															type="hidden"
															name="projectId"
															value=""
														/>
														<button
															type="submit"
															class="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-50 text-zinc-400 italic"
															>None</button
														>
													</form>
													{#each filteredProjects as p}
														<form
															action="?/updateTask"
															method="POST"
															use:enhance={() => {
																activeProjectDropdown =
																	null;
																projectSearch =
																	"";
															}}
														>
															<input
																type="hidden"
																name="id"
																value={task.id}
															/><input
																type="hidden"
																name="projectId"
																value={p.id}
															/>
															<button
																type="submit"
																class="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-50 truncate transition-colors"
																>{p.name}</button
															>
														</form>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								</div>
							</div>

							<div class="flex items-center gap-4">
								<div class="relative">
									<button
										onclick={() => {
											activeProjectDropdown = null;
											activeStatusDropdown =
												activeStatusDropdown === task.id
													? null
													: task.id;
										}}
										class="flex items-center gap-2 text-xs font-bold {details.color} hover:opacity-70 transition-all"
									>
										<details.icon
											size={14}
											strokeWidth={2.5}
										/>
										{task.status}
										<ChevronDown
											size={14}
											class="text-zinc-400"
										/>
									</button>

									{#if activeStatusDropdown === task.id}
										<div
											class="absolute right-0 top-full mt-2 w-40 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-[60] p-1 animate-in fade-in slide-in-from-top-1 duration-200"
										>
											{#each ["Todo", "In Progress", "Blocked", "Done"] as s}
												<form
													action="?/updateTask"
													method="POST"
													use:enhance={() => {
														activeStatusDropdown =
															null;
													}}
												>
													<input
														type="hidden"
														name="id"
														value={task.id}
													/><input
														type="hidden"
														name="status"
														value={s}
													/>
													<button
														type="submit"
														class="w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
														>{s}</button
													>
												</form>
											{/each}
										</div>
									{/if}
								</div>

								<form
									action="?/deleteTasks"
									method="POST"
									use:enhance
								>
									<input
										type="hidden"
										name="ids"
										value={task.id}
									/>
									<button
										type="submit"
										class="p-2 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/task:opacity-100"
									>
										<Trash2 size={20} strokeWidth={2.5} />
									</button>
								</form>
							</div>
						</div>
					{:else}
						<div
							class="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-100 rounded-[32px] bg-zinc-50/30"
						>
							<div
								class="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-3 text-zinc-200"
							>
								<Calendar size={24} />
							</div>
							<p
								class="text-[10px] font-black text-zinc-400 uppercase tracking-widest"
							>
								No tasks created for this day
							</p>
						</div>
					{/each}
				</div>
			</div> -->
			{@render DayCard(day)}
		{/each}
		{#if data.dailyLogs.length === 0}
			<div
				class="py-20 text-center border-2 border-dashed border-zinc-100 rounded-[40px]"
			>
				<p
					class="text-xs font-black uppercase tracking-widest text-zinc-300"
				>
					No time logged in the selected range
				</p>
			</div>
		{/if}

		{#if data.isFiltered && data.currentWeekLogs && data.currentWeekLogs.length > 0}
			<hr class="border-zinc-100 my-16" />

			{#each data.currentWeekLogs as day}
				{@render DayCard(day)}
			{/each}
		{/if}
	</div>
</div>

<style>
	:global(.scrollbar-thin::-webkit-scrollbar) {
		width: 4px;
	}
	:global(.scrollbar-thin::-webkit-scrollbar-thumb) {
		background: #f4f4f5;
		border-radius: 10px;
	}

	/* Soft Shake Animation */
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-2px);
		}
		40%,
		80% {
			transform: translateX(2px);
		}
	}
	.shake-anim {
		animation: shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
	}

	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: white;
	}

	@keyframes progress {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
	.animate-progress {
		width: 100%;
		animation: progress 1.5s infinite ease-in-out;
	}
</style>
