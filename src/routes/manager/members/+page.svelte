<script lang="ts">
	import {
		UserPlus,
		MoreVertical,
		Mail,
		X,
		Send,
		CheckCircle,
		Clock,
	} from "lucide-svelte";
	import { fade, scale } from "svelte/transition"; // Added for that designer polish
	let { data, form } = $props();

	// Svelte 5 State for the Modal
	let isModalOpen = $state(false);

	function toggleModal() {
		isModalOpen = !isModalOpen;
	}
</script>

<div class="flex flex-col gap-8">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-black text-slate-900">
				Organization Members
			</h1>
			<p class="text-slate-500 text-sm">
				You have {data.members?.length ?? 0} team members in your organization.
			</p>
		</div>

		<button
			onclick={toggleModal}
			class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
		>
			<UserPlus size={18} />
			Invite Member
		</button>
	</div>

	{#if form?.success}
		<div
			in:fade
			class="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-2xl border border-green-100 font-bold text-sm"
		>
			<CheckCircle size={18} /> Invitation sent! The link has been generated
			in the terminal.
		</div>
	{/if}

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
				{#each data.members as member}
					<tr class="group hover:bg-slate-50/50 transition-colors">
						<td class="px-6 py-4">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs uppercase"
								>
									{member.name.charAt(0)}
								</div>
								<div>
									<p class="font-bold text-slate-900 text-sm">
										{member.name}
									</p>
									<p
										class="text-xs text-slate-400 flex items-center gap-1"
									>
										<Mail size={12} />
										{member.email}
									</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 text-sm text-slate-600"
							>{member.role}</td
						>
						<td class="px-6 py-4">
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700"
								>Active</span
							>
						</td>
						<td class="px-6 py-4 text-right">
							<button
								class="p-2 text-slate-300 hover:text-slate-600"
								><MoreVertical size={18} /></button
							>
						</td>
					</tr>
				{/each}

				{#each data.pending as invite}
					<tr class="bg-slate-50/30">
						<td class="px-6 py-4 opacity-60">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300"
								>
									<Clock size={16} />
								</div>
								<div>
									<p
										class="font-bold text-slate-400 text-sm italic"
									>
										Waiting for registration...
									</p>
									<p class="text-xs text-slate-400">
										{invite.email}
									</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 text-sm text-slate-300 italic"
							>Employee</td
						>
						<td class="px-6 py-4">
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100"
							>
								Pending
							</span>
						</td>
						<td class="px-6 py-4 text-right">
							<button
								class="text-xs font-bold text-blue-600 hover:underline"
								>Re-invite</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if isModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm
        transition-opacity"
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

			<form method="POST" action="?/invite" class="space-y-4">
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
