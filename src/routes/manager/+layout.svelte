<script lang="ts">
	import { LayoutDashboard, Users, ChevronDown, Clock } from "lucide-svelte";
	let { children, data } = $props();

	// Placeholder for the organization switcher logic
	let activeOrg = $state(
		data.user.organizationName || "Strategic Banking Corp",
	);
</script>

<div class="flex h-screen bg-slate-50">
	<aside
		class="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full"
	>
		<div class="p-6">
			<div class="flex items-center gap-2 mb-8">
				<div
					class="bg-blue-600 h-8 w-8 rounded-lg flex items-center justify-center text-white font-black italic"
				>
					P
				</div>
				<span
					class="text-xl font-black tracking-tighter text-slate-900 uppercase"
					>Pillarr</span
				>
			</div>

			<button
				class="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors"
			>
				<div class="text-left">
					<p
						class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
					>
						Organization
					</p>
					<p class="text-sm font-bold text-slate-700 truncate">
						{activeOrg}
					</p>
				</div>
				<ChevronDown size={16} class="text-slate-400" />
			</button>
		</div>

		<nav class="flex-1 px-4 space-y-1">
			<a
				href="/manager/reports"
				class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all font-medium"
			>
				<LayoutDashboard size={20} />
				Reports
			</a>
			<a
				href="/manager/members"
				class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all font-medium"
			>
				<Users size={20} />
				Members
			</a>
		</nav>
	</aside>

	<div class="flex-1 ml-64 flex flex-col h-full overflow-hidden">
		<header
			class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10"
		>
			<h2 class="font-bold text-slate-800">Manager Dashboard</h2>

			<div class="flex items-center gap-4">
				<div
					class="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
				>
					<Clock size={14} />
					<span>09:41 AM</span>
				</div>
				<div
					class="h-8 w-8 bg-slate-200 rounded-full border border-white"
				></div>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto p-8">
			{@render children()}
		</main>
	</div>
</div>
