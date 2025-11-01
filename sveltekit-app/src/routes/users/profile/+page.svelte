<script lang="ts">
	import { LogOut } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import ProfileHeader from './ProfileHeader.svelte';
	import ProfileInfoCards from './ProfileInfoCards.svelte';
	import AccountSettings from './AccountSettings.svelte';
	import SecurityPrivacy from './SecurityPrivacy.svelte';
	import TransactionLimits from './TransactionLimits.svelte';
	import HelpSupport from './HelpSupport.svelte';

	// Mock user data matching React
	const userData = {
		firstName: 'Nova',
		lastName: 'Pagac',
		phone: '+256 700 123 456',
		email: '4b7b-hng77-t1Fher-buczG-nrTm-h3mR-32axd-m3qzb-ryNqy-yoYcx-dae',
		balance: 500000,
		currency: 'UGX',
		isVerified: false,
		kycStatus: 'pending',
		joinDate: new Date('2025-11-01'),
		authMethod: 'web',
		location: null
	};

	let isEditing = $state(false);
	let expandedSections = $state({
		accountSettings: false,
		securityPrivacy: false,
		transactionLimits: false,
		helpSupport: false
	});

	function toggleEdit() {
		isEditing = !isEditing;
	}

	function toggleSection(section: keyof typeof expandedSections) {
		expandedSections[section] = !expandedSections[section];
	}

	function handleLogout() {
		goto('/');
	}
</script>

<div class="space-y-4 sm:space-y-6">
	<!-- Centered Profile Header -->
	<ProfileHeader {userData} onToggleEdit={toggleEdit} />

	<!-- Info Cards Grid -->
	<ProfileInfoCards {userData} />

	<!-- Expandable Sections -->
	<AccountSettings
		{userData}
		expanded={expandedSections.accountSettings}
		onToggle={() => toggleSection('accountSettings')}
	/>

	<SecurityPrivacy
		expanded={expandedSections.securityPrivacy}
		onToggle={() => toggleSection('securityPrivacy')}
	/>

	<TransactionLimits
		expanded={expandedSections.transactionLimits}
		onToggle={() => toggleSection('transactionLimits')}
	/>

	<HelpSupport
		expanded={expandedSections.helpSupport}
		onToggle={() => toggleSection('helpSupport')}
	/>

	<!-- Logout Button -->
	<button
		onclick={handleLogout}
		class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
	>
		<LogOut class="w-5 h-5" />
		Logout
	</button>
</div>
