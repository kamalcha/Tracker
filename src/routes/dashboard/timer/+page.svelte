<script lang="ts">
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
	} from "lucide-svelte";
	import { invalidateAll } from "$app/navigation";

	// 1. Data from Server (Database Logs)
	let { data } = $props();

	// 2. Your Specific Dummy Task Data
	let dummyTasks = $state([
		{
			id: 1,
			name: "Task 1",
			project: "None",
			status: "Todo",
			completed: false,
		},
		{
			id: 2,
			name: "Task 2",
			project: "Redesign",
			status: "In Progress",
			completed: false,
		},
		{
			id: 3,
			name: "Task 3",
			project: "Development",
			status: "Blocked",
			completed: false,
		},
		{
			id: 4,
			name: "Task 4",
			project: "None",
			status: "Done",
			completed: true,
		},
	]);

	// 3. UI State
	let newTaskName = $state("");
	let editingDay = $state<string | null>(null);
	let editH = $state(0);
	let editM = $state(0);
	let editS = $state(0);
	let activeStatusDropdown = $state<number | null>(null);

	// 4. Derived Logic for 24h Limit
	let totalEditSeconds = $derived(editH * 3600 + editM * 60 + editS);
	let isOverLimit = $derived(totalEditSeconds > 86400);

	// 5. Helpers
	const formatHMS = (totalSeconds: number) => {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		return `${h}h ${m}m ${s}s`;
	};

	const startEditing = (day: any) => {
		editingDay = day.date;
		editH = Math.floor(day.totalSeconds / 3600);
		editM = Math.floor((day.totalSeconds % 3600) / 60);
		editS = day.totalSeconds % 60;
	};

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
</script>

<div class="max-w-4xl mx-auto p-8 space-y-12">
	<header class="space-y-4">
		<h1
			class="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1"
		>
			Daily Focus
		</h1>
		<div class="relative group">
			<input
				type="text"
				bind:value={newTaskName}
				placeholder="What are you working on today?"
				class="w-full h-20 bg-white border-2 border-zinc-100 rounded-[32px] pl-16 pr-6 text-2xl font-bold outline-none focus:border-zinc-900 focus:ring-8 focus:ring-zinc-50 transition-all placeholder:text-zinc-200"
			/>
			<Plus
				class="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900"
				size={28}
			/>
		</div>
	</header>

	<div class="space-y-10">
		{#if !data?.dailyLogs || data.dailyLogs.length === 0}
			<div
				class="flex flex-col items-center justify-center py-24 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-100"
			>
				<div class="p-4 bg-white rounded-2xl shadow-sm mb-4">
					<Calendar class="text-zinc-200" size={32} />
				</div>
				<p class="text-zinc-500 font-bold">No logs found yet.</p>
			</div>
		{:else}
			{#each data.dailyLogs as day}
				<div
					class="bg-white border border-zinc-100 rounded-[40px] shadow-sm overflow-hidden"
				>
					<div
						class="px-8 py-6 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-end"
					>
						<div>
							<h2
								class="text-2xl font-black text-zinc-900 tracking-tight"
							>
								{day.date ===
								new Date().toLocaleDateString("en-CA")
									? "Today"
									: day.date}
							</h2>
							<p
								class="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1"
							>
								{day.entries?.length || 0} Sessions Recorded
							</p>
						</div>

						<div class="flex items-center gap-4">
							<div class="text-right">
								<p
									class="text-[10px] font-black {isOverLimit
										? 'text-red-500'
										: 'text-zinc-400'} uppercase tracking-widest mb-1"
								>
									{isOverLimit
										? "Limit: 24h Max"
										: "Total Logged"}
								</p>

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
										class="text-2xl font-mono font-black text-zinc-900"
									>
										{formatHMS(day.totalSeconds)}
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
											<Pencil
												size={18}
												strokeWidth={2.5}
											/>
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>

					<div class="p-4 space-y-3">
						{#each dummyTasks as task}
							{@const details = getStatusDetails(task.status)}
							<div
								class="flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-3xl hover:border-zinc-300 transition-all group/task"
							>
								<div class="flex items-center gap-5">
									<div
										class="size-12 rounded-2xl {details.bg} flex items-center justify-center {details.color} shrink-0"
									>
										<details.icon
											size={24}
											strokeWidth={2.5}
										/>
									</div>
									<div class="overflow-hidden">
										<h4
											class="font-bold text-zinc-900 text-lg leading-tight truncate"
										>
											{task.name}
										</h4>
										<div
											class="flex items-center gap-1.5 mt-1"
										>
											<Briefcase
												size={12}
												class="text-zinc-400"
											/>
											<span
												class="text-xs font-bold text-zinc-400 uppercase tracking-tighter"
												>{task.project}</span
											>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-4">
									<div class="relative">
										<button
											onclick={() =>
												(activeStatusDropdown =
													activeStatusDropdown ===
													task.id
														? null
														: task.id)}
											class="flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border border-zinc-100 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
										>
											<span
												class="size-1.5 rounded-full {details.color.replace(
													'text',
													'bg',
												)}"
											></span>
											{task.status}
											<ChevronDown
												size={14}
												class="text-zinc-400"
											/>
										</button>

										{#if activeStatusDropdown === task.id}
											<div
												class="absolute right-0 top-full mt-2 w-44 bg-white border border-zinc-100 rounded-2xl shadow-xl z-30 p-1"
											>
												{#each ["Todo", "In Progress", "Blocked", "Done"] as s}
													<button
														class="w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
														onclick={() => {
															task.status = s;
															activeStatusDropdown =
																null;
														}}
													>
														{s}
													</button>
												{/each}
											</div>
										{/if}
									</div>

									<button
										class="p-2 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/task:opacity-100"
									>
										<Trash2 size={20} strokeWidth={2.5} />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
