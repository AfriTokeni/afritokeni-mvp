<script lang="ts">
	import { onMount } from 'svelte';
	import { Navigation } from '@lucide/svelte';
	import AgentSearchFilters from './AgentSearchFilters.svelte';
	import AgentCard from './AgentCard.svelte';
	import AgentMap from './AgentMap.svelte';
	import { mockAgents, calculateDistance, type Agent, type UserLocation } from '$lib/utils/agents';
	import 'leaflet/dist/leaflet.css';

	let agents = $state<Agent[]>([]);
	let userLocation = $state<UserLocation | null>(null);
	let searchQuery = $state('');
	let filterRadius = $state(10);
	let showOnlineOnly = $state(false);
	let loading = $state(true);
	let viewMode = $state<'list' | 'map'>('list');
	let locationPermission = $state<'granted' | 'denied' | 'prompt'>('prompt');

	onMount(() => {
		loadAgents();
		requestUserLocation();
	});

	function loadAgents() {
		loading = true;
		agents = mockAgents;
		loading = false;
	}

	function requestUserLocation() {
		if ('geolocation' in navigator) {
			// Set to prompt state while requesting
			locationPermission = 'prompt';
			
			navigator.geolocation.getCurrentPosition(
				(position) => {
					userLocation = {
						lat: position.coords.latitude,
						lng: position.coords.longitude
					};
					locationPermission = 'granted';
				},
				(error) => {
					console.error('Geolocation error:', error);
					// Default to Kampala center
					userLocation = { lat: 0.3476, lng: 32.5825 };
					locationPermission = 'denied';
					
					// Show alert to user
					if (error.code === error.PERMISSION_DENIED) {
						alert('Location access denied. Please enable location permissions in your browser settings to use distance filtering.');
					}
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				}
			);
		} else {
			userLocation = { lat: 0.3476, lng: 32.5825 };
			locationPermission = 'denied';
			alert('Geolocation is not supported by your browser.');
		}
	}

	const filteredAgents = $derived(() => {
		let filtered = agents;

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(a) =>
					a.businessName.toLowerCase().includes(query) ||
					a.location.address.toLowerCase().includes(query) ||
					a.location.city.toLowerCase().includes(query)
			);
		}

		// Online filter
		if (showOnlineOnly) {
			filtered = filtered.filter((a) => a.isActive);
		}

		// Distance filter
		if (userLocation) {
			filtered = filtered.filter((a) => {
				const distance = calculateDistance(
					userLocation.lat,
					userLocation.lng,
					a.location.coordinates.lat,
					a.location.coordinates.lng
				);
				return distance <= filterRadius;
			});

			// Sort by distance
			filtered.sort((a, b) => {
				const distA = calculateDistance(
					userLocation.lat,
					userLocation.lng,
					a.location.coordinates.lat,
					a.location.coordinates.lng
				);
				const distB = calculateDistance(
					userLocation.lat,
					userLocation.lng,
					b.location.coordinates.lat,
					b.location.coordinates.lng
				);
				return distA - distB;
			});
		}

		return filtered;
	});

	function getAgentDistance(agent: Agent): number | undefined {
		if (!userLocation) return undefined;
		return calculateDistance(
			userLocation.lat,
			userLocation.lng,
			agent.location.coordinates.lat,
			agent.location.coordinates.lng
		);
	}
</script>

<div class="space-y-4 sm:space-y-6">
	<!-- Location Permission Banner -->
	{#if locationPermission === 'denied'}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<div class="flex items-start gap-3">
				<Navigation class="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
				<div class="flex-1">
					<h3 class="font-semibold text-yellow-900 text-sm">Location Access Denied</h3>
					<p class="text-sm text-yellow-700 mt-1">
						Enable location access to find agents near you. Showing default location (Kampala).
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Search and Filters -->
	<AgentSearchFilters
		{searchQuery}
		{filterRadius}
		{showOnlineOnly}
		{viewMode}
		{locationPermission}
		onSearchChange={(value) => (searchQuery = value)}
		onRadiusChange={(value) => (filterRadius = value)}
		onOnlineToggle={() => (showOnlineOnly = !showOnlineOnly)}
		onViewModeChange={(mode) => (viewMode = mode)}
		onEnableLocation={requestUserLocation}
	/>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
				<p class="text-sm text-gray-600">Loading agents...</p>
			</div>
		</div>
	{:else if viewMode === 'list'}
		<!-- List View -->
		{#if filteredAgents().length === 0}
			<div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
				<p class="text-gray-600">No agents found matching your criteria.</p>
				<button
					onclick={() => {
						searchQuery = '';
						showOnlineOnly = false;
						filterRadius = 100;
					}}
					class="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
				>
					Reset Filters
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredAgents() as agent}
					<AgentCard {agent} distance={getAgentDistance(agent)} />
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Map View -->
		<AgentMap agents={filteredAgents()} {userLocation} />
		
		<!-- Agent Count -->
		<div class="text-sm text-gray-600 mt-4">
			Found {filteredAgents().length} agent{filteredAgents().length === 1 ? '' : 's'}
			{#if filteredAgents().filter(a => a.isActive).length > 0}
				• {filteredAgents().filter(a => a.isActive).length} online
			{/if}
		</div>
	{/if}
</div>
