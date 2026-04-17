<script lang="ts">
	import {
		Download,
		ChevronLeft,
		ChevronRight,
		Briefcase,
		Loader,
		CircleAlert,
		CircleCheck,
		CircleDashed,
		BarChart3,
	} from "lucide-svelte";
	import CalendarRange from "$lib/components/CalendarRange.svelte";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { BarChart } from "layerchart";
	import { goto } from "$app/navigation";
	import { getStatusDetails, getStartOfWeek, getEndOfWeek } from "$lib/utils";

	let { data } = $props();

	// --- State ---
	// Date Filters
	let rangeStart = $state(new Date(data.filters.startDate));
	let rangeEnd = $state(new Date(data.filters.endDate));

	$effect(() => {
		rangeStart = new Date(data.filters.startDate);
		rangeEnd = new Date(data.filters.endDate);
	});

	// Summary Stats
	let totalLoggedTime = $derived(data.totalLoggedTime);
	let avgDailyHours = $derived(data.avgDailyHours);

	// Helper to format decimal time to "Xh Xm"
	function formatDecimalHours(decimalValue: number): string {
		if (decimalValue === 0) return "0h";

		const hours = Math.floor(decimalValue);
		const minutes = Math.round((decimalValue - hours) * 60);

		let formatted = "";
		if (hours > 0) formatted += `${hours}h`;
		if (minutes > 0) {
			if (formatted.length > 0) formatted += " ";
			formatted += `${minutes}m`;
		}

		return formatted || "0h";
	}

	const chartData = $derived(data.chartData);
	let isChartEmpty = $derived(chartData.every((d) => d.logged === 0));

	const chartConfig = {
		logged: {
			label: "Total Hours",
			color: "var(--color-zinc-900)",
		},
	} satisfies Chart.ChartConfig;

	// Breakdown Toggle
	let breakdownGroupBy = $state<"Projects" | "Tasks">("Projects");

	// Collapsible & Animation State
	let expandedProjects = $state<(number | null)[]>([]);
	let isShaking = $state(false);

	const triggerShake = () => {
		isShaking = false;
		setTimeout(() => {
			isShaking = true;
			setTimeout(() => {
				isShaking = false;
			}, 300);
		}, 10);
	};

	function toggleProject(id: number | null) {
		if (expandedProjects.includes(id)) {
			expandedProjects = expandedProjects.filter((p) => p !== id);
		} else {
			expandedProjects = [...expandedProjects, id];
		}
	}

	// Mock Breakdown Details
	const mockProjects = $derived(data.projects);
	const mockTasks = $derived(data.tasks);

	// --- Handlers ---
	const exportCSV = () => {
		let csvContent = "Project,Task Name,Task Status\n";

		chartData.forEach((day) => {
			const formattedTime = formatDecimalHours(day.logged);
			
			// Inject merged row separator for Date grouping
			csvContent += `"${day.date} - ${formattedTime}",,\n`;

			const dayTasks = mockTasks.filter((t) => t.rawDate === day.rawDate);
			
			dayTasks.forEach((task) => {
				const projName = task.projectName || "Unassigned";
				// Escape double quotes specifically tracking CSV syntax
				const taskName = task.name.replace(/"/g, '""');
				csvContent += `"${projName}","${taskName}","${task.status}"\n`;
			});
		});

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `Report_${data.filters.startDate}_to_${data.filters.endDate}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const updateTimeWindow = (start: Date, end: Date) => {
		const s = start.toLocaleDateString("en-CA");
		const e = end.toLocaleDateString("en-CA");
		goto(`?start=${s}&end=${e}`, { keepFocus: true, noScroll: true });
	};

	const goPrevWeek = () => {
		const s = new Date(rangeStart);
		const e = new Date(rangeEnd);
		s.setDate(s.getDate() - 7);
		e.setDate(e.getDate() - 7);
		updateTimeWindow(s, e);
	};

	const goNextWeek = () => {
		const s = new Date(rangeStart);
		const e = new Date(rangeEnd);
		s.setDate(s.getDate() + 7);
		e.setDate(e.getDate() + 7);
		updateTimeWindow(s, e);
	};

	const goToday = () => {
		const today = new Date();
		const tStart = getStartOfWeek(today);
		const tEnd = getEndOfWeek(today);
		if (rangeStart.toDateString() === tStart.toDateString() && rangeEnd.toDateString() === tEnd.toDateString()) {
			triggerShake();
			return;
		}
		goto("?", { noScroll: true });
	};
</script>

<div class="mx-auto p-8 space-y-8">
	<!-- 1. Page Header & Filter Navigation -->
	<header
		class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-zinc-100 z-50"
	>
		<nav class="relative flex items-center gap-4 py-2">
			<div
				class="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-4xl"
			>
				<button
					onclick={goPrevWeek}
					class="p-2 ml-1 transition-all text-zinc-400 hover:text-zinc-900"
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
					class="p-2 mr-1 transition-all text-zinc-400 hover:text-zinc-900"
				>
					<ChevronRight size={20} />
				</button>
			</div>
			<button
				onclick={goToday}
				class="px-5 py-2 bg-zinc-900 text-white rounded-4xl text-[14px] transition-all hover:bg-zinc-800 {isShaking ? 'shake-anim' : ''}"
			>
				Today
			</button>
		</nav>

		<button
			onclick={exportCSV}
			class="flex items-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-sm font-bold transition-all shadow-md focus:ring-4 focus:ring-zinc-900/20"
		>
			<Download size={18} />
			Export CSV
		</button>
	</header>

	<!-- 2. Summary Row -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<!-- Total Logged -->
		<div
			class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col justify-center"
		>
			<p
				class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-2"
			>
				Total Logged Time
			</p>
			<div class="flex items-baseline gap-2">
				<h2 class="text-3xl font-black font-mono text-zinc-900">
					{totalLoggedTime}
				</h2>
			</div>
		</div>

		<!-- Average Daily -->
		<div
			class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col justify-center"
		>
			<p
				class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-2"
			>
				Average Daily Time
			</p>
			<div class="flex items-baseline gap-2">
				<h2 class="text-3xl font-black font-mono text-zinc-900">
					{avgDailyHours}
				</h2>
			</div>
		</div>
	</div>

	<!-- 3. Visual Graphics / Charts -->
	<div class="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm">
		<div class="flex items-center gap-3 mb-4">
			<div class="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
				<BarChart3 size={20} strokeWidth={2.5} />
			</div>
			<h3 class="text-lg font-black text-zinc-900">Time Distribution</h3>
		</div>

		<div class="h-64 w-full pt-4 relative">
			{#if isChartEmpty}
				<div
					class="absolute inset-0 mt-4 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px] z-10 rounded-2xl border border-zinc-100/50"
				>
					<BarChart3 size={32} class="text-zinc-200 mb-2" strokeWidth={2} />
					<span class="text-zinc-400 font-bold text-sm">No Logged Time</span>
				</div>
			{/if}
			<Chart.Container config={chartConfig} class="h-full w-full">
				<BarChart
					data={chartData}
					x="day"
					y="logged"
					padding={{ left: 16, right: 16 }}
					props={{
						bars: {
							radius: 4,
							strokeWidth: 0,
							fill: "var(--color-emerald-500)",
						},
						yAxis: {
							format: (value) => `${value}h`,
						}
					}}
				>
					{#snippet tooltip(tooltipProps)}
						<Chart.Tooltip
							{...tooltipProps}
							class="bg-white border-zinc-200"
							labelFormatter={(value) => {
								const match = chartData.find(
									(d) => d.day === value,
								);
								return match ? match.date : value;
							}}
						>
							{#snippet formatter({ value })}
								<div class="flex w-full items-center gap-2">
									<div
										class="size-2.5 rounded-[2px] shrink-0"
										style="background-color: var(--color-zinc-900);"
									></div>
									<div
										class="flex flex-1 gap-4 justify-between items-center leading-none"
									>
										<span class="text-zinc-500 font-medium"
											>Logged time</span
										>
										<span
											class="text-zinc-900 font-mono font-medium tabular-nums"
											>{formatDecimalHours(
												value as number,
											)}</span
										>
									</div>
								</div>
							{/snippet}
						</Chart.Tooltip>
					{/snippet}
				</BarChart>
			</Chart.Container>
		</div>
	</div>

	<!-- 4. Data Breakdown Section -->
	<div class="space-y-4">
		<div
			class="flex items-center justify-between border-b border-zinc-100 pb-4"
		>
			<h3 class="text-xl font-black text-zinc-900">Breakdown View</h3>

			<div class="flex bg-zinc-100 p-1.5 rounded-2xl">
				<button
					onclick={() => (breakdownGroupBy = "Projects")}
					class="px-5 py-2 text-xs font-bold rounded-xl transition-all {breakdownGroupBy ===
					'Projects'
						? 'bg-white text-zinc-900 shadow-sm'
						: 'text-zinc-500 hover:text-zinc-900'}"
				>
					Projects
				</button>
				<button
					onclick={() => (breakdownGroupBy = "Tasks")}
					class="px-5 py-2 text-xs font-bold rounded-xl transition-all {breakdownGroupBy ===
					'Tasks'
						? 'bg-white text-zinc-900 shadow-sm'
						: 'text-zinc-500 hover:text-zinc-900'}"
				>
					Tasks
				</button>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-auto scrollbar-thin max-h-[500px]">
			<table
				class="w-full table-fixed border-separate border-spacing-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
			>
				<thead class="sticky top-0 bg-zinc-50/90 backdrop-blur z-20">
					<tr
						class="text-[10px] font-black uppercase tracking-widest text-zinc-400"
					>
						{#if breakdownGroupBy === "Projects"}
							<th
								class="w-24 px-6 py-4 text-center border-b border-zinc-100 rounded-tl-2xl"
								>Focus</th
							>
							<th
								class="px-4 py-4 text-left border-b border-zinc-100"
								>Project / Source</th
							>
							<th
								class="w-48 px-4 py-4 text-right border-b border-zinc-100 pr-8 rounded-tr-2xl"
								>Tasks Count</th
							>
						{:else}
							<th
								class="px-6 py-4 text-left border-b border-zinc-100 rounded-tl-2xl"
								>Task Name</th
							>
							<th
								class="w-64 px-4 py-4 text-left border-b border-zinc-100"
								>Project</th
							>
							<th
								class="w-32 px-6 py-4 text-left border-b border-zinc-100 rounded-tr-2xl"
								>Task Status</th
							>
						{/if}
					</tr>
				</thead>

				<tbody class="divide-y divide-zinc-50 bg-white">
					<!-- Group By: Projects -->
					{#if breakdownGroupBy === "Projects"}
						{#each mockProjects as project}
							{@const isExpanded = expandedProjects.includes(
								project.id,
							)}
							<tr
								class="group transition-colors cursor-pointer {isExpanded
									? 'bg-zinc-50'
									: 'hover:bg-zinc-50/50'}"
								onclick={() => toggleProject(project.id)}
							>
								<td
									class="py-4 px-6 flex justify-center items-center gap-3"
								>
									<ChevronRight
										size={14}
										class="text-zinc-300 transition-transform {isExpanded
											? 'rotate-90'
											: ''}"
									/>
									<div
										class="size-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors shadow-sm"
									>
										{#if project.name === "Unassigned"}
											<CircleDashed
												size={16}
												strokeWidth={2.5}
											/>
										{:else}
											<Briefcase
												size={16}
												strokeWidth={2.5}
											/>
										{/if}
									</div>
								</td>
								<td class="px-4">
									<span
										class="font-bold text-zinc-900 text-sm {project.name ===
										'Unassigned'
											? 'italic text-zinc-500'
											: ''}"
									>
										{project.name}
									</span>
								</td>
								<td class="px-4 pr-8 text-right">
									<span
										class="text-xs font-bold text-zinc-500 bg-white px-3 py-1.5 rounded-full border border-zinc-100 shadow-sm"
										>{project.tasksCount} Tasks</span
									>
								</td>
							</tr>
							{#if isExpanded}
								{#each mockTasks.filter((t) => t.projectId === project.id) as task}
									{@const details = getStatusDetails(
										task.status,
									)}
									<tr class="bg-zinc-50 border-zinc-100">
										<td
											class="py-3 px-6 pl-14 flex justify-center text-zinc-400 scale-90"
										>
											<details.icon
												size={16}
												class={details.color}
												strokeWidth={2.5}
											/>
										</td>
										<td
											class="px-4 py-3 text-sm font-bold text-zinc-600"
										>
											{task.name}
										</td>
										<td
											class="px-4 pr-10 text-left py-3"
										>
											<div class="flex items-center gap-2 text-xs font-bold {details.color}">
												<details.icon size={14} strokeWidth={2.5} />
												{task.status}
											</div>
										</td>
									</tr>
								{/each}
							{/if}
						{/each}
					{/if}

					<!-- Group By: Tasks -->
					{#if breakdownGroupBy === "Tasks"}
						{#each mockTasks as task}
							{@const details = getStatusDetails(task.status)}
							<tr
								class="group hover:bg-zinc-50/50 transition-colors"
							>
								<td class="px-6 py-4">
									<span
										class="font-bold text-zinc-900 text-sm"
										>{task.name}</span
									>
								</td>
								<td class="px-4">
									<div
										class="flex flex-col gap-1 items-start"
									>
										{#if task.projectName}
											<span
												class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-[10px] font-bold uppercase text-zinc-500"
											>
												<Briefcase size={10} />
												{task.projectName}
											</span>
										{:else}
											<span
												class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-[10px] font-bold uppercase text-zinc-400 italic"
											>
												Unassigned
											</span>
										{/if}
									</div>
								</td>
								<td class="py-4 px-6 text-left">
											<div class="flex items-center gap-2 text-xs font-bold {details.color}">
												<details.icon size={14} strokeWidth={2.5} />
												{task.status}
											</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
			{#if breakdownGroupBy === "Projects" && mockProjects.length === 0}
				<div
					class="text-center py-12 text-zinc-400 font-bold text-sm bg-white rounded-b-2xl border-t-0 border border-zinc-100"
				>
					No projects found.
				</div>
			{/if}
			{#if breakdownGroupBy === "Tasks" && mockTasks.length === 0}
				<div
					class="text-center py-12 text-zinc-400 font-bold text-sm bg-white rounded-b-2xl border-t-0 border border-zinc-100"
				>
					No tasks found.
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes grow {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}
</style>
