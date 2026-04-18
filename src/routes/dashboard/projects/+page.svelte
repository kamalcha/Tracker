<script lang="ts">
	import {
		Plus,
		Trash2,
		Archive,
		RotateCcw,
		X,
		ChevronRight,
		TriangleAlert,
	} from "lucide-svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();

	let currentTab = $state("Active");
	let newProjectName = $state("");
	let selectedIds = $state<number[]>([]);

	// --- TOAST STATE ---
	let toastVisible = $state(false);
	let toastMessage = $state("");
	let lastActionIds = $state<number[]>([]);
	let toastTimer: any;

	// --- DELETE CONFIRMATION STATE ---
	let deleteModalVisible = $state(false);
	let deleteModalIds = $state<number[]>([]);
	let deleteModalBulk = $state(false);

	let isArchiveTab = $derived(currentTab === "Archive");
	let filteredProjects = $derived(
		data.projects.filter((p) => p.isArchived === isArchiveTab),
	);

	function triggerToast(message: string, ids: number[]) {
		clearTimeout(toastTimer);
		toastMessage = message;
		lastActionIds = ids;
		toastVisible = true;
		toastTimer = setTimeout(() => (toastVisible = false), 6000);
	}

	function requestDelete(ids: number[], bulk: boolean) {
		deleteModalIds = ids;
		deleteModalBulk = bulk;
		deleteModalVisible = true;
	}
</script>

<div class="flex flex-col h-full bg-white overflow-hidden">
	<header class="px-8 pt-8 flex gap-8 border-b border-zinc-100 shrink-0">
		{#each ["Active", "Archive"] as tab}
			<button
				onclick={() => {
					currentTab = tab;
					selectedIds = [];
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
			<thead class="sticky top-0 bg-white z-20">
				<tr
					class="text-[10px] font-black uppercase tracking-widest text-zinc-400"
				>
					<th
						class="w-16 py-4 px-6 text-left border-b border-zinc-100"
					>
						<input
							type="checkbox"
							onchange={(e) =>
								(selectedIds = e.currentTarget.checked
									? filteredProjects.map((p) => p.id)
									: [])}
							checked={selectedIds.length > 0 &&
								selectedIds.length === filteredProjects.length}
							class="rounded accent-zinc-900"
						/>
					</th>
					<th class="px-4 text-left border-b border-zinc-100"
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
						<td class="py-4 px-6"
							><input
								type="checkbox"
								bind:group={selectedIds}
								value={project.id}
								class="rounded accent-zinc-900"
							/></td
						>
						<td class="px-4">
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
											isArchiveTab
												? "Project Restored"
												: "Project Archived",
											[project.id],
										);
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
										value={!isArchiveTab}
									/>
									<button
										type="submit"
										disabled={selectedIds.length > 0}
										class="p-2 transition-colors {selectedIds.length >
										0
											? 'text-zinc-200 cursor-not-allowed'
											: 'text-zinc-300 hover:text-zinc-900'}"
										>{#if isArchiveTab}<RotateCcw
												size={14}
											/>{:else}<Archive
												size={14}
											/>{/if}</button
									>
								</form>
								<button
									type="button"
									disabled={selectedIds.length > 0}
									onclick={() => requestDelete([project.id], false)}
									class="p-2 transition-colors {selectedIds.length >
									0
										? 'text-zinc-200 cursor-not-allowed'
										: 'text-zinc-300 hover:text-red-500'}"
									><Trash2 size={14} /></button
								>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if !isArchiveTab}
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

	{#if selectedIds.length > 0}
		<div
			class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-2xl flex items-center gap-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 transition-all"
		>
			<div class="flex flex-col border-r border-zinc-700 pr-6">
				<span
					class="text-[10px] font-black uppercase tracking-widest text-zinc-400"
					>{selectedIds.length} Selected</span
				>
			</div>
			<div class="flex items-center gap-8">
				<form
					action="?/archiveProjects"
					method="POST"
					use:enhance={() => {
						triggerToast(
							isArchiveTab
								? "Projects Restored"
								: "Projects Archived",
							[...selectedIds],
						);
						selectedIds = [];
					}}
				>
					<input
						type="hidden"
						name="ids"
						value={JSON.stringify(selectedIds)}
					/><input
						type="hidden"
						name="archive"
						value={!isArchiveTab}
					/>
					<button
						type="submit"
						class="text-xs font-black uppercase tracking-widest flex items-center gap-2.5 hover:text-emerald-400 transition-colors"
					>
						{#if isArchiveTab}<RotateCcw size={14} /> Restore{:else}<Archive
								size={14}
							/> Archive{/if}
					</button>
				</form>
				<button
					type="button"
					onclick={() => requestDelete([...selectedIds], true)}
					class="text-xs font-black uppercase tracking-widest flex items-center gap-2.5 hover:text-red-400 transition-colors"
					><Trash2 size={14} /> Delete</button
				>
			</div>
			<button
				onclick={() => (selectedIds = [])}
				class="p-1 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
				><X size={14} /></button
			>
		</div>
	{/if}

	{#if deleteModalVisible}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center"
			onclick={(e) => e.target === e.currentTarget && (deleteModalVisible = false)}
			onkeydown={(e) => e.key === 'Escape' && (deleteModalVisible = false)}
		>
			<div
				class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
			>
				<div class="p-6 flex flex-col items-center text-center gap-4">
					<div class="size-12 rounded-full bg-red-50 flex items-center justify-center">
						<TriangleAlert size={24} class="text-red-500" />
					</div>
					<div>
						<h3 class="text-lg font-black text-zinc-900 mb-2">
							Delete {deleteModalBulk ? `${deleteModalIds.length} Projects` : 'Project'}
						</h3>
						<p class="text-sm text-zinc-500 leading-relaxed">
							{deleteModalBulk
								? `Are you sure you want to delete these ${deleteModalIds.length} projects? Deleting these projects also removes all tasks related to them. This cannot be undone.`
								: 'Are you sure you want to delete this project? Deleting this project also removes all tasks related to it. This cannot be undone.'}
						</p>
					</div>
				</div>
				<div class="flex border-t border-zinc-100">
					<button
						type="button"
						onclick={() => (deleteModalVisible = false)}
						class="flex-1 py-3.5 text-sm font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-colors"
					>Cancel</button>
					<form
						action={deleteModalBulk ? '?/deleteProjects' : '?/deleteProject'}
						method="POST"
						class="flex-1 border-l border-zinc-100"
						use:enhance={() => {
							deleteModalVisible = false;
							if (deleteModalBulk) selectedIds = [];
						}}
					>
						{#if deleteModalBulk}
							<input type="hidden" name="ids" value={JSON.stringify(deleteModalIds)} />
						{:else}
							<input type="hidden" name="id" value={deleteModalIds[0]} />
						{/if}
						<button
							type="submit"
							class="w-full py-3.5 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
						>Delete</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	{#if toastVisible}
		<div
			class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300"
		>
			<span class="text-sm font-bold">{toastMessage}</span>
			<div class="h-4 w-px bg-zinc-700"></div>
			<form
				action="?/archiveProjects"
				method="POST"
				use:enhance={() => {
					toastVisible = false;
				}}
			>
				<input
					type="hidden"
					name="ids"
					value={JSON.stringify(lastActionIds)}
				/><input
					type="hidden"
					name="archive"
					value={isArchiveTab}
				/>
				<button
					type="submit"
					class="text-xs font-black uppercase text-emerald-400 hover:text-emerald-300 tracking-widest transition-colors"
					>Undo</button
				>
			</form>
			<button
				onclick={() => (toastVisible = false)}
				class="text-zinc-500 hover:text-white transition-colors"
				><X size={14} /></button
			>
		</div>
	{/if}
</div>

<style>
	:global(.scrollbar-thin::-webkit-scrollbar) {
		width: 5px;
	}
	:global(.scrollbar-thin::-webkit-scrollbar-thumb) {
		background: #e4e4e7;
		border-radius: 10px;
	}
</style>
