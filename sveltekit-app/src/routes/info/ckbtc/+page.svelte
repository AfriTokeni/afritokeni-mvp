<script lang="ts">
	import { Bitcoin, Zap, Shield, TrendingUp, Globe, CheckCircle } from '@lucide/svelte';
</script>

<svelte:head>
	<title>ckBTC - Chain-Key Bitcoin - AfriTokeni</title>
	<meta name="description" content="Learn about ckBTC, ICP's native Bitcoin that enables instant, low-cost Bitcoin transfers." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-orange-50 to-yellow-50 py-12 sm:py-16 md:py-20">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<div class="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-sm font-medium mb-6">
			<Bitcoin class="w-4 h-4 mr-2" />
			ICP-Native Bitcoin
		</div>
		<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
			ckBTC: Chain-Key Bitcoin
		</h1>
		<p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
			Real Bitcoin on the Internet Computer. Instant transfers, ~$0.01 fees, no wrapped tokens or bridges.
		</p>
	</div>
</section>

<!-- What is ckBTC -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
			What is ckBTC?
		</h2>
		
		<div class="prose prose-lg max-w-none">
			<p class="text-gray-700 text-lg leading-relaxed mb-6">
				<strong>ckBTC (Chain-Key Bitcoin)</strong> is Bitcoin that lives natively on the Internet Computer Protocol (ICP). It's backed 1:1 by real Bitcoin held in a decentralized smart contract.
			</p>
			
			<div class="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-8">
				<p class="text-gray-800 font-semibold mb-2">The Simple Version:</p>
				<p class="text-gray-700">
					You send Bitcoin to ICP. ICP gives you ckBTC. You can now transfer that Bitcoin instantly and cheaply. When you want your Bitcoin back, ICP returns it to you.
				</p>
			</div>

			<p class="text-gray-700 text-lg leading-relaxed">
				Unlike wrapped Bitcoin (WBTC) or other bridged tokens, ckBTC doesn't rely on centralized custodians. It uses ICP's <strong>chain-key cryptography</strong> to directly control Bitcoin on the Bitcoin blockchain.
			</p>
		</div>
	</div>
</section>

<!-- Key Benefits -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Why ckBTC is Perfect for Africa
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
			<!-- Lightning Fast -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
					<Zap class="w-6 h-6 text-yellow-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
				<p class="text-gray-600 mb-4">
					Transfers complete in under 1 second. No waiting 10-60 minutes for Bitcoin confirmations.
				</p>
				<div class="text-2xl font-bold text-yellow-600">&lt;1 sec</div>
			</div>

			<!-- Ultra Low Fees -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
					<TrendingUp class="w-6 h-6 text-green-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Ultra Low Fees</h3>
				<p class="text-gray-600 mb-4">
					~$0.01 per transfer. 99% cheaper than on-chain Bitcoin transactions.
				</p>
				<div class="text-2xl font-bold text-green-600">~$0.01</div>
			</div>

			<!-- Fully Decentralized -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
					<Shield class="w-6 h-6 text-blue-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Fully Decentralized</h3>
				<p class="text-gray-600 mb-4">
					No centralized custodians. Your Bitcoin is secured by ICP's chain-key cryptography.
				</p>
				<div class="flex items-center gap-2 text-sm text-green-600">
					<CheckCircle class="w-5 h-5" />
					<span>Trustless</span>
				</div>
			</div>

			<!-- 1:1 Backed -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
					<Bitcoin class="w-6 h-6 text-orange-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">1:1 Backed</h3>
				<p class="text-gray-600 mb-4">
					Every ckBTC is backed by real Bitcoin. Verifiable on-chain at any time.
				</p>
				<div class="text-sm text-gray-600">1 ckBTC = 1 BTC</div>
			</div>

			<!-- No Bridges -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
					<Globe class="w-6 h-6 text-purple-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">No Bridges</h3>
				<p class="text-gray-600 mb-4">
					Direct Bitcoin integration. No risky bridges that can be hacked or exploited.
				</p>
				<div class="flex items-center gap-2 text-sm text-green-600">
					<CheckCircle class="w-5 h-5" />
					<span>Secure</span>
				</div>
			</div>

			<!-- SMS Accessible -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
					<span class="text-2xl">📱</span>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">SMS Accessible</h3>
				<p class="text-gray-600 mb-4">
					Send ckBTC via USSD menu. No smartphone or internet required.
				</p>
				<div class="text-sm font-mono text-gray-600">*384*22948#</div>
			</div>
		</div>
	</div>
</section>

<!-- How It Works -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				How ckBTC Works
			</h2>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
			<!-- Minting ckBTC -->
			<div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border-2 border-green-200">
				<h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
					<span class="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">1</span>
					Minting ckBTC
				</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">Send Bitcoin to ICP's Bitcoin address</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">ICP detects your Bitcoin transaction</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">After 6 confirmations (~60 min), you receive ckBTC</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">Your ckBTC is now ready for instant transfers</p>
					</div>
				</div>
			</div>

			<!-- Redeeming ckBTC -->
			<div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 sm:p-8 border-2 border-orange-200">
				<h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
					<span class="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-lg font-bold">2</span>
					Redeeming ckBTC
				</h3>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">Request to convert ckBTC back to Bitcoin</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">Provide your Bitcoin address</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">ICP burns your ckBTC</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
						<p class="text-gray-700">Real Bitcoin is sent to your address</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Comparison -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				ckBTC vs Traditional Bitcoin
			</h2>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
				<thead class="bg-gray-100">
					<tr>
						<th class="px-6 py-4 text-left text-sm font-bold text-gray-900">Feature</th>
						<th class="px-6 py-4 text-center text-sm font-bold text-orange-600">ckBTC</th>
						<th class="px-6 py-4 text-center text-sm font-bold text-gray-600">Bitcoin</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					<tr>
						<td class="px-6 py-4 text-sm text-gray-900 font-medium">Transfer Speed</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">&lt;1 second</td>
						<td class="px-6 py-4 text-center text-sm text-gray-600">10-60 minutes</td>
					</tr>
					<tr class="bg-gray-50">
						<td class="px-6 py-4 text-sm text-gray-900 font-medium">Transaction Fee</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">~$0.01</td>
						<td class="px-6 py-4 text-center text-sm text-gray-600">$1-50</td>
					</tr>
					<tr>
						<td class="px-6 py-4 text-sm text-gray-900 font-medium">Minimum Amount</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">Any amount</td>
						<td class="px-6 py-4 text-center text-sm text-gray-600">~$10 (due to fees)</td>
					</tr>
					<tr class="bg-gray-50">
						<td class="px-6 py-4 text-sm text-gray-900 font-medium">SMS Accessible</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Yes</td>
						<td class="px-6 py-4 text-center text-sm text-gray-600">✗ No</td>
					</tr>
					<tr>
						<td class="px-6 py-4 text-sm text-gray-900 font-medium">Smart Contracts</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Yes</td>
						<td class="px-6 py-4 text-center text-sm text-gray-600">Limited</td>
					</tr>
					<tr class="bg-gray-50">
						<td class="px-6 py-4 text-sm text-gray-900 font-medium">Decentralized</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Yes</td>
						<td class="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Yes</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-orange-600 to-red-600">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
			Start Using ckBTC Today
		</h2>
		<p class="text-lg sm:text-xl text-orange-100 mb-8">
			Experience Bitcoin the way it was meant to be: fast, cheap, and accessible to everyone
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/"
				class="bg-white text-orange-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
			>
				Get Started
			</a>
			<a
				href="/info/ckusdc"
				class="bg-orange-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-800 transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-500"
			>
				Learn About ckUSDC
			</a>
		</div>
	</div>
</section>
