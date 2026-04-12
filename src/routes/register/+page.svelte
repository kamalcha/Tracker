<script lang="ts">
	import { Lock, ShieldCheck, BadgeCheck } from "lucide-svelte";
	let { data, form } = $props();

	// Check if we are in "Invite Mode"
	const isInvited = $derived(!!data.invitation);
</script>

<main class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
	<div
		class="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
	>
		<div class="text-center mb-8">
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4"
			>
				<ShieldCheck size={28} />
			</div>
			<h1 class="text-2xl font-black text-gray-900 leading-tight">
				Complete Setup
			</h1>

			<div class="flex items-center justify-center gap-1.5 mt-1">
				<p class="text-gray-500 text-sm">
					Invited to join <b class="text-slate-900"
						>{data.invitation?.organizationName ||
							"an organization"}</b
					>
				</p>
				{#if isInvited}
					<BadgeCheck size={16} class="text-blue-500 fill-blue-50" />
				{/if}
			</div>
		</div>

		<form method="POST" class="space-y-5">
			<input
				type="hidden"
				name="token"
				value={data.invitation?.token || ""}
			/>
			<input
				type="hidden"
				name="organizationId"
				value={data.invitation?.organizationId || ""}
			/>

			<div>
				<label
					for="name"
					class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
					>Full Name</label
				>
				<input
					id="name"
					name="name"
					type="text"
					required
					placeholder="John Doe"
					class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
				/>
			</div>

			<div>
				<label
					for="email"
					class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
					>Email</label
				>
				<div class="relative">
					<input
						id="email"
						name="email"
						value={data.invitation?.email || ""}
						readonly={isInvited}
						class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none transition-all {isInvited
							? 'text-gray-400 cursor-not-allowed italic'
							: 'focus:ring-2 focus:ring-blue-500'}"
					/>
					{#if isInvited}
						<Lock
							size={14}
							class="absolute right-4 top-4 text-gray-300"
						/>
					{/if}
				</div>
			</div>

			{#if !isInvited}
				<div>
					<label
						for="organizationId"
						class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
						>Organization</label
					>
					<select
						name="organizationId"
						required
						class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
					>
						{#each data.organizations as org}
							<option value={org.id}>{org.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div>
				<label
					for="password"
					class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
					>Set Password</label
				>
				<input
					id="password"
					name="password"
					type="password"
					required
					placeholder="••••••••"
					class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
				/>
			</div>

			<button
				class="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98]"
			>
				Join Organization
			</button>
		</form>
	</div>
</main>
