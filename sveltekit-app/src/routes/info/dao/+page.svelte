<script lang="ts">
	import { Users, Vote, Shield, TrendingUp, Globe, CheckCircle, Smartphone } from '@lucide/svelte';
</script>

<svelte:head>
	<title>DAO Governance - Community Owned - AfriTokeni</title>
	<meta name="description" content="Learn about AfriTokeni's DAO governance system. Community-owned, SMS-accessible voting, transparent decision-making." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-purple-50 to-pink-50 py-12 sm:py-16 md:py-20">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<div class="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-sm font-medium mb-6">
			<Users class="w-4 h-4 mr-2" />
			Community Governed
		</div>
		<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
			DAO Governance
		</h1>
		<p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
			AfriTokeni is owned and governed by its community. Users and agents vote on fees, policies, and platform decisions via SMS or web.
		</p>
	</div>
</section>

<!-- What is a DAO -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
			What is a DAO?
		</h2>
		
		<div class="prose prose-lg max-w-none">
			<p class="text-gray-700 text-lg leading-relaxed mb-6">
				<strong>DAO (Decentralized Autonomous Organization)</strong> means the community controls the platform, not a company. Every major decision is voted on by users and agents.
			</p>
			
			<div class="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r-lg mb-8">
				<p class="text-gray-800 font-semibold mb-2">The Simple Version:</p>
				<p class="text-gray-700">
					Traditional companies: CEO makes decisions. AfriTokeni DAO: Community votes on decisions. More democratic, more transparent, more fair.
				</p>
			</div>

			<p class="text-gray-700 text-lg leading-relaxed">
				AfriTokeni's DAO runs on the Internet Computer Protocol (ICP), making all votes and decisions transparent and tamper-proof.
			</p>
		</div>
	</div>
</section>

<!-- What You Can Vote On -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				What You Can Vote On
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
			<!-- Transaction Fees -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
					<TrendingUp class="w-6 h-6 text-green-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Transaction Fees</h3>
				<p class="text-gray-600">
					Vote on fee percentages for different transaction types and locations. Keep fees fair and competitive.
				</p>
			</div>

			<!-- New Currencies -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
					<Globe class="w-6 h-6 text-blue-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">New Currencies</h3>
				<p class="text-gray-600">
					Propose adding support for new African currencies. Expand to new countries democratically.
				</p>
			</div>

			<!-- Agent Standards -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
					<Shield class="w-6 h-6 text-purple-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Agent Standards</h3>
				<p class="text-gray-600">
					Set requirements for agents (KYC, ratings, liquidity). Maintain quality and trust.
				</p>
			</div>

			<!-- Platform Features -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
					<span class="text-2xl">✨</span>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Platform Features</h3>
				<p class="text-gray-600">
					Vote on new features, UI changes, and product roadmap. Shape the platform's future.
				</p>
			</div>

			<!-- Treasury Management -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
					<span class="text-2xl">💰</span>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Treasury Management</h3>
				<p class="text-gray-600">
					Decide how platform revenue is used: agent incentives, marketing, development, reserves.
				</p>
			</div>

			<!-- Emergency Actions -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
					<span class="text-2xl">🚨</span>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Emergency Actions</h3>
				<p class="text-gray-600">
					Vote on urgent matters like security issues, fraud prevention, or system upgrades.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- How Voting Works -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				How Voting Works
			</h2>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
			<!-- Web Voting -->
			<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-200">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
						<Globe class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-2xl font-bold text-gray-900">Web Voting</h3>
				</div>
				
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-blue-600 shrink-0 mt-1" />
						<p class="text-gray-700">Log in to AfriTokeni dashboard</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-blue-600 shrink-0 mt-1" />
						<p class="text-gray-700">Browse active proposals</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-blue-600 shrink-0 mt-1" />
						<p class="text-gray-700">Read proposal details and discussion</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-blue-600 shrink-0 mt-1" />
						<p class="text-gray-700">Vote YES or NO with one click</p>
					</div>
				</div>
			</div>

			<!-- SMS Voting -->
			<div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-200">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
						<Smartphone class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-2xl font-bold text-gray-900">SMS Voting</h3>
				</div>
				
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-purple-600 shrink-0 mt-1" />
						<p class="text-gray-700">Receive SMS notification about new proposals</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-purple-600 shrink-0 mt-1" />
						<p class="text-gray-700">Dial USSD menu: <code class="bg-purple-100 px-2 py-1 rounded font-mono text-sm">*384*22948#</code></p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-purple-600 shrink-0 mt-1" />
						<p class="text-gray-700">Navigate to DAO Governance section</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-purple-600 shrink-0 mt-1" />
						<p class="text-gray-700">Select proposal and vote YES/NO</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Voting Power -->
		<div class="mt-12 bg-yellow-50 rounded-2xl p-6 sm:p-8 border-2 border-yellow-200">
			<h4 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
				<Vote class="w-6 h-6 text-yellow-600" />
				Your Voting Power
			</h4>
			<div class="space-y-3 text-gray-700">
				<p>
					<strong>1 vote per user/agent.</strong> Everyone has equal say, regardless of balance or transaction volume.
				</p>
				<p>
					<strong>Future enhancement:</strong> Earn governance tokens (AFRI) based on platform usage. More tokens = more voting power.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Proposal Lifecycle -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Proposal Lifecycle
			</h2>
		</div>

		<div class="space-y-6">
			<!-- Step 1 -->
			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
					<h3 class="text-xl font-bold text-gray-900">Proposal Submission</h3>
				</div>
				<p class="text-gray-600 ml-14">
					Any user or agent can submit a proposal. Include title, description, and expected impact.
				</p>
			</div>

			<!-- Step 2 -->
			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
					<h3 class="text-xl font-bold text-gray-900">Community Discussion</h3>
				</div>
				<p class="text-gray-600 ml-14">
					7-day discussion period. Community asks questions, suggests improvements, debates pros/cons.
				</p>
			</div>

			<!-- Step 3 -->
			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
					<h3 class="text-xl font-bold text-gray-900">Voting Period</h3>
				</div>
				<p class="text-gray-600 ml-14">
					5-day voting window. All users and agents vote YES or NO via web or SMS.
				</p>
			</div>

			<!-- Step 4 -->
			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
					<h3 class="text-xl font-bold text-gray-900">Execution</h3>
				</div>
				<p class="text-gray-600 ml-14">
					If >50% vote YES, proposal passes. ICP smart contracts automatically execute the decision.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Why DAO Matters -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Why DAO Governance Matters
			</h2>
		</div>

		<div class="space-y-6">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
					<CheckCircle class="w-6 h-6 text-green-600" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900 mb-2">No Single Point of Failure</h3>
					<p class="text-gray-600">
						Traditional companies can shut down, freeze accounts, or change rules arbitrarily. DAOs can't. The community decides.
					</p>
				</div>
			</div>

			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
					<CheckCircle class="w-6 h-6 text-blue-600" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900 mb-2">Transparent Decision-Making</h3>
					<p class="text-gray-600">
						All proposals, votes, and results are public on the blockchain. No backroom deals or hidden agendas.
					</p>
				</div>
			</div>

			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
					<CheckCircle class="w-6 h-6 text-purple-600" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900 mb-2">Community Ownership</h3>
					<p class="text-gray-600">
						Users and agents own the platform. Profits go back to the community, not shareholders.
					</p>
				</div>
			</div>

			<div class="flex items-start gap-4">
				<div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
					<CheckCircle class="w-6 h-6 text-orange-600" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900 mb-2">SMS Accessibility</h3>
					<p class="text-gray-600">
						First DAO in the world with SMS voting. No smartphone or internet required to participate in governance.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-purple-600 to-pink-600">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
			Join the DAO
		</h2>
		<p class="text-lg sm:text-xl text-purple-100 mb-8">
			Be part of Africa's first SMS-accessible DAO. Your voice matters.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/"
				class="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
			>
				Get Started
			</a>
			<a
				href="/info/tariff"
				class="bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-800 transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-purple-500"
			>
				View Pricing
			</a>
		</div>
	</div>
</section>
