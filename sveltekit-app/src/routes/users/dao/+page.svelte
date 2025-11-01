<script lang="ts">
	import { onMount } from 'svelte';
	import { Vote, TrendingUp, Users, Coins } from '@lucide/svelte';
	import { type Proposal } from '$lib/utils/dao';
	import { getDAOProposals, getLeaderboard } from '$lib/services/shared/daoService';
	import { getUserData } from '$lib/services/user/userService';
	import { demoMode } from '$lib/stores/demoMode';
	import DAOStats from './DAOStats.svelte';
	import ProposalsList from './ProposalsList.svelte';
	import TokensTab from './TokensTab.svelte';
	import LeaderboardTab from './LeaderboardTab.svelte';

	type Tab = 'proposals' | 'my-tokens' | 'leaderboard';

	// State
	let activeTab = $state<Tab>('proposals');
	let proposals = $state<Proposal[]>([]);
	let leaderboard = $state<any[]>([]);
	let currentUser = $state<any>(null);
	let tokenBalance = $state(0);
	let totalSupply = $state(0);
	let totalHolders = $state(0);
	let activeProposalsCount = $state(0);
	let loading = $state(true);

	// Subscribe to demo mode changes
	$effect(() => {
		// This will re-run when demoMode changes
		const isDemoMode = $demoMode;
		console.log('Demo mode changed:', isDemoMode);
		loadData();
	});

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		// Load user data and DAO data
		currentUser = await getUserData();
		proposals = await getDAOProposals();
		leaderboard = await getLeaderboard();
		
		console.log('DAO Data loaded:', { currentUser, proposals, leaderboard });
		
		// Get token balance from user data
		tokenBalance = currentUser?.daoTokens || 0;
		
		// Calculate stats from data
		totalSupply = leaderboard.reduce((sum: number, holder: any) => sum + (holder.balance || 0), 0);
		totalHolders = leaderboard.length;
		activeProposalsCount = proposals.filter((p: any) => p.status === 'active').length;
		loading = false;
	}

	function handleVote(proposalId: string, choice: 'yes' | 'no' | 'abstain') {
		console.log('Vote:', proposalId, choice);
		// TODO: Implement real voting
	}
</script>

<div class="space-y-6">
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
		<TokensTab balance={tokenBalance} {totalSupply} breakdown={currentUser?.daoTokensBreakdown} />
	{:else if activeTab === 'leaderboard'}
		<LeaderboardTab {leaderboard} {totalSupply} />
	{/if}
</div>
