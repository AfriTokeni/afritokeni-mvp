<script lang="ts">
	import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
	import { Bitcoin, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from '@lucide/svelte';

	// Mock data for now - will connect to backend later
	let balance = $state(250000); // UGX
	let btcBalance = $state(0.00125);
	let usdcBalance = $state(50.00);

	const recentTransactions = [
		{ id: 1, type: 'receive', amount: 50000, currency: 'UGX', date: '2025-10-30', from: 'John Doe' },
		{ id: 2, type: 'send', amount: 25000, currency: 'UGX', date: '2025-10-29', to: 'Jane Smith' },
		{ id: 3, type: 'deposit', amount: 100000, currency: 'UGX', date: '2025-10-28', agent: 'Agent #123' }
	];

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-UG', {
			style: 'currency',
			currency: 'UGX',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Dashboard - AfriTokeni</title>
</svelte:head>

<DashboardLayout userType="user">
	<div class="space-y-6">
		<!-- Balance Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Local Currency Balance -->
			<div class="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
				<div class="flex items-center justify-between mb-4">
					<span class="text-sm opacity-90">Local Currency</span>
					<DollarSign class="w-5 h-5 opacity-90" />
				</div>
				<div class="text-3xl font-bold mb-2">{formatCurrency(balance)}</div>
				<div class="text-sm opacity-75">Ugandan Shilling</div>
			</div>

			<!-- Bitcoin Balance -->
			<div class="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl p-6 text-white">
				<div class="flex items-center justify-between mb-4">
					<span class="text-sm opacity-90">Bitcoin (ckBTC)</span>
					<Bitcoin class="w-5 h-5 opacity-90" />
				</div>
				<div class="text-3xl font-bold mb-2">{btcBalance.toFixed(8)} BTC</div>
				<div class="text-sm opacity-75">≈ {formatCurrency(btcBalance * 45000000)}</div>
			</div>

			<!-- USDC Balance -->
			<div class="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
				<div class="flex items-center justify-between mb-4">
					<span class="text-sm opacity-90">USDC (ckUSDC)</span>
					<TrendingUp class="w-5 h-5 opacity-90" />
				</div>
				<div class="text-3xl font-bold mb-2">${usdcBalance.toFixed(2)}</div>
				<div class="text-sm opacity-75">≈ {formatCurrency(usdcBalance * 3800)}</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="bg-white rounded-2xl border border-gray-200 p-6">
			<h2 class="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<a
					href="/users/send"
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
				>
					<ArrowUpRight class="w-6 h-6 text-gray-900 mb-2" />
					<span class="text-sm font-medium text-gray-900">Send Money</span>
				</a>
				<a
					href="/users/withdraw"
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
				>
					<ArrowDownRight class="w-6 h-6 text-gray-900 mb-2" />
					<span class="text-sm font-medium text-gray-900">Withdraw</span>
				</a>
				<a
					href="/users/agents"
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
				>
					<Bitcoin class="w-6 h-6 text-gray-900 mb-2" />
					<span class="text-sm font-medium text-gray-900">Buy Bitcoin</span>
				</a>
				<a
					href="/users/history"
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
				>
					<TrendingUp class="w-6 h-6 text-gray-900 mb-2" />
					<span class="text-sm font-medium text-gray-900">History</span>
				</a>
			</div>
		</div>

		<!-- Recent Transactions -->
		<div class="bg-white rounded-2xl border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold text-gray-900">Recent Transactions</h2>
				<a href="/users/history" class="text-sm text-blue-600 hover:underline">View All</a>
			</div>
			<div class="space-y-3">
				{#each recentTransactions as tx}
					<div class="flex items-center justify-between p-4 rounded-lg bg-gray-50">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
								{#if tx.type === 'receive'}
									<ArrowDownRight class="w-5 h-5 text-green-600" />
								{:else if tx.type === 'send'}
									<ArrowUpRight class="w-5 h-5 text-red-600" />
								{:else}
									<DollarSign class="w-5 h-5 text-blue-600" />
								{/if}
							</div>
							<div>
								<div class="font-medium text-gray-900 capitalize">{tx.type}</div>
								<div class="text-sm text-gray-500">{tx.date}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-semibold text-gray-900 {tx.type === 'receive' ? 'text-green-600' : tx.type === 'send' ? 'text-red-600' : 'text-blue-600'}">
								{tx.type === 'send' ? '-' : '+'}{formatCurrency(tx.amount)}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</DashboardLayout>
