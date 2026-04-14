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
		Search,
	} from "lucide-svelte";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { date } from "drizzle-orm/mysql-core";

	let { data } = $props();

	// UI State
	let newTaskName = $state("");
	let editingDay = $state<string | null>(null);
	let editH = $state(0);
	let editM = $state(0);
	let editS = $state(0);

	// Interactive State
	let activeStatusDropdown = $state<number | null>(null);
	let activeProjectDropdown = $state<number | null>(null);
	let projectSearch = $state("");

	let totalEditSeconds = $derived(editH * 3600 + editM * 60 + editS);
	let isOverLimit = $derived(totalEditSeconds > 86400);

	// Filtered Projects for Dropdown
	let filteredProjects = $derived(
		data.projects.filter(
			(p) =>
				!p.isArchived &&
				p.name.toLowerCase().includes(projectSearch.toLowerCase()),
		),
	);

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

<div class="mx-auto p-8 space-y-12">
	<header class="space-y-4">
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
		{#each data.dailyLogs as day}
			<div class="relative">
				<div class="flex justify-between items-end">
					<div>
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
						<!-- <div>
							<p
								class="text-[10px] font-black {isOverLimit
									? 'text-red-500'
									: 'text-zinc-400'} uppercase tracking-widest mb-1"
							>
								{isOverLimit
									? "Limit: 24h Max"
									: "Total Logged"}
							</p>
							<p
								class="text-2xl font-mono font-black text-zinc-900"
							>
								{formatHMS(day.totalSeconds)}
							</p>
						</div>
						<button
							class="p-1.5 rounded-md border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-900 shadow-sm transition-all"
							><Pencil size={14} strokeWidth={2.5} /></button
						> -->
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
</style>
