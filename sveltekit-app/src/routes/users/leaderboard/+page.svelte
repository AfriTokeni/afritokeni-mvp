<script lang="ts">
	import { onMount } from 'svelte';
	import { Trophy, Medal, Award } from '@lucide/svelte';
	import { type LeaderboardEntry } from '$lib/utils/dao';
	import { getLeaderboard } from '$lib/services/shared/daoService';

	// State
	let leaderboard = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let totalSupply = $state(0);

	onMount(() => {
		loadLeaderboard();
	});

	async function loadLeaderboard() {
		loading = true;
		leaderboard = await getLeaderboard();
		// Calculate total supply from leaderboard
		totalSupply = leaderboard.reduce((sum, holder) => sum + (holder.balance || 0), 0);
		loading = false;
	}

	function formatNumber(num: number): string {
		if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
		if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
		return num.toFixed(2);
	}

	function getPercentage(balance: number): string {
		return ((balance / totalSupply) * 100).toFixed(2);
	}
</script>

<div class="space-y-4 sm:space-y-6">
	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
		<div class="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
			<p class="text-xs sm:text-sm text-gray-600 mb-1">Total Supply</p>
			<p class="text-xl sm:text-2xl font-bold font-mono text-gray-900 break-all">
				{formatNumber(totalSupply)} AFRI
			</p>
		</div>
		<div class="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
			<p class="text-xs sm:text-sm text-gray-600 mb-1">Top Holders</p>
			<p class="text-xl sm:text-2xl font-bold font-mono text-gray-900">{leaderboard.length}</p>
		</div>
		<div class="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
			<p class="text-xs sm:text-sm text-gray-600 mb-1">Largest Holder</p>
			<p class="text-xl sm:text-2xl font-bold font-mono text-gray-900">
				{leaderboard[0] ? `${getPercentage(leaderboard[0].balance)}%` : '0%'}
			</p>
		</div>
	</div>

	<!-- Leaderboard -->
	<div class="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
		<div class="p-4 sm:p-6 border-b border-gray-200">
			<h2 class="text-lg sm:text-xl font-bold text-gray-900">Top Token Holders</h2>
		</div>

		{#if loading}
			<div class="p-8 sm:p-12 text-center">
				<div class="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900"></div>
				<p class="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading leaderboard...</p>
			</div>
		{:else if leaderboard.length === 0}
			<div class="p-8 sm:p-12 text-center">
				<Trophy class="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
				<p class="text-sm sm:text-base text-gray-600">No token holders found</p>
			</div>
		{:else}
			<div class="divide-y divide-gray-200">
				{#each leaderboard as holder, index}
					<div class="p-4 sm:p-6 flex items-center gap-2 sm:gap-4 hover:bg-gray-50 transition-colors {index < 3 ? 'bg-gray-50' : ''}">
						<!-- Rank -->
						<div class="w-10 sm:w-12 flex justify-center shrink-0">
							{#if index === 0}
								<Trophy class="w-6 h-6 text-yellow-500" />
							{:else if index === 1}
								<Medal class="w-6 h-6 text-gray-400" />
							{:else if index === 2}
								<Award class="w-6 h-6 text-orange-600" />
							{:else}
								<span class="text-lg font-bold text-gray-500">#{index + 1}</span>
							{/if}
						</div>

						<!-- Holder Info -->
						<div class="flex-1 min-w-0">
							<p class="text-sm sm:text-base font-semibold text-gray-900 truncate">{holder.name || holder.userId || 'Anonymous'}</p>
							<p class="text-xs sm:text-sm text-gray-600 wrap-break-word">
								{getPercentage(holder.balance)}% of total supply
							</p>
						</div>

						<!-- Balance -->
						<div class="text-right shrink-0">
							<p class="text-base sm:text-lg lg:text-xl font-bold font-mono text-gray-900 whitespace-nowrap">
								{formatNumber(holder.balance)}
							</p>
							<p class="text-xs sm:text-sm text-gray-600">AFRI</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Info -->
	<div class="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
		<p class="text-xs sm:text-sm text-blue-800 leading-relaxed">
			<strong>Note:</strong> This leaderboard shows neurons staked in SNS governance. Token
			holders who haven't staked their tokens in neurons are not displayed.
		</p>
	</div>
</div>
