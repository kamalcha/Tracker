<script lang="ts">
	import {
		LayoutDashboard,
		Briefcase,
		CheckSquare,
		LogOut,
		Settings,
		Clock,
		ChevronDown,
	} from "lucide-svelte";
	import { page } from "$app/state";

	let { children, data } = $props();

	// Helper to highlight the active link
	const isActive = (path: string) => page.url.pathname.includes(path);
</script>

<div class="flex h-screen bg-white">
	<aside
		class="w-64 border-r border-gray-100 flex flex-col fixed h-full bg-white z-20"
	>
		<div class="p-6">
			<div class="flex items-center gap-2 mb-8">
				<div
					class="bg-black h-8 w-8 rounded-lg flex items-center justify-center text-white font-black italic"
				>
					P
				</div>
				<span
					class="text-xl font-black tracking-tighter text-black uppercase"
					>Pillarr</span
				>
			</div>

			<div
				class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
			>
				<div class="overflow-hidden">
					<p
						class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
					>
						Workspace
					</p>
					<p class="text-sm font-bold text-gray-900 truncate">
						{data.user.organizationName}
					</p>
				</div>
				<ChevronDown size={14} class="text-gray-400 flex-shrink-0" />
			</div>
		</div>

		<nav class="flex-1 px-4 space-y-1">
			<a
				href="/dashboard/reports"
				class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm {isActive(
					'/reports',
				)
					? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
					: 'text-gray-500 hover:bg-gray-50'}"
			>
				<LayoutDashboard size={18} /> Reports
			</a>
			<a
				href="/dashboard/projects"
				class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm {isActive(
					'/projects',
				)
					? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
					: 'text-gray-500 hover:bg-gray-50'}"
			>
				<Briefcase size={18} /> Projects
			</a>
			<a
				href="/dashboard/tasks"
				class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm {isActive(
					'/tasks',
				)
					? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
					: 'text-gray-500 hover:bg-gray-50'}"
			>
				<CheckSquare size={18} /> Tasks
			</a>
		</nav>

		<div class="p-4 border-t border-gray-50 space-y-1">
			<a
				href="/dashboard/profile"
				class="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-bold text-sm"
			>
				<Settings size={18} /> Profile
			</a>
			<form method="POST" action="/dashboard?/logout">
				<button
					type="submit"
					class="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm active:scale-95"
				>
					<LogOut size={18} />
					<span>Sign out</span>
				</button>
			</form>
		</div>
	</aside>

	<div class="flex-1 ml-64 flex flex-col h-full">
		<header
			class="h-20 border-b border-gray-50 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10"
		>
			<h2 class="text-xl font-black text-gray-900 capitalize">
				{page.url.pathname.split("/").pop()}
			</h2>

			<div class="flex items-center gap-6">
				<div class="text-right hidden sm:block">
					<p
						class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
					>
						Shift Time
					</p>
					<p class="text-sm font-mono font-bold text-gray-900">
						04:20:15
					</p>
				</div>
				<button
					class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95"
				>
					<Clock size={16} />
					Clock Out
				</button>
			</div>
		</header>

		<main class="flex-1 p-8 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>
