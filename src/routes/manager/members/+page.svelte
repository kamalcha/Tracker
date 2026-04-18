<script lang="ts">
	import {
		UserPlus,
		UserCheck,
		UserX,
		MoreVertical,
		Mail,
		X,
		Send,
		CheckCircle,
		Clock,
		Ban,
		RotateCcw,
		History,
		Filter,
		AlertCircle,
		Trash2,
	} from "lucide-svelte";
	import { fade, scale, fly } from "svelte/transition";
	import { enhance } from "$app/forms";
	let { data, form } = $props();

	// Modal State
	let isModalOpen = $state(false);
	let showFormError = $state(false);

	function toggleModal() {
		isModalOpen = !isModalOpen;
		if (isModalOpen) {
			showFormError = false; // Clear error visibility when opening
		}
	}

	// --- TOAST STATE ---
	let toastVisible = $state(false);
	let toastMessage = $state("");
	let toastTimer: any;

	function triggerToast(message: string) {
		clearTimeout(toastTimer);
		toastMessage = message;
		toastVisible = true;
		toastTimer = setTimeout(() => (toastVisible = false), 5000);
	}

	// Action to handle focus on mount
	function focusOnMount(node: HTMLInputElement) {
		setTimeout(() => node.focus(), 50); // Small delay to peek past transitions
	}

	// Filter State: 'All' | 'Active' | 'Sent'
	let activeFilter = $state("All");

	// Unified Derived List
	const list = $derived.by(() => {
		const members = (data.members || []).map((m) => ({
			...m,
			id: `member-${m.id}`,
			type: "member",
			displayName: m.name,
			displayStatus: m.status,
		}));

		const invites = (data.invitations || []).map((i) => ({
			...i,
			id: `invite-${i.token}`,
			type: "invite",
			displayName: "Invited User",
			displayStatus: i.status || "Sent", // Fallback for safety
			name: "Invited User",
		}));

		const combined = [...members, ...invites];

		if (activeFilter === "Active") {
			return members.filter((m) => m.displayStatus === "Active");
		}
		if (activeFilter === "Sent") {
			return invites.filter((i) => i.displayStatus === "Sent");
		}

		// 'All' returns everything sorted by date
		return combined.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		);
	});

	function getInitials(name: string) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.slice(0, 2)
			.toUpperCase();
	}
</script>

<div class="flex flex-col gap-8">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-black text-slate-900">
				Organization Members
			</h1>
		</div>

		<button
			onclick={toggleModal}
			class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
		>
			<UserPlus size={18} />
			Invite Member
		</button>
	</div>

	<!-- Filter Bar -->
	<div
		class="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 self-start shadow-sm"
	>
		{#each ["All", "Active", "Sent"] as filter}
			<button
				onclick={() => (activeFilter = filter)}
				class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                {activeFilter === filter
					? 'bg-slate-900 text-white shadow-md'
					: 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}"
			>
				{filter}
			</button>
		{/each}
	</div>

	<div
		class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
	>
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-slate-50/50 border-b border-slate-100">
					<th
						class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
						>Member</th
					>
					<th
						class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
						>Role</th
					>
					<th
						class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
						>Status</th
					>
					<th
						class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right"
						>Action</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-50">
				{#each list as item (item.id)}
					<tr class="group hover:bg-slate-50/50 transition-colors">
						<td class="px-6 py-4">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-full flex items-center justify-center font-black text-xs shadow-sm
                                {item.type === 'member'
										? 'bg-blue-50 border-2 border-blue-100 text-blue-600'
										: 'bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400'}"
								>
									{item.type === "member"
										? getInitials(item.displayName)
										: item.email[0].toUpperCase()}
								</div>
								<div>
									<p class="font-bold text-slate-900 text-sm">
										{item.displayName}
									</p>
									<p
										class="text-xs text-slate-400 flex items-center gap-1"
									>
										<Mail size={12} />
										{item.email}
									</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 text-sm text-slate-600">
							{item.role || "Employee"}
						</td>
						<td class="px-6 py-4">
							{#if item.displayStatus === "Active"}
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700"
									>Active</span
								>
							{:else if item.displayStatus === "Sent"}
								<span
									class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 relative overflow-hidden"
								>
									Sent
									<span
										class="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse"
									></span>
								</span>
							{:else if item.displayStatus === "Expired"}
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-100"
									>Expired</span
								>
							{:else if item.displayStatus === "Revoked"}
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500"
									>Revoked</span
								>
							{:else if item.displayStatus === "Inactive"}
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-100"
									>Inactive</span
								>
							{/if}
						</td>
						<td class="px-6 py-4 text-right">
							{#if item.type === "invite"}
								<div class="flex justify-end gap-2">
									{#if item.displayStatus === "Sent"}
										<form
											method="POST"
											action="?/revoke"
											use:enhance={() => {
												return async ({
													result,
													update,
												}) => {
													await update();
													if (
														result.type ===
														"success"
													) {
														triggerToast(
															"Invitation Revoked",
														);
													}
												};
											}}
										>
											<input
												type="hidden"
												name="token"
												value={item.token}
											/>
											<button
												type="submit"
												class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-all"
											>
												<UserX
													size={12}
													strokeWidth={3}
												/>
												Revokes
											</button>
										</form>
									{:else if item.displayStatus === "Expired" || item.displayStatus === "Revoked"}
										<div class="flex justify-end gap-1.5">
											<form
												method="POST"
												action="?/reinvite"
												use:enhance={() => {
													return async ({
														result,
														update,
													}) => {
														await update();
														if (
															result.type ===
															"success"
														) {
															triggerToast(
																"Invitation Re-sent",
															);
														}
													};
												}}
											>
												<input
													type="hidden"
													name="token"
													value={item.token}
												/>
												<button
													type="submit"
													class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100 rounded-xl border border-transparent hover:border-amber-200 transition-all"
												>
													<UserPlus
														size={12}
														strokeWidth={3}
													/>
													Re-invite
												</button>
											</form>
											<form
												method="POST"
												action="?/deleteInvite"
												use:enhance={() => {
													return async ({
														result,
														update,
													}) => {
														await update();
														if (
															result.type ===
															"success"
														) {
															triggerToast(
																"Record Deleted",
															);
														}
													};
												}}
											>
												<input
													type="hidden"
													name="token"
													value={item.token}
												/>
												<button
													type="submit"
													class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
												>
													<Trash2
														size={12}
														strokeWidth={3}
													/>
													Delete
												</button>
											</form>
										</div>
									{/if}
								</div>
							{:else}
								<div class="flex justify-end gap-1.5">
									<form
										method="POST"
										action="?/toggleStatus"
										use:enhance={() => {
											return async ({
												result,
												update,
											}) => {
												await update();
												if (result.type === "success") {
													triggerToast(
														"Member status updated",
													);
												}
											};
										}}
									>
										<input
											type="hidden"
											name="userId"
											value={item.id.replace(
												"member-",
												"",
											)}
										/>
										{#if item.displayStatus === "Active"}
											<button
												type="submit"
												class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
											>
												<Ban
													size={12}
													strokeWidth={3}
												/>
												Deactivate
											</button>
										{:else}
											<button
												type="submit"
												class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-green-700 hover:bg-green-100 rounded-xl border border-transparent hover:border-green-200 transition-all"
											>
												<UserCheck
													size={12}
													strokeWidth={3}
												/>
												Activate
											</button>
										{/if}
									</form>
								</div>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td
							colspan="4"
							class="px-6 py-12 text-center text-slate-400 italic text-sm"
						>
							No members or invitations found for this view.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if isModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity"
		onclick={toggleModal}
		in:fade={{ duration: 200 }}
	>
		<div
			class="bg-white w-full max-w-md m-4 p-8 rounded-3xl shadow-2xl border border-slate-100 relative"
			onclick={(e) => e.stopPropagation()}
			in:scale={{ start: 0.95, duration: 200 }}
		>
			<button
				onclick={toggleModal}
				class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
			>
				<X size={20} />
			</button>

			<div class="mb-8">
				<div
					class="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"
				>
					<Mail size={24} />
				</div>
				<h3 class="text-xl font-black text-slate-900">
					Invite Team Member
				</h3>
				<p class="text-slate-500 text-sm mt-1">
					They will receive a unique link to join your organization.
				</p>
			</div>

			<form
				method="POST"
				action="?/invite"
				class="space-y-4"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update(); // This ensures data refreshes and 'form' updates
						if (result.type === "success") {
							isModalOpen = false;
							activeFilter = "All";
							triggerToast("Invitation Sent!");
						} else if (result.type === "failure") {
							showFormError = true; // Show error if submission failed
						}
					};
				}}
			>
				{#if form?.message && isModalOpen && showFormError}
					<div
						class="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold"
						in:fade
					>
						<AlertCircle size={14} />
						{form.message}
					</div>
				{/if}

				<div>
					<label
						for="email"
						class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
						>Email Address</label
					>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="employee@company.com"
						required
						use:focusOnMount
						class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900"
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-blue-100"
				>
					<Send size={18} />
					Send Invitation
				</button>
			</form>
		</div>
	</div>
{/if}

{#if toastVisible}
	<div
		class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 z-[60]"
		in:fly={{ y: 20, duration: 300 }}
		out:fade
	>
		<CheckCircle size={18} class="text-green-400" />
		<span class="text-sm font-bold">{toastMessage}</span>
		<div class="h-4 w-px bg-slate-700 mx-2"></div>
		<button
			onclick={() => (toastVisible = false)}
			class="text-slate-500 hover:text-white transition-colors"
		>
			<X size={16} />
		</button>
	</div>
{/if}
