<script lang="ts">
	import {
		CircleDashed,
		CircleCheck,
		CircleAlert,
		Loader,
		Briefcase,
		Plus,
		Trash2,
		Archive,
		ChevronDown,
		Search,
		RotateCcw,
		X,
		Check,
		Lock,
	} from "lucide-svelte";
	import { enhance } from "$app/forms";
	import { getStatusDetails } from "$lib/utils";
	import { clickOutside } from "$lib/actions/clickOutside";

	let { data } = $props();

	// --- LOCAL REACTIVE STATE ---
	let tasksList = $state(data.tasks);
	let projectsList = $state(data.projects);
	let editingTaskId = $state<number | null>(null);
	let tempTaskName = $state("");

	// Keep local state in sync with server data
	$effect(() => {
		tasksList = data.tasks;
		projectsList = data.projects;
	});

	let currentTab = $state("Inbox");
	let selectedIds = $state<number[]>([]);
	let activeProjectDropdown = $state<number | null>(null);
	let activeStatusDropdown = $state<number | null>(null);
	let projectSearch = $state("");
	let newProjectName = $state("");
	let newTaskName = $state("");

	// --- TOAST STATE ---
	let toastVisible = $state(false);
	let toastMessage = $state("");
	let lastActionIds = $state<number[]>([]);
	let toastTimer: any;

	// --- DERIVED ---
	let isArchiveTab = $derived(currentTab === "Archive");
	let filteredTasks = $derived(
		tasksList.filter((t) => t.isArchived === isArchiveTab),
	);
	let activeProjects = $derived(
		projectsList.filter(
			(p) =>
				!p.isArchived &&
				p.name.toLowerCase().includes(projectSearch.toLowerCase()),
		),
	);

	let hasRestrictedSelection = $derived(
		tasksList
			.filter((t) => selectedIds.includes(t.id))
			.some((t) => t.projectIsArchived),
	);

	function startEditing(task: any) {
		// Don't allow editing archived tasks or tasks in archived projects
		if (isArchiveTab || task.projectIsArchived) return;
		editingTaskId = task.id;
		tempTaskName = task.name;
	}

	function triggerToast(message: string, ids: number[]) {
		clearTimeout(toastTimer);
		toastMessage = message;
		lastActionIds = ids;
		toastVisible = true;
		toastTimer = setTimeout(() => (toastVisible = false), 6000);
	}
</script>

<div class="flex flex-col h-full bg-white overflow-hidden">
	<header class="px-8 pt-8 flex gap-8 border-b border-zinc-100 shrink-0">
		{#each ["Inbox", "Archive"] as tab}
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
									? filteredTasks.map((t) => t.id)
									: [])}
							checked={selectedIds.length > 0 &&
								selectedIds.length === filteredTasks.length}
							class="rounded accent-zinc-900"
						/>
					</th>
					<th class="px-4 text-left border-b border-zinc-100">Task</th
					>
					<th class="w-48 px-4 text-left border-b border-zinc-100"
						>Project</th
					>
					<th class="w-40 px-4 text-left border-b border-zinc-100"
						>Status</th
					>
					<th
						class="w-28 px-4 text-right border-b border-zinc-100 pr-8"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-50">
				{#each filteredTasks as task (task.id)}
					{@const details = getStatusDetails(task.status)}
					{@const isLocked = isArchiveTab && task.projectIsArchived}
					<tr class="group hover:bg-zinc-50/50 transition-colors">
						<td class="py-4 px-6"
							><input
								type="checkbox"
								bind:group={selectedIds}
								value={task.id}
								class="rounded accent-zinc-900"
							/></td
						>

						<td class="px-4">
							<div class="flex items-center gap-3">
								<form
									action="?/updateTask"
									method="POST"
									use:enhance={() => {
										task.completed = !task.completed;
										task.status = task.completed
											? "Done"
											: "Todo";
									}}
								>
									<input
										type="hidden"
										name="id"
										value={task.id}
									/>
									<input
										type="hidden"
										name="status"
										value={task.completed ? "Todo" : "Done"}
									/>
									<button
										type="submit"
										disabled={isArchiveTab}
										class="size-5 rounded-xl border-2 transition-all {task.completed
											? 'bg-emerald-500 border-emerald-500 text-white'
											: 'border-zinc-200'} flex items-center justify-center shrink-0 disabled:opacity-50"
										>{#if task.completed}<Check
												size={14}
												strokeWidth={4}
											/>{/if}</button
									>
								</form>

								{#if editingTaskId === task.id}
									<form
										action="?/updateTask"
										method="POST"
										class="flex-1"
										use:enhance={() => {
											task.name = tempTaskName;
											editingTaskId = null;
										}}
									>
										<input
											type="hidden"
											name="id"
											value={task.id}
										/>
										<input
											bind:value={tempTaskName}
											name="name"
											class="w-full bg-transparent font-bold text-zinc-900 outline-none border-b border-zinc-900"
											autoFocus
											onblur={(e) =>
												e.currentTarget.form?.requestSubmit()}
											onkeydown={(e) =>
												e.key === "Escape" &&
												(editingTaskId = null)}
										/>
									</form>
								{:else}
									<span
										onclick={() => startEditing(task)}
										class="font-bold truncate {task.completed
											? 'line-through text-zinc-300'
											: 'text-zinc-900 cursor-text hover:text-zinc-500'}"
									>
										{task.name}
									</span>
								{/if}
							</div>
						</td>

						<td class="px-4">
							{#if isArchiveTab}
								<div
									class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase {task.projectIsArchived
										? 'text-amber-500'
										: 'text-zinc-300'}"
								>
									<Briefcase size={10} />
									{projectsList.find(
										(p) => p.id === task.projectId,
									)?.name || "None"}
									{#if task.projectIsArchived}<Lock
											size={10}
											class="ml-1"
										/>{/if}
								</div>
							{:else}
								<div
									class="relative"
									use:clickOutside={() => {
										if (activeProjectDropdown === task.id)
											activeProjectDropdown = null;
									}}
								>
									<button
										onclick={() =>
											(activeProjectDropdown =
												activeProjectDropdown ===
												task.id
													? null
													: task.id)}
										class="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full border border-zinc-100 text-[10px] font-black uppercase text-zinc-500 hover:border-zinc-900 transition-all"
									>
										<div
											class="flex items-center gap-1.5 truncate"
										>
											<Briefcase size={10} />
											{projectsList.find(
												(p) => p.id === task.projectId,
											)?.name || "None"}
										</div>
										<ChevronDown
											size={10}
											class="shrink-0"
										/>
									</button>

									{#if activeProjectDropdown === task.id}
										<div
											class="absolute left-0 top-full mt-2 w-56 bg-white border border-zinc-100 shadow-2xl rounded-2xl z-50 overflow-hidden"
										>
											<div
												class="p-2 border-b border-zinc-50 flex gap-2 bg-zinc-50"
											>
												<Search
													size={12}
													class="text-zinc-400"
												/><input
													type="text"
													bind:value={projectSearch}
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
														task.projectId = null;
														activeProjectDropdown =
															null;
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
														class="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-zinc-50 transition-colors text-zinc-400 italic"
														>Unassign Project</button
													>
												</form>
												{#each activeProjects as p}
													<form
														action="?/updateTask"
														method="POST"
														use:enhance={() => {
															task.projectId =
																p.id;
															activeProjectDropdown =
																null;
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
											<div
												class="p-2 border-t border-zinc-50 bg-zinc-50/50"
											>
												<form
													action="?/createProject"
													method="POST"
													use:enhance={() => {
														return async ({
															result,
														}) => {
															if (
																result.type ===
																	"success" &&
																result.data
															) {
																const {
																	newProject,
																	taskId,
																} =
																	result.data as any;
																projectsList = [
																	...projectsList,
																	newProject,
																];
																const t =
																	tasksList.find(
																		(x) =>
																			x.id ===
																			taskId,
																	);
																if (t) {
																	t.projectId =
																		newProject.id;
																}
																newProjectName =
																	"";
																activeProjectDropdown =
																	null;
															}
														};
													}}
												>
													<input
														type="hidden"
														name="taskId"
														value={task.id}
													/>
													<div
														class="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-zinc-200"
													>
														<Plus
															size={10}
															class="text-zinc-400"
														/>
														<input
															name="name"
															bind:value={
																newProjectName
															}
															placeholder="New project..."
															class="text-[10px] font-black uppercase outline-none w-full"
														/>
													</div>
												</form>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</td>

						<td class="px-4">
							{#if isArchiveTab}
								<div
									class="flex items-center gap-2 text-xs font-bold text-zinc-300"
								>
									<details.icon size={14} strokeWidth={2.5} />
									{task.status}
								</div>
							{:else}
								<div
									class="relative"
									use:clickOutside={() => {
										if (activeStatusDropdown === task.id)
											activeStatusDropdown = null;
									}}
								>
									<button
										onclick={() =>
											(activeStatusDropdown =
												activeStatusDropdown === task.id
													? null
													: task.id)}
										class="flex items-center gap-2 text-xs font-bold {details.color} hover:opacity-70 transition-all"
										><details.icon
											size={14}
											strokeWidth={2.5}
										/>
										{task.status}
										<ChevronDown size={12} /></button
									>
									{#if activeStatusDropdown === task.id}
										<div
											class="absolute left-0 top-full mt-2 w-40 bg-white border border-zinc-100 shadow-2xl rounded-xl z-50 p-1"
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
														class="w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors"
														>{s}</button
													>
												</form>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</td>

						<td class="px-4 pr-8 text-right">
							<div
								class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								{#if !isLocked}
									<form
										action="?/archiveTasks"
										method="POST"
										use:enhance={() => {
											triggerToast(
												isArchiveTab
													? "Restored"
													: "Archived",
												[task.id],
											);
										}}
									>
										<input
											type="hidden"
											name="ids"
											value={JSON.stringify([task.id])}
										/><input
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
								{:else}
									<div
										class="p-2 text-zinc-200 cursor-not-allowed"
										title="Project is Archived"
									>
										<Lock size={14} />
									</div>
								{/if}
								<form
									action="?/deleteTasks"
									method="POST"
									use:enhance={() => {
										triggerToast("Permanently Deleted", []);
									}}
								>
									<input
										type="hidden"
										name="ids"
										value={JSON.stringify([task.id])}
									/>
									<button
										type="submit"
										disabled={selectedIds.length > 0}
										class="p-2 transition-colors {selectedIds.length >
										0
											? 'text-zinc-200 cursor-not-allowed'
											: 'text-zinc-300 hover:text-red-500'}"
										><Trash2 size={14} /></button
									>
								</form>
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
					action="?/createTask"
					method="POST"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							newTaskName = "";
						};
					}}
				>
					<input
						bind:value={newTaskName}
						name="name"
						placeholder="Quick add task... (Enter)"
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
				{#if isArchiveTab && hasRestrictedSelection}
					<span
						class="text-[8px] font-black uppercase text-amber-500 leading-none mt-1"
						>Project Archived</span
					>
				{/if}
			</div>
			<div class="flex items-center gap-8">
				<form
					action="?/archiveTasks"
					method="POST"
					use:enhance={() => {
						triggerToast(isArchiveTab ? "Restored" : "Archived", [
							...selectedIds,
						]);
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
						disabled={isArchiveTab && hasRestrictedSelection}
						class="text-xs font-black uppercase tracking-widest flex items-center gap-2.5 hover:text-emerald-400 disabled:opacity-20 transition-colors"
					>
						{#if isArchiveTab}<RotateCcw size={14} /> Restore{:else}<Archive
								size={14}
							/> Archive{/if}
					</button>
				</form>
				<form
					action="?/deleteTasks"
					method="POST"
					use:enhance={() => {
						triggerToast("Deleted", []);
						selectedIds = [];
					}}
				>
					<input
						type="hidden"
						name="ids"
						value={JSON.stringify(selectedIds)}
					/>
					<button
						type="submit"
						class="text-xs font-black uppercase tracking-widest flex items-center gap-2.5 hover:text-red-400 transition-colors"
						><Trash2 size={14} /> Delete</button
					>
				</form>
			</div>
			<button
				onclick={() => (selectedIds = [])}
				class="p-1 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
				><X size={14} /></button
			>
		</div>
	{/if}

	{#if toastVisible}
		<div
			class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300"
		>
			<span class="text-sm font-bold">{toastMessage}</span>
			<div class="h-4 w-px bg-zinc-700"></div>
			<form
				action="?/archiveTasks"
				method="POST"
				use:enhance={() => {
					toastVisible = false;
				}}
			>
				<input
					type="hidden"
					name="ids"
					value={JSON.stringify(lastActionIds)}
				/><input type="hidden" name="archive" value={isArchiveTab} />
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
