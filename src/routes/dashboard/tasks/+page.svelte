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
	} from "lucide-svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();

	// --- STATE ---
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
	let filteredTasks = $derived(
		data.tasks.filter((t) => t.isArchived === (currentTab === "Archive")),
	);
	let filteredProjects = $derived(
		data.projects.filter((p) =>
			p.name.toLowerCase().includes(projectSearch.toLowerCase()),
		),
	);

	// --- TOAST TRIGGER ---
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
				return { icon: CircleDashed, color: "text-slate-400" };
		}
	};
</script>

<div class="flex flex-col h-screen bg-white overflow-hidden">
	<header class="px-8 pt-8 flex gap-8 border-b border-zinc-100 shrink-0">
		{#each ["Inbox", "Archive"] as tab}
			<button
				onclick={() => {
					currentTab = tab;
					selectedIds = [];
				}}
				class="pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition-all {currentTab ===
				tab
					? 'border-zinc-900 text-zinc-900'
					: 'border-transparent text-zinc-300 hover:text-zinc-500'}"
			>
				{tab}
			</button>
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
							checked={selectedIds.length > 0 &&
								selectedIds.length === filteredTasks.length}
							onchange={() =>
								(selectedIds = selectedIds.length
									? []
									: filteredTasks.map((t) => t.id))}
							class="rounded border-zinc-300 accent-zinc-900"
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
						class="w-28 px-4 text-left border-b border-zinc-100 text-right pr-8"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-50">
				{#each filteredTasks as task (task.id)}
					{@const details = getStatusDetails(task.status)}
					<tr class="group hover:bg-zinc-50/50 transition-colors">
						<td class="py-4 px-6"
							><input
								type="checkbox"
								bind:group={selectedIds}
								value={task.id}
								class="rounded border-zinc-300 accent-zinc-900"
							/></td
						>
						<td class="px-4">
							<div class="flex items-center gap-3">
								<form
									action="?/updateTask"
									method="POST"
									use:enhance
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
										class="size-5 rounded-md border-2 transition-all {task.completed
											? 'bg-emerald-500 border-emerald-500 text-white'
											: 'border-zinc-200'} flex items-center justify-center shrink-0"
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
							<div class="relative">
								<button
									onclick={() => {
										activeProjectDropdown =
											activeProjectDropdown === task.id
												? null
												: task.id;
										projectSearch = "";
										newProjectName = "";
									}}
									class="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full border border-zinc-100 text-[10px] font-black uppercase text-zinc-500 hover:border-zinc-900 transition-all"
								>
									<div
										class="flex items-center gap-1.5 truncate"
									>
										<!-- <Briefcase size={10} /> -->
										{data.projects.find(
											(p) => p.id === task.projectId,
										)?.name || "None"}
									</div>
									<ChevronDown size={10} class="shrink-0" />
								</button>

								{#if activeProjectDropdown === task.id}
									<div
										class="absolute left-0 top-full mt-2 w-64 bg-white border border-zinc-100 shadow-2xl rounded-2xl z-50 flex flex-col max-h-[420px] overflow-hidden"
									>
										<div
											class="p-2 border-b border-zinc-50 bg-zinc-50/50"
										>
											<div
												class="flex items-center gap-2 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
											>
												<Search
													size={12}
													class="text-zinc-400"
												/>
												<input
													type="text"
													bind:value={projectSearch}
													placeholder="Filter projects..."
													class="bg-transparent text-xs outline-none w-full font-bold"
												/>
											</div>
										</div>
										<form
											action="?/updateTask"
											method="POST"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
													activeProjectDropdown =
														null;
												};
											}}
										>
											<input
												type="hidden"
												name="id"
												value={task.id}
											/>
											<input
												type="hidden"
												name="projectId"
												value=""
											/>
											<button
												type="submit"
												class="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-tighter hover:bg-zinc-50 border-b border-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors"
												>None</button
											>
										</form>
										<div
											class="flex-1 overflow-y-auto py-1 scrollbar-thin max-h-[220px]"
										>
											{#each filteredProjects as p}
												<form
													action="?/updateTask"
													method="POST"
													use:enhance={() => {
														return async ({
															update,
														}) => {
															await update();
															activeProjectDropdown =
																null;
														};
													}}
												>
													<input
														type="hidden"
														name="id"
														value={task.id}
													/>
													<input
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
											class="p-2 border-t border-zinc-100 bg-zinc-50/50"
										>
											<form
												action="?/createAndAssignProject"
												method="POST"
												use:enhance={() => {
													return async ({
														update,
													}) => {
														await update();
														activeProjectDropdown =
															null;
														newProjectName = "";
													};
												}}
											>
												<input
													type="hidden"
													name="taskId"
													value={task.id}
												/>
												<div
													class="flex items-center gap-2 px-2 py-1.5 bg-white border border-dashed border-zinc-300 rounded-lg focus-within:border-zinc-900 transition-all"
												>
													<Plus
														size={12}
														class="text-zinc-400"
													/>
													<input
														type="text"
														name="name"
														bind:value={
															newProjectName
														}
														placeholder="New Project..."
														class="bg-transparent text-xs outline-none w-full font-bold"
													/>
												</div>
											</form>
										</div>
									</div>
								{/if}
							</div>
						</td>

						<td class="px-4">
							<div class="relative">
								<button
									onclick={() =>
										(activeStatusDropdown =
											activeStatusDropdown === task.id
												? null
												: task.id)}
									class="flex items-center gap-2 text-xs font-bold {details.color} hover:opacity-70 transition-all"
								>
									<details.icon size={14} strokeWidth={2.5} />
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
													return async ({
														update,
													}) => {
														await update();
														activeStatusDropdown =
															null;
													};
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
													class="w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors"
													>{s}</button
												>
											</form>
										{/each}
									</div>
								{/if}
							</div>
						</td>

						<td class="px-4 pr-8">
							<div
								class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<form
									action="?/archiveTasks"
									method="POST"
									use:enhance={() => {
										const ids = [task.id];
										const msg =
											currentTab === "Inbox"
												? `Task Archived`
												: `Task Restored`;
										triggerToast(msg, ids);
										return async ({ update }) => {
											await update();
										};
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
										value={currentTab === "Inbox"}
									/>
									<button
										type="submit"
										class="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
									>
										{#if currentTab === "Inbox"}<Archive
												size={14}
											/>{:else}<RotateCcw
												size={14}
											/>{/if}
									</button>
								</form>

								<form
									action="?/deleteTasks"
									method="POST"
									use:enhance={() => {
										triggerToast(
											`Task Permanently Deleted`,
											[],
										);
										return async ({ update }) => {
											await update();
										};
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
									>
										<Trash2 size={14} />
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}

				{#if currentTab === "Inbox"}
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
									placeholder="Quick add task... (Enter)"
									class="w-full bg-transparent font-bold outline-none placeholder:text-zinc-200"
								/>
							</form>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

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
					return async ({ update }) => {
						await update();
						toastVisible = false;
					};
				}}
			>
				<input
					type="hidden"
					name="ids"
					value={JSON.stringify(lastActionIds)}
				/>
				<input
					type="hidden"
					name="archive"
					value={currentTab === "Archive"}
				/>
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

	{#if selectedIds.length > 0}
		<div
			class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-2xl flex items-center gap-6 z-50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
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
						const ids = [...selectedIds];
						const msg =
							currentTab === "Inbox"
								? `${ids.length} Tasks Archived`
								: `${ids.length} Tasks Restored`;
						triggerToast(msg, ids);
						selectedIds = [];
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<input
						type="hidden"
						name="ids"
						value={JSON.stringify(selectedIds)}
					/>
					<input
						type="hidden"
						name="archive"
						value={currentTab === "Inbox"}
					/>
					<button
						type="submit"
						class="text-xs font-black uppercase tracking-widest flex items-center gap-2.5 hover:text-emerald-400 transition-colors"
					>
						{#if currentTab === "Inbox"}<Archive size={14} /> Archive{:else}<RotateCcw
								size={14}
							/> Restore{/if}
					</button>
				</form>
				<form
					action="?/deleteTasks"
					method="POST"
					use:enhance={() => {
						const ids = [...selectedIds];
						triggerToast(
							`${ids.length} Tasks Permanently Deleted`,
							[],
						);
						selectedIds = [];
						return async ({ update }) => {
							await update();
						};
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
					>
						<Trash2 size={14} /> Delete
					</button>
				</form>
			</div>
			<button
				onclick={() => (selectedIds = [])}
				class="ml-2 p-1 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
			>
				<X size={14} />
			</button>
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
