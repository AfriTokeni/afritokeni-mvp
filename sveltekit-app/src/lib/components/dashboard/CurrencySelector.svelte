<script lang="ts">
	import { Settings, Check } from '@lucide/svelte';

	interface Props {
		currentCurrency: string;
		onCurrencyChange: (currency: string) => void;
	}

	let { currentCurrency, onCurrencyChange }: Props = $props();

	let isOpen = $state(false);

	// Mock active currencies - will be replaced with actual data
	const activeCurrencies = [
		{ code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda' },
		{ code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria' },
		{ code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
		{ code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', country: 'Ghana' },
		{ code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' }
	];

	function handleCurrencySelect(currencyCode: string) {
		onCurrencyChange(currencyCode);
		isOpen = false;
	}
</script>

<div class="relative">
	<!-- Gear Icon Button -->
	<button
		onclick={() => isOpen = !isOpen}
		class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all duration-200"
		title="Change Currency"
	>
		<Settings class="w-4 h-4" />
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<!-- Backdrop -->
		<button
			class="fixed inset-0 z-10"
			onclick={() => isOpen = false}
			aria-label="Close currency selector"
		></button>
		
		<!-- Currency Selection Dropdown -->
		<div class="absolute right-0 top-full mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 max-h-96 overflow-hidden">
			<div class="p-4 border-b border-neutral-100">
				<h3 class="font-semibold text-neutral-900 text-sm">Select Currency</h3>
				<p class="text-neutral-500 text-xs mt-1">Choose your preferred African currency</p>
			</div>
			
			<div class="overflow-y-auto max-h-80">
				{#each activeCurrencies as currency}
					<button
						onclick={() => handleCurrencySelect(currency.code)}
						class="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors duration-150 flex items-center justify-between group"
					>
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
								<span class="text-neutral-700 font-semibold text-xs">
									{currency.code}
								</span>
							</div>
							<div>
								<p class="text-neutral-900 font-medium text-sm">
									{currency.name}
								</p>
								<p class="text-neutral-500 text-xs">
									{currency.symbol} • {currency.country}
								</p>
							</div>
						</div>
						
						{#if currentCurrency === currency.code}
							<Check class="w-4 h-4 text-green-600" />
						{/if}
					</button>
				{/each}
			</div>
			
			<div class="p-3 border-t border-neutral-100 bg-neutral-50">
				<p class="text-neutral-500 text-xs text-center">
					Supporting 39 African currencies
				</p>
			</div>
		</div>
	{/if}
</div>
