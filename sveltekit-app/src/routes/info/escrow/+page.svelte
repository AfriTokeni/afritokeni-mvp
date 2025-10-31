<script lang="ts">
	import { Lock, Shield, Clock, CheckCircle, AlertCircle } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Escrow Protection - AfriTokeni</title>
	<meta name="description" content="Learn how AfriTokeni's escrow system protects both users and agents during Bitcoin exchanges." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-blue-50 to-cyan-50 py-12 sm:py-16 md:py-20">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<div class="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium mb-6">
			<Shield class="w-4 h-4 mr-2" />
			Security First
		</div>
		<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
			Escrow Protection System
		</h1>
		<p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
			AfriTokeni holds your Bitcoin in secure escrow until both parties complete the exchange. No one can disappear with your money.
		</p>
	</div>
</section>

<!-- How It Works -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				How Escrow Works
			</h2>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				A simple 7-step process that protects everyone
			</p>
		</div>

		<div class="space-y-8">
			<!-- Step 1 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						1
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">User Selects Amount & Agent</h3>
					<p class="text-gray-600">
						Choose how much Bitcoin you want to buy/sell and select a nearby agent from the map.
					</p>
				</div>
			</div>

			<!-- Step 2 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						2
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">AfriTokeni Creates Escrow</h3>
					<p class="text-gray-600">
						We generate a unique Bitcoin address and 6-digit exchange code (e.g., <code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">BTC-847291</code>).
					</p>
				</div>
			</div>

			<!-- Step 3 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						3
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">User Sends Bitcoin to Escrow</h3>
					<p class="text-gray-600">
						Send Bitcoin to the escrow address (NOT directly to the agent). Your Bitcoin is held safely by AfriTokeni.
					</p>
				</div>
			</div>

			<!-- Step 4 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						4
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">Agent Gets Notified</h3>
					<p class="text-gray-600">
						Once Bitcoin is confirmed on the blockchain, the agent receives an SMS notification to meet you.
					</p>
				</div>
			</div>

			<!-- Step 5 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						5
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">In-Person Meeting</h3>
					<p class="text-gray-600">
						Meet the agent at the agreed location. Show your 6-digit exchange code on your phone.
					</p>
				</div>
			</div>

			<!-- Step 6 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						6
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">Agent Scans Code</h3>
					<p class="text-gray-600">
						Agent enters the 6-digit code. AfriTokeni releases the Bitcoin to the agent's wallet.
					</p>
				</div>
			</div>

			<!-- Step 7 -->
			<div class="flex gap-4 sm:gap-6">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
						7
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-xl font-bold text-gray-900 mb-2">Agent Gives You Cash</h3>
					<p class="text-gray-600">
						Agent hands you the local currency. Transaction complete! Both parties are protected.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Key Features -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Security Features
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
			<!-- 6-Digit Codes -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
					<Lock class="w-6 h-6 text-blue-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">6-Digit Exchange Codes</h3>
				<p class="text-gray-600 mb-4">
					Every transaction gets a unique code. Only the person with the code can release the Bitcoin from escrow.
				</p>
				<div class="bg-gray-50 rounded-lg p-4 font-mono text-center text-2xl font-bold text-gray-900">
					BTC-847291
				</div>
			</div>

			<!-- 24-Hour Refund -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
					<Clock class="w-6 h-6 text-orange-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">24-Hour Auto-Refund</h3>
				<p class="text-gray-600 mb-4">
					If the exchange isn't completed within 24 hours, your Bitcoin is automatically refunded to your wallet.
				</p>
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<CheckCircle class="w-5 h-5 text-green-600" />
					<span>No manual intervention needed</span>
				</div>
			</div>

			<!-- Agent Verification -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
					<Shield class="w-6 h-6 text-green-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Agent Verification</h3>
				<p class="text-gray-600 mb-4">
					All agents are KYC-verified and rated by the community. See their transaction history and ratings before choosing.
				</p>
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<CheckCircle class="w-5 h-5 text-green-600" />
					<span>Community ratings & reviews</span>
				</div>
			</div>

			<!-- Dispute Resolution -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
					<AlertCircle class="w-6 h-6 text-purple-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Dispute Resolution</h3>
				<p class="text-gray-600 mb-4">
					If something goes wrong, our support team can review the transaction and resolve disputes fairly.
				</p>
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<CheckCircle class="w-5 h-5 text-green-600" />
					<span>24/7 support available</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Why Escrow Matters -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 sm:p-8 lg:p-12 border-2 border-red-200">
			<div class="flex items-start gap-4 mb-6">
				<div class="flex-shrink-0">
					<AlertCircle class="w-8 h-8 text-red-600" />
				</div>
				<div>
					<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
						Why Escrow Protection Matters
					</h2>
					<div class="space-y-4 text-gray-700">
						<p>
							<strong>Without escrow:</strong> Users send Bitcoin directly to agents. If the agent disappears, the user loses their money with no recourse.
						</p>
						<p>
							<strong>With escrow:</strong> AfriTokeni holds the Bitcoin until both parties confirm the exchange. Neither party can cheat the other.
						</p>
						<p class="text-lg font-semibold text-red-900">
							Escrow eliminates the #1 risk in peer-to-peer Bitcoin exchanges: trust.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-600 to-cyan-600">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
			Ready to Exchange Bitcoin Safely?
		</h2>
		<p class="text-lg sm:text-xl text-blue-100 mb-8">
			Join thousands of users who trust AfriTokeni's escrow system
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/"
				class="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
			>
				Get Started
			</a>
			<a
				href="/info/ckbtc"
				class="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-blue-500"
			>
				Learn About ckBTC
			</a>
		</div>
	</div>
</section>
