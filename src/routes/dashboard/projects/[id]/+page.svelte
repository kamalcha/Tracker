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
		ArrowLeft,
	} from "lucide-svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();

	// --- LOCAL REACTIVE STATE ---
	let tasksList = $state(data.tasks);

	// Sync local state when page data updates (e.g., on createTask)
	$effect(() => {
		tasksList = data.tasks;
	});

	// State management
	const isLocked = $derived(data.project.isArchived);
	let isEditingHeader = $state(false);
	let editedName = $state(data.project.name);

	let selectedIds = $state<number[]>([]);
	let activeStatusDropdown = $state<number | null>(null);
	let newTaskName = $state("");

	let toastVisible = $state(false);
	let toastMessage = $state("");
	let lastActionIds = $state<number[]>([]);
	let toastTimer: any;

	function triggerToast(message: string, ids: number[]) {
		clearTimeout(toastTimer);
		toastMessage = message;
		lastActionIds = ids;
		toastVisible = true;
		toastTimer = setTimeout(() => (toastVisible = false), 6000);
	}

	const getStatusDetails = (status: string) => {
		switch (status) {
			case "In Progress":
				return { icon: Loader, color: "text-blue-500" };
			case "Blocked":
				return { icon: CircleAlert, color: "text-amber-500" };
			case "Done":
				return { icon: CircleCheck, color: "text-emerald-500" };
			default:
				return { icon: CircleDashed, color: "text-zinc-400" };
		}
	};
</script>

<div class="flex flex-col h-screen bg-white overflow-hidden">
	<header class="p-8 pb-6 border-b border-zinc-100 shrink-0">
		<a
			href="/dashboard/projects"
			class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors mb-4"
		>
			<ArrowLeft size={12} /> Back to Projects
		</a>

		{#if isEditingHeader && !isLocked}
			<form
				action="?/renameProject"
				method="POST"
				use:enhance={() => {
					isEditingHeader = false;
				}}
				class="flex items-center gap-4 max-w-2xl"
			>
				<input
					bind:value={editedName}
					name="name"
					autoFocus
					class="text-4xl font-black text-zinc-900 outline-none border-b-4 border-emerald-500 w-full bg-transparent"
					onkeydown={(e) =>
						e.key === "Escape" && (isEditingHeader = false)}
				/>
				<button
					type="submit"
					class="shrink-0 p-3 bg-zinc-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
				>
					<Check size={24} />
				</button>
			</form>
		{:else}
			<button
				onclick={() => {
					if (!isLocked) {
						isEditingHeader = true;
						editedName = data.project.name;
					}
				}}
				class="text-4xl font-black text-zinc-900 {isLocked
					? 'cursor-default'
					: 'hover:text-zinc-500 cursor-text'} transition-colors text-left"
			>
				{data.project.name}
				{#if isLocked}<span
						class="text-sm font-black uppercase tracking-widest text-zinc-300 ml-4 px-3 py-1 bg-zinc-50 rounded-lg"
						>Archived</span
					>{/if}
			</button>
		{/if}
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
							disabled={isLocked}
							checked={selectedIds.length > 0 &&
								selectedIds.length === tasksList.length}
							onchange={() =>
								(selectedIds = selectedIds.length
									? []
									: tasksList.map((t) => t.id))}
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
						class="w-20 px-4 text-right border-b border-zinc-100 pr-8"
					></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-50">
				{#each tasksList as task (task.id)}
					{@const details = getStatusDetails(task.status)}
					<tr class="group hover:bg-zinc-50/50 transition-colors">
						<td class="py-4 px-6">
							<input
								type="checkbox"
								disabled={isLocked}
								bind:group={selectedIds}
								value={task.id}
								class="rounded accent-zinc-900"
							/>
						</td>

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
										disabled={isLocked}
										class="size-5 rounded-md border-2 transition-all {task.completed
											? 'bg-emerald-500 border-emerald-500 text-white'
											: 'border-zinc-200'} flex items-center justify-center shrink-0 disabled:opacity-50"
									>
										{#if task.completed}<Check
												size={14}
												strokeWidth={4}
											/>{/if}
									</button>
								</form>
								<span
									class="font-bold truncate {task.completed
										? 'line-through text-zinc-300'
										: 'text-zinc-900'}">{task.name}</span
								>
							</div>
						</td>

						<td class="px-4">
							<div
								class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-zinc-300"
							>
								<Briefcase size={10} />
								{data.project.name}
							</div>
						</td>

						<td class="px-4">
							{#if isLocked}
								<div
									class="flex items-center gap-2 text-xs font-bold text-zinc-300"
								>
									<CircleCheck size={14} strokeWidth={2.5} /> Done
								</div>
							{:else}
								<div class="relative">
									<button
										onclick={() =>
											(activeStatusDropdown =
												activeStatusDropdown === task.id
													? null
													: task.id)}
										class="flex items-center gap-2 text-xs font-bold {details.color} hover:opacity-70 transition-all"
									>
										<details.icon
											size={14}
											strokeWidth={2.5}
										/>
										{task.status}
										<ChevronDown size={12} />
									</button>
									{#if activeStatusDropdown === task.id}
										<div
											class="absolute left-0 top-full mt-2 w-40 bg-white border border-zinc-100 shadow-2xl rounded-xl z-50 p-1"
										>
											{#each ["Todo", "In Progress", "Blocked", "Done"] as s}
												<form
													action="?/updateTask"
													method="POST"
													use:enhance={() => {
														task.status = s;
														task.completed =
															s === "Done";
														activeStatusDropdown =
															null;
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
														value={s}
													/>
													<button
														type="submit"
														class="w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors"
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
											triggerToast("Task Archived", [
												task.id,
											]);
											tasksList = tasksList.filter(
												(t) => t.id !== task.id,
											);
										}}
									>
										<input
											type="hidden"
											name="ids"
											value={JSON.stringify([task.id])}
										/>
										<input
											type="hidden"
											name="archive"
											value="true"
										/>
										<button
											type="submit"
											class="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
											><Archive size={14} /></button
										>
									</form>
								{/if}
								<form
									action="?/deleteTasks"
									method="POST"
									use:enhance={() => {
										triggerToast("Task Deleted", []);
										tasksList = tasksList.filter(
											(t) => t.id !== task.id,
										);
									}}
								>
									<input
										type="hidden"
										name="ids"
										value={JSON.stringify([task.id])}
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

				{#if !isLocked}
					<tr class="bg-zinc-50/10">
						<td class="py-4 px-6"></td>
						<td colspan="4" class="px-4">
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
									placeholder="Add task to this project... (Enter)"
									class="w-full bg-transparent font-bold outline-none placeholder:text-zinc-200"
								/>
							</form>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	{#if selectedIds.length > 0 && !isLocked}
		<div
			class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-2xl flex items-center gap-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 transition-all"
		>
			<span
				class="text-[10px] font-black uppercase tracking-widest border-r border-zinc-700 pr-6 text-zinc-400"
				>{selectedIds.length} Selected</span
			>
			<div class="flex items-center gap-8">
				<form
					action="?/archiveTasks"
					method="POST"
					use:enhance={() => {
						triggerToast(`${selectedIds.length} Tasks Archived`, [
							...selectedIds,
						]);
						tasksList = tasksList.filter(
							(t) => !selectedIds.includes(t.id),
						);
						selectedIds = [];
					}}
				>
					<input
						type="hidden"
						name="ids"
						value={JSON.stringify(selectedIds)}
					/><input type="hidden" name="archive" value="true" />
					<button
						type="submit"
						class="text-xs font-black uppercase tracking-widest flex items-center gap-2.5 hover:text-emerald-400 transition-colors"
						><Archive size={14} /> Archive</button
					>
				</form>
				<form
					action="?/deleteTasks"
					method="POST"
					use:enhance={() => {
						triggerToast(`${selectedIds.length} Tasks Deleted`, []);
						tasksList = tasksList.filter(
							(t) => !selectedIds.includes(t.id),
						);
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
				class="ml-2 p-1 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
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
				/>
				<input type="hidden" name="archive" value="false" />
				<button
					type="submit"
					class="text-xs font-black uppercase text-emerald-400 hover:text-emerald-300 tracking-widest transition-colors"
					>Undo Action</button
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
