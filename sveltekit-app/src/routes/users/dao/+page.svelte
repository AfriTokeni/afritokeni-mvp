<script lang="ts">
	import { onMount } from 'svelte';
	import { Vote, TrendingUp, Users, Coins } from '@lucide/svelte';
	import { mockProposals, mockLeaderboard, mockDAOStats, type Proposal } from '$lib/utils/dao';
	import DAOStats from './DAOStats.svelte';
	import ProposalsList from './ProposalsList.svelte';
	import TokensTab from './TokensTab.svelte';
	import LeaderboardTab from './LeaderboardTab.svelte';

	type Tab = 'proposals' | 'my-tokens' | 'leaderboard';

	// State
	let activeTab = $state<Tab>('proposals');
	let proposals = $state<Proposal[]>([]);
	let leaderboard = $state<any[]>([]);
	let tokenBalance = $state(1000);
	let totalSupply = $state(0);
	let totalHolders = $state(0);
	let activeProposalsCount = $state(0);
	let loading = $state(true);

	onMount(() => {
		loadData();
	});

	function loadData() {
		loading = true;
		// Load mock data
		proposals = mockProposals;
		leaderboard = mockLeaderboard;
		totalSupply = mockDAOStats.totalSupply;
		totalHolders = mockDAOStats.totalHolders;
		activeProposalsCount = mockDAOStats.activeProposals;
		loading = false;
	}

	function handleVote(proposalId: string, choice: 'yes' | 'no' | 'abstain') {
		console.log('Vote:', proposalId, choice);
		// TODO: Implement real voting
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">DAO Governance</h1>
			<p class="text-sm sm:text-base text-gray-600 mt-1">Participate in AfriTokeni's decentralized governance</p>
		</div>
		<Vote class="w-10 h-10 sm:w-12 sm:h-12 text-gray-900" />
	</div>

	<!-- Stats -->
	<DAOStats
		{tokenBalance}
		{totalSupply}
		{totalHolders}
		{activeProposalsCount}
	/>

	<!-- Tabs -->
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex space-x-8 overflow-x-auto">
			<button
				onclick={() => activeTab = 'proposals'}
				class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'proposals' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				<div class="flex items-center gap-2">
					<Vote class="w-5 h-5" />
					Proposals
				</div>
			</button>
			<button
				onclick={() => activeTab = 'my-tokens'}
				class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'my-tokens' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				<div class="flex items-center gap-2">
					<Coins class="w-5 h-5" />
					My Tokens
				</div>
			</button>
			<button
				onclick={() => activeTab = 'leaderboard'}
				class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'leaderboard' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				<div class="flex items-center gap-2">
					<TrendingUp class="w-5 h-5" />
					Leaderboard
				</div>
			</button>
		</nav>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'proposals'}
		<ProposalsList {proposals} onVote={handleVote} />
	{:else if activeTab === 'my-tokens'}
		<TokensTab balance={tokenBalance} {totalSupply} />
	{:else if activeTab === 'leaderboard'}
		<LeaderboardTab {leaderboard} {totalSupply} />
	{/if}
</div>
