<script lang="ts">
	import {
		CircleDashed,
		CircleCheck,
		CircleAlert,
		Loader,
		Ellipsis,
		Briefcase,
		Plus,
		Trash2,
		Copy,
		Archive,
	} from "lucide-svelte";

	// Define your static data in an array
	let tasks = $state([
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

	// Helper to get the correct icon/color based on status string
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

<div class="scrollbar-thin overflow-auto min-h-0 min-w-0 overscroll-none">
	<table class="w-full caption-bottom text-p1 min-w-0 table-fixed">
		<thead
			class="[&_tr]:border-b **:data-selection-checkbox:pr-0 **:data-selection-checkbox:aria-[checked=false]:border-primary-interactive"
		>
			<tr
				class="group relative border-b border-primary bg-primary-interactive **:[td]:bg-primary-interactive-group aria-selected:border-accent aria-selected:bg-muted! aria-selected:**:[td]:bg-muted! group/table-headers hover:bg-inherit"
			>
				<th
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-4 before:rounded-t w-0"
				>
					<input type="checkbox" /></th
				>
				<th
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-4 before:rounded-t after:pointer-events-none after:absolute after:inset-y-0 after:w-1.25 after:from-black/4 dark:after:from-black/20 after:to-transparent after:border-inverted/10"
					>Task</th
				>
				<th
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-2 before:rounded-t cursor-grab active:cursor-grabbing"
					>Projects</th
				>
				<th
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-2 before:rounded-t cursor-grab active:cursor-grabbing"
					>Status</th
				>
				<th
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-4 before:rounded-t"
					>Actions</th
				>
			</tr>
		</thead>
		<tbody class="[&_tr:last-child]:border-0">
			{#each tasks as task (task.id)}
				{@const details = getStatusDetails(task.status)}
				<tr
					class="group relative border-b border-primary bg-primary-interactive group/row"
				>
					<td class="h-12 px-3 align-middle sticky bg-primary z-3">
						<input type="checkbox" />
					</td>

					<td class="h-12 px-3 align-middle sticky bg-primary z-3">
						<div class="flex items-center gap-2">
							<label
								class="relative flex items-center cursor-pointer"
							>
								<input
									type="checkbox"
									bind:checked={task.completed}
									class="sr-only peer"
								/>
								<div
									class="size-4 rounded-full border border-zinc-500 flex items-center justify-center peer-checked:bg-zinc-500"
								>
									{#if task.completed}
										<svg
											class="size-2 text-white"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											><polyline points="20 6 9 17 4 12"
											></polyline></svg
										>
									{/if}
								</div>
							</label>
							<button
								type="button"
								onclick={() =>
									console.log("Open drawer for:", task.name)}
								class="text-left hover:underline transition-all duration-300 {task.completed
									? 'line-through'
									: 'text-primary'}"
							>
								{task.name}
							</button>
						</div>
					</td>

					<td class="relative h-12 px-3 align-middle">
						<div class="flex items-center gap-2">
							<Briefcase
								size={18}
								strokeWidth={2}
								class="text-zinc-800"
							/>
							<span class="truncate">{task.project}</span>
						</div>
					</td>

					<td class="relative h-12 px-3 align-middle">
						<div
							class="flex gap-x-2 font-semibold text-primary items-center"
						>
							<span
								><details.icon
									size={18}
									strokeWidth={2.5}
									class={details.color}
								/></span
							>
							{task.status}
						</div>
					</td>

					<td class="relative h-12 px-3 align-middle">
						<div class="flex items-center gap-2">
							<button
								class="rounded-full p-1.5 transition-all duration-200 hover:bg-slate-100"
							>
								<Trash2 size={16} strokeWidth={2.5} />
							</button>
							<button
								class="rounded-full p-1.5 transition-all duration-200 hover:bg-slate-100"
							>
								<Copy size={16} strokeWidth={2.5} />
							</button>
							<button
								class="rounded-full p-1.5 transition-all duration-200 hover:bg-slate-100"
							>
								<Archive size={16} strokeWidth={2.5} />
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<div
	class="sticky bottom-0 left-0 z-10 border-t border-primary bg-primary dark:bg-secondary/50 dark:backdrop-blur-lg px-3"
>
	<div class="flex items-center gap-2 min-h-12 pl-12">
		<button class="flex items-center gap-2">
			<Plus size={18} strokeWidth={2.5} />
			Add Task
		</button>
	</div>
</div>
