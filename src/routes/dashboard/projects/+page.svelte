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

	// Filter based on tab
	let filteredProjects = $derived(
		data.projects.filter(
			(p) => p.isArchived === (currentTab === "Archive"),
		),
	);

	function confirmDelete(id: number, name: string) {
		if (
			confirm(
				`Are you sure? This will permanently delete "${name}" and all its tasks.`,
			)
		) {
			const form = document.createElement("form");
			form.method = "POST";
			form.action = "?/deleteProject";
			const input = document.createElement("input");
			input.name = "id";
			input.value = id.toString();
			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();
		}
	}
</script>

<div class="flex flex-col h-screen bg-white overflow-hidden">
	<header class="px-8 pt-8 flex gap-8 border-b border-zinc-100 shrink-0">
		{#each ["Active", "Archive"] as tab}
			<button
				onclick={() => (currentTab = tab)}
				class="pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all {currentTab ===
				tab
					? 'border-zinc-900 text-zinc-900'
					: 'border-transparent text-zinc-300'}"
			>
				{tab}
			</button>
		{/each}
	</header>

	<div class="flex-1 overflow-auto scrollbar-thin">
		<table class="w-full table-fixed border-separate border-spacing-0">
			<thead>
				<tr class="text-[10px] font-black uppercase text-zinc-400">
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
										class="h-full bg-emerald-500 transition-all duration-500"
										style="width: {progress}%"
									></div>
								</div>
								<span
									class="text-[10px] font-black uppercase tracking-widest {project.remainingTasks ===
									0
										? 'text-emerald-500'
										: 'text-zinc-400'}"
								>
									{#if project.remainingTasks === 0 && project.totalTasks > 0}
										All tasks complete! 🎉
									{:else if project.totalTasks === 0}
										No tasks yet
									{:else}
										{project.remainingTasks} tasks left
									{/if}
								</span>
							</div>
						</td>
						<td class="px-4 pr-8">
							<div
								class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<form
									action="?/archiveProject"
									method="POST"
									use:enhance
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
									>
										{#if currentTab === "Active"}<Archive
												size={14}
											/>{:else}<RotateCcw
												size={14}
											/>{/if}
									</button>
								</form>
								<button
									onclick={() =>
										confirmDelete(project.id, project.name)}
									class="p-2 text-zinc-300 hover:text-red-500 transition-colors"
								>
									<Trash2 size={14} />
								</button>
							</div>
						</td>
					</tr>
				{/each}

				{#if currentTab === "Active"}
					<tr class="bg-zinc-50/10">
						<td colspan="3" class="px-8">
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
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
