<script lang="ts">
	import {
		CircleDashed,
		CircleCheck,
		CircleAlert,
		Loader,
	} from "lucide-svelte";
	let isChecked = $state(false);
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
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-4 before:rounded-t w-1"
					><input type="checkbox" /></th
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
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-2 before:rounded-t cursor-grab active:cursor-grabbing"
					>Logged</th
				>
				<th
					class="h-12 px-3 text-left align-middle text-h6 font-semibold text-secondary uppercase text-nowrap sticky bg-primary top-0 z-4 before:rounded-t"
					>Actions</th
				>
			</tr>
		</thead>
		<tbody class="[&_tr:last-child]:border-0">
			<tr
				class="group relative border-b border-primary bg-primary-interactive **:[td]:bg-primary-interactive-group aria-selected:border-accent aria-selected:bg-muted! aria-selected:**:[td]:bg-muted! group/row **:data-selection-checkbox:opacity-0 **:data-selection-checkbox:not-aria-[checked=false]:opacity-100 **:data-selection-checkbox:group-hover:opacity-100 **:data-selection-checkbox:aria-[checked=false]:border-primary-interactive"
			>
				<td class="h-12 px-3 align-middle sticky bg-primary z-3"
					><input type="checkbox" /></td
				>
				<td
					class="h-12 px-3 align-middle sticky bg-primary z-3 after:pointer-events-none after:absolute after:inset-y-0 after:w-1.25 after:from-black/4 dark:after:from-black/20 after:to-transparent after:border-inverted/10"
				>
					<div class="flex items-center gap-2 overflow-hidden">
						<label
							class="relative flex items-center cursor-pointer group"
						>
							<input
								type="checkbox"
								bind:checked={isChecked}
								class="sr-only peer"
							/>

							<div
								class="size-4 rounded-full border border-zinc-500 flex items-center justify-center transition-all peer-checked:bg-zinc-500 peer-checked:border-zinc-500"
							>
								{#if isChecked}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="size-2 text-white"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="20 6 9 17 4 12"
										></polyline>
									</svg>
								{/if}
							</div>

							<span
								class="ml-2 transition-all duration-300 {isChecked
									? 'line-through'
									: ''}"
							>
								Task 1
							</span>
						</label>
						<!-- <input type="checkbox" /> Task 1 -->
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle">None</td>
				<td class="relative h-12 px-3 align-middle">
					<div
						class="flex gap-x-2 font-semibold text-primary items-center"
					>
						<span
							><CircleDashed
								size={18}
								class="text-slate-400"
							/></span
						>
						Todo
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle">00:00:00</td>
				<td class="relative h-12 px-3 align-middle">Actions</td>
			</tr>
			<tr
				class="group relative border-b border-primary bg-primary-interactive **:[td]:bg-primary-interactive-group aria-selected:border-accent aria-selected:bg-muted! aria-selected:**:[td]:bg-muted! group/row **:data-selection-checkbox:opacity-0 **:data-selection-checkbox:not-aria-[checked=false]:opacity-100 **:data-selection-checkbox:group-hover:opacity-100 **:data-selection-checkbox:aria-[checked=false]:border-primary-interactive"
			>
				<td class="h-12 px-3 align-middle sticky bg-primary z-3"
					><input type="checkbox" /></td
				>
				<td
					class="h-12 px-3 align-middle sticky bg-primary z-3 after:pointer-events-none after:absolute after:inset-y-0 after:w-1.25 after:from-black/4 dark:after:from-black/20 after:to-transparent after:border-inverted/10"
				>
					<div class="flex items-center gap-2 overflow-hidden">
						<input type="checkbox" /> Task 2
					</div></td
				>
				<td class="relative h-12 px-3 align-middle">Redesign</td>
				<td class="relative h-12 px-3 align-middle">
					<div
						class="flex gap-x-2 font-semibold text-primary items-center"
					>
						<span><Loader size={18} class="text-blue-500" /></span>
						In Progress
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle">00:00:00</td>
				<td class="relative h-12 px-3 align-middle">Actions</td>
			</tr>
			<tr
				class="group relative border-b border-primary bg-primary-interactive **:[td]:bg-primary-interactive-group aria-selected:border-accent aria-selected:bg-muted! aria-selected:**:[td]:bg-muted! group/row **:data-selection-checkbox:opacity-0 **:data-selection-checkbox:not-aria-[checked=false]:opacity-100 **:data-selection-checkbox:group-hover:opacity-100 **:data-selection-checkbox:aria-[checked=false]:border-primary-interactive"
			>
				<td class="h-12 px-3 align-middle sticky bg-primary z-3"
					><input type="checkbox" /></td
				>
				<td
					class="h-12 px-3 align-middle sticky bg-primary z-3 after:pointer-events-none after:absolute after:inset-y-0 after:w-1.25 after:from-black/4 dark:after:from-black/20 after:to-transparent after:border-inverted/10"
				>
					<div class="flex items-center gap-2 overflow-hidden">
						<input type="checkbox" /> Task 3
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle">Development</td>
				<td class="relative h-12 px-3 align-middle">
					<div
						class="flex gap-x-2 font-semibold text-primary items-center"
					>
						<span
							><CircleAlert
								size={18}
								class="text-amber-500"
							/></span
						>
						Blocked
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle">00:00:00</td>
				<td class="relative h-12 px-3 align-middle">Actions</td>
			</tr>
			<tr
				class="group relative border-b border-primary bg-primary-interactive **:[td]:bg-primary-interactive-group aria-selected:border-accent aria-selected:bg-muted! aria-selected:**:[td]:bg-muted! group/row **:data-selection-checkbox:opacity-0 **:data-selection-checkbox:not-aria-[checked=false]:opacity-100 **:data-selection-checkbox:group-hover:opacity-100 **:data-selection-checkbox:aria-[checked=false]:border-primary-interactive"
			>
				<td class="h-12 px-3 align-middle sticky bg-primary z-3"
					><input type="checkbox" /></td
				>
				<td
					class="h-12 px-3 align-middle sticky bg-primary z-3 after:pointer-events-none after:absolute after:inset-y-0 after:w-1.25 after:from-black/4 dark:after:from-black/20 after:to-transparent after:border-inverted/10"
				>
					<div class="flex items-center gap-2 overflow-hidden">
						<input type="checkbox" /> Task 4
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle"> None </td>
				<td class="relative h-12 px-3 align-middle">
					<div
						class="flex gap-x-2 font-semibold text-primary items-center"
					>
						<span
							><CircleCheck
								size={18}
								class="text-emerald-500"
							/></span
						>
						Done
					</div>
				</td>
				<td class="relative h-12 px-3 align-middle">00:00:00</td>
				<td class="relative h-12 px-3 align-middle">Actions</td>
			</tr>
		</tbody>
	</table>
</div>
