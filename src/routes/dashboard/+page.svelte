<script lang="ts">
	let { data } = $props();
</script>

<main class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div
		class="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
	>
		<div class="text-center mb-8">
			<h1 class="text-2xl font-black text-gray-900">User Profile</h1>
			<p class="text-gray-500 text-sm">Logged in successfully</p>
		</div>

		<div class="space-y-4 mb-8">
			<div
				class="flex justify-between items-center py-3 border-b border-gray-50"
			>
				<span class="text-gray-400 text-sm font-medium">Name</span>
				<span class="text-gray-900 font-bold">{data.user.name}</span>
			</div>

			<div
				class="flex justify-between items-center py-3 border-b border-gray-50"
			>
				<span class="text-gray-400 text-sm font-medium">Email</span>
				<span class="text-gray-900 font-medium">{data.user.email}</span>
			</div>

			<div class="flex justify-between items-center py-3">
				<span class="text-gray-400 text-sm font-medium">Role</span>
				<span
					class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700"
				>
					{data.user.role}
				</span>
			</div>
		</div>

		<form method="POST" action="?/logout">
			<button
				class="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
			>
				Sign Out
			</button>
		</form>
	</div>
</main>
