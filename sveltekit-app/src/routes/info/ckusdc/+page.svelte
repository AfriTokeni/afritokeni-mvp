<script lang="ts">
	import { DollarSign, Shield, TrendingUp, Zap, CheckCircle, AlertTriangle } from '@lucide/svelte';
</script>

<svelte:head>
	<title>ckUSDC - Stable Digital Dollar - AfriTokeni</title>
	<meta name="description" content="Learn about ckUSDC, ICP's stablecoin pegged to the US Dollar for stable, instant transfers." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-green-50 to-emerald-50 py-12 sm:py-16 md:py-20">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<div class="inline-flex items-center px-4 py-2 rounded-full bg-green-100 border border-green-200 text-green-700 text-sm font-medium mb-6">
			<DollarSign class="w-4 h-4 mr-2" />
			Stable Value
		</div>
		<h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
			ckUSDC: Stable Digital Dollar
		</h1>
		<p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
			USDC stablecoin on ICP. Always worth $1 USD. Perfect for protecting yourself from Bitcoin volatility.
		</p>
	</div>
</section>

<!-- What is ckUSDC -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
			What is ckUSDC?
		</h2>
		
		<div class="prose prose-lg max-w-none">
			<p class="text-gray-700 text-lg leading-relaxed mb-6">
				<strong>ckUSDC (Chain-Key USDC)</strong> is a stablecoin on the Internet Computer Protocol (ICP) that's always pegged to $1 USD. It's backed 1:1 by real USDC held in a decentralized smart contract.
			</p>
			
			<div class="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg mb-8">
				<p class="text-gray-800 font-semibold mb-2">The Simple Version:</p>
				<p class="text-gray-700">
					Bitcoin goes up and down. ckUSDC stays at $1. If you want stable value without volatility, use ckUSDC for your daily transactions.
				</p>
			</div>

			<p class="text-gray-700 text-lg leading-relaxed">
				Like ckBTC, ckUSDC uses ICP's <strong>chain-key cryptography</strong> for secure, decentralized custody. No centralized company controls your funds.
			</p>
		</div>
	</div>
</section>

<!-- Why ckUSDC -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Why Use ckUSDC?
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
			<!-- Stable Value -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
					<Shield class="w-6 h-6 text-green-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Stable Value</h3>
				<p class="text-gray-600 mb-4">
					1 ckUSDC = $1 USD. No volatility. Your money doesn't lose value when Bitcoin drops.
				</p>
				<div class="bg-gray-50 rounded-lg p-4 text-center">
					<div class="text-3xl font-bold text-green-600">$1.00</div>
					<div class="text-sm text-gray-600 mt-1">Always pegged</div>
				</div>
			</div>

			<!-- Instant Transfers -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
					<Zap class="w-6 h-6 text-yellow-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Instant Transfers</h3>
				<p class="text-gray-600 mb-4">
					Send ckUSDC in under 1 second with ~$0.01 fees. Perfect for daily transactions.
				</p>
				<div class="flex items-center gap-4 text-sm">
					<div class="flex-1 bg-yellow-50 rounded-lg p-3 text-center">
						<div class="font-bold text-yellow-600">&lt;1 sec</div>
						<div class="text-gray-600 text-xs">Speed</div>
					</div>
					<div class="flex-1 bg-green-50 rounded-lg p-3 text-center">
						<div class="font-bold text-green-600">~$0.01</div>
						<div class="text-gray-600 text-xs">Fee</div>
					</div>
				</div>
			</div>

			<!-- SMS Accessible -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
					<span class="text-2xl">📱</span>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">SMS Accessible</h3>
				<p class="text-gray-600 mb-4">
					Send ckUSDC via USSD menu on any phone. No smartphone or internet required.
				</p>
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="font-mono text-center text-lg font-bold text-gray-900">*384*22948#</div>
					<div class="text-sm text-gray-600 text-center mt-2">Dial to start</div>
				</div>
			</div>

			<!-- Perfect for Remittances -->
			<div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
				<div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
					<TrendingUp class="w-6 h-6 text-purple-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Perfect for Remittances</h3>
				<p class="text-gray-600 mb-4">
					Send money home without worrying about Bitcoin price changes during transfer.
				</p>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<CheckCircle class="w-4 h-4 text-green-600" />
						<span>No exchange rate risk</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<CheckCircle class="w-4 h-4 text-green-600" />
						<span>Predictable amounts</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ckBTC vs ckUSDC -->
<section class="py-12 sm:py-16 md:py-20 bg-white">
	<div class="max-w-6xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				ckBTC vs ckUSDC: Which to Use?
			</h2>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- ckBTC -->
			<div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 sm:p-8 border-2 border-orange-200">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
						<span class="text-2xl">₿</span>
					</div>
					<h3 class="text-2xl font-bold text-gray-900">ckBTC</h3>
				</div>
				
				<div class="space-y-4 mb-6">
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 shrink-0 mt-1" />
						<p class="text-gray-700"><strong>Investment:</strong> Value can go up (or down)</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 shrink-0 mt-1" />
						<p class="text-gray-700"><strong>Savings:</strong> Long-term store of value</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-orange-600 shrink-0 mt-1" />
						<p class="text-gray-700"><strong>Large amounts:</strong> Better for $100+</p>
					</div>
				</div>

				<div class="bg-orange-100 rounded-lg p-4 border border-orange-200">
					<div class="flex items-center gap-2 text-orange-800 text-sm font-semibold mb-2">
						<AlertTriangle class="w-4 h-4" />
						<span>Volatility Risk</span>
					</div>
					<p class="text-orange-700 text-sm">
						Bitcoin price can change ±10% in a day. Great for growth, risky for daily use.
					</p>
				</div>
			</div>

			<!-- ckUSDC -->
			<div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border-2 border-green-200">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
						<DollarSign class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-2xl font-bold text-gray-900">ckUSDC</h3>
				</div>
				
				<div class="space-y-4 mb-6">
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 shrink-0 mt-1" />
						<p class="text-gray-700"><strong>Daily use:</strong> Stable value for transactions</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 shrink-0 mt-1" />
						<p class="text-gray-700"><strong>Remittances:</strong> No exchange rate risk</p>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="w-5 h-5 text-green-600 shrink-0 mt-1" />
						<p class="text-gray-700"><strong>Small amounts:</strong> Perfect for $1-100</p>
					</div>
				</div>

				<div class="bg-green-100 rounded-lg p-4 border border-green-200">
					<div class="flex items-center gap-2 text-green-800 text-sm font-semibold mb-2">
						<Shield class="w-4 h-4" />
						<span>Stable Value</span>
					</div>
					<p class="text-green-700 text-sm">
						Always $1. No surprises. Perfect for everyday transactions and remittances.
					</p>
				</div>
			</div>
		</div>

		<!-- Recommendation -->
		<div class="mt-8 bg-blue-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-200">
			<h4 class="text-xl font-bold text-gray-900 mb-4">💡 Our Recommendation</h4>
			<div class="space-y-3 text-gray-700">
				<p>
					<strong>Use both!</strong> Keep savings in ckBTC for growth potential, and use ckUSDC for daily transactions.
				</p>
				<p>
					<strong>Example:</strong> Store $500 in ckBTC as savings. Keep $50 in ckUSDC for weekly expenses. Convert between them anytime.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- How to Get ckUSDC -->
<section class="py-12 sm:py-16 md:py-20 bg-gray-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				How to Get ckUSDC
			</h2>
		</div>

		<div class="space-y-6">
			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
					<h3 class="text-xl font-bold text-gray-900">Buy with Local Currency</h3>
				</div>
				<p class="text-gray-600 ml-14">
					Meet an agent, give them cash (UGX, KES, NGN, etc.), receive ckUSDC instantly.
				</p>
			</div>

			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
					<h3 class="text-xl font-bold text-gray-900">Convert from ckBTC</h3>
				</div>
				<p class="text-gray-600 ml-14">
					Already have ckBTC? Convert it to ckUSDC instantly through the app or via SMS.
				</p>
			</div>

			<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
				<div class="flex items-center gap-4 mb-3">
					<div class="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
					<h3 class="text-xl font-bold text-gray-900">Receive from Others</h3>
				</div>
				<p class="text-gray-600 ml-14">
					Anyone can send you ckUSDC via your phone number. No bank account needed.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-600 to-emerald-600">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
		<h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
			Start Using ckUSDC Today
		</h2>
		<p class="text-lg sm:text-xl text-green-100 mb-8">
			Stable value, instant transfers, accessible to everyone
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/"
				class="bg-white text-green-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
			>
				Get Started
			</a>
			<a
				href="/info/dao"
				class="bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg border-2 border-green-500"
			>
				Learn About DAO
			</a>
		</div>
	</div>
</section>
