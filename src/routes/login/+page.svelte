<script>
	let { form } = $props(); // Svelte 5 way to get data from the server
</script>

<main class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-[400px] space-y-8">
		<div class="text-center">
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-2xl shadow-lg shadow-blue-200"
			>
				T
			</div>
			<h2
				class="mt-6 text-3xl font-extrabold tracking-tight text-gray-900"
			>
				Welcome back
			</h2>
			<p class="mt-2 text-sm text-gray-500">
				Please enter your details to sign in
			</p>
		</div>

		<div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
			<form method="POST" class="space-y-6">
				{#if form?.error}
					<div
						class="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-pulse"
					>
						{form.error}
					</div>
				{/if}

				<div>
					<label
						for="email"
						class="block text-sm font-medium text-gray-700"
						>Email address</label
					>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="name@company.com"
						class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					/>
				</div>

				<div>
					<label
						for="password"
						class="block text-sm font-medium text-gray-700"
						>Password</label
					>
					<input
						id="password"
						name="password"
						type="password"
						required
						placeholder="••••••••"
						class="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					/>
				</div>

				<button
					type="submit"
					class="w-full flex justify-center py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-bold transition-all hover:shadow-lg active:scale-[0.98]"
				>
					Sign in
				</button>
			</form>
		</div>

		<p class="text-center text-xs text-gray-400">
			&copy; 2026 Tracker Labs Inc.
		</p>
	</div>
</main>
