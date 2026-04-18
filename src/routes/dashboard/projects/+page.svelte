<script lang="ts">
	import {
		Plus,
		Trash2,
		Archive,
		RotateCcw,
		X,
		ChevronRight,
	} from "lucide-svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();
	let currentTab = $state("Active");
	let newProjectName = $state("");

	let toastVisible = $state(false);
	let toastMessage = $state("");
	let lastActionId = $state<number | null>(null);
	let toastTimer: any;

	let filteredProjects = $derived(
		data.projects.filter(
			(p) => p.isArchived === (currentTab === "Archive"),
		),
	);

	function triggerToast(message: string, id: number) {
		clearTimeout(toastTimer);
		toastMessage = message;
		lastActionId = id;
		toastVisible = true;
		toastTimer = setTimeout(() => (toastVisible = false), 6000);
	}
</script>

<div class="flex flex-col h-full bg-white overflow-hidden">
	<header class="px-8 pt-8 flex gap-8 border-b border-zinc-100 shrink-0">
		{#each ["Active", "Archive"] as tab}
			<button
				onclick={() => {
					currentTab = tab;
					toastVisible = false;
				}}
				class="pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all {currentTab ===
				tab
					? 'border-zinc-900 text-zinc-900'
					: 'border-transparent text-zinc-300'}">{tab}</button
			>
		{/each}
	</header>

	<div class="flex-1 overflow-auto scrollbar-thin">
		<table class="w-full table-fixed border-separate border-spacing-0">
			<thead>
				<tr
					class="text-[10px] font-black uppercase tracking-widest text-zinc-400"
				>
					<th class="px-8 py-4 text-left border-b border-zinc-100"
						>Project Name</th
					>
					<th class="w-64 px-4 text-left border-b border-zinc-100"
						>Health</th
					>
					<th
						class="w-28 px-4 text-right border-b border-zinc-100 pr-8"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-50">
				{#each filteredProjects as project (project.id)}
					{@const progress =
						project.totalTasks > 0
							? ((project.totalTasks - project.remainingTasks) /
									project.totalTasks) *
								100
							: 0}
					<tr class="group hover:bg-zinc-50/50 transition-colors">
						<td class="py-4 px-8">
							<a
								href="/dashboard/projects/{project.id}"
								class="flex items-center gap-2 font-bold text-zinc-900 hover:text-zinc-500 transition-colors"
							>
								{project.name}
								<ChevronRight
									size={14}
									class="opacity-0 group-hover:opacity-100 transition-opacity"
								/>
							</a>
						</td>
						<td class="px-4">
							<div class="flex flex-col gap-1.5">
								<div
									class="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden"
								>
									<div
										class="h-full bg-emerald-500 transition-all duration-700"
										style="width: {progress}%"
									></div>
								</div>
								<span
									class="text-[10px] font-black uppercase tracking-tighter {project.remainingTasks ===
										0 && project.totalTasks > 0
										? 'text-emerald-500'
										: 'text-zinc-400'}"
								>
									{project.remainingTasks === 0 &&
									project.totalTasks > 0
										? "All tasks complete! 🎉"
										: project.totalTasks === 0
											? "No tasks yet"
											: `${project.remainingTasks} tasks left`}
								</span>
							</div>
						</td>
						<td class="px-4 pr-8 text-right">
							<div
								class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<form
									action="?/archiveProject"
									method="POST"
									use:enhance={() => {
										triggerToast(
											currentTab === "Active"
												? "Project Archived"
												: "Project Restored",
											project.id,
										);
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input
										type="hidden"
										name="id"
										value={project.id}
									/>
									<input
										type="hidden"
										name="archive"
										value={currentTab === "Active"}
									/>
									<button
										type="submit"
										class="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
										>{#if currentTab === "Active"}<Archive
												size={14}
											/>{:else}<RotateCcw
												size={14}
											/>{/if}</button
									>
								</form>
								<form
									action="?/deleteProject"
									method="POST"
									onsubmit={(e) => {
										if (
											!confirm(
												"Permanently delete project and ALL tasks?",
											)
										)
											e.preventDefault();
									}}
								>
									<input
										type="hidden"
										name="id"
										value={project.id}
									/>
									<button
										type="submit"
										class="p-2 text-zinc-300 hover:text-red-500 transition-colors"
										><Trash2 size={14} /></button
									>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if currentTab === "Active"}
			<div
				class="sticky bottom-0 bg-white border-t border-zinc-100 px-8 z-10"
			>
				<form
					action="?/createProject"
					method="POST"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							newProjectName = "";
						};
					}}
				>
					<input
						bind:value={newProjectName}
						name="name"
						placeholder="Add new project... (Enter)"
						class="w-full py-4 bg-transparent font-bold outline-none placeholder:text-zinc-200"
					/>
				</form>
			</div>
		{/if}
	</div>

	{#if toastVisible}
		<div
			class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-2"
		>
			<span class="text-sm font-bold">{toastMessage}</span>
			<div class="h-4 w-px bg-zinc-700"></div>
			<form
				action="?/archiveProject"
				method="POST"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						toastVisible = false;
					};
				}}
			>
				<input type="hidden" name="id" value={lastActionId} />
				<input
					type="hidden"
					name="archive"
					value={currentTab === "Archive"}
				/>
				<button
					type="submit"
					class="text-xs font-black uppercase text-emerald-400 hover:text-emerald-300 tracking-widest"
					>Undo</button
				>
			</form>
			<button
				onclick={() => (toastVisible = false)}
				class="text-zinc-500 hover:text-white"><X size={14} /></button
			>
		</div>
	{/if}
</div>
