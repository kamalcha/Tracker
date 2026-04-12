<script lang="ts">
	import { timer } from "$lib/timerState.svelte";
	import { Clock, ChevronRight } from "lucide-svelte";

	let { data } = $props();

	const formatDuration = (totalSeconds: number) => {
		const h = Math.floor(totalSeconds / 3600)
			.toString()
			.padStart(2, "0");
		const m = Math.floor((totalSeconds % 3600) / 60)
			.toString()
			.padStart(2, "0");
		const s = (totalSeconds % 60).toString().padStart(2, "0");
		return `${h}h ${m}m ${s}s`;
	};

	const isToday = (dateStr: string) => {
		return dateStr === new Date().toLocaleDateString("en-CA");
	};
</script>

<div class="p-8 max-w-4xl mx-auto space-y-8">
	<h1 class="text-3xl font-black text-zinc-900">Time Logs</h1>

	<div class="grid gap-6">
		{#each data.dailyLogs as day}
			<div
				class="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden"
			>
				<div
					class="bg-zinc-50/50 px-6 py-4 flex justify-between items-center border-b border-zinc-100"
				>
					<div class="flex items-center gap-2">
						<span class="text-lg font-black text-zinc-900">
							{isToday(day.date) ? "Today" : day.date}
						</span>
						{#if isToday(day.date)}
							<span
								class="size-2 bg-emerald-500 rounded-full animate-pulse"
							></span>
						{/if}
					</div>
					<div class="text-right">
						<p
							class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
						>
							Logged Total
						</p>
						<p class="text-lg font-black text-zinc-900">
							{formatDuration(day.totalSeconds)}
						</p>
					</div>
				</div>

				<div class="divide-y divide-zinc-50">
					{#each day.entries as entry}
						<div
							class="px-6 py-4 flex justify-between items-center hover:bg-zinc-50/30 transition-colors"
						>
							<div class="flex items-center gap-4">
								<div
									class="p-2 bg-zinc-100 rounded-xl text-zinc-500"
								>
									<Clock size={18} />
								</div>
								<div>
									<p class="text-sm font-bold text-zinc-800">
										{new Date(
											entry.startTime,
										).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
										→
										{entry.endTime
											? new Date(
													entry.endTime,
												).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})
											: "Active"}
									</p>
									<p
										class="text-xs text-zinc-400 font-medium"
									>
										Session Log
									</p>
								</div>
							</div>
							<div
								class="text-sm font-mono font-bold text-zinc-500"
							>
								{formatDuration(entry.duration || 0)}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
