<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		LayoutDashboard, 
		Send, 
		Banknote, 
		Vote, 
		Trophy, 
		MapPin, 
		History, 
		User, 
		LogOut,
		ChevronRight,
		Search
	} from '@lucide/svelte';
	import type { ComponentType } from 'svelte';

	interface Route {
		id: string;
		path: string;
		label: string;
		icon: ComponentType;
	}

	interface Props {
		userType: 'user' | 'agent' | 'admin';
		children?: any;
	}

	let { userType, children }: Props = $props();

	let isExpanded = $state(false);
	let searchQuery = $state('');

	const userRoutes: Route[] = [
		{ id: 'dashboard', path: '/users/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ id: 'send', path: '/users/send', label: 'Send', icon: Send },
		{ id: 'withdraw', path: '/users/withdraw', label: 'Withdraw', icon: Banknote },
		{ id: 'dao', path: '/users/dao', label: 'DAO Governance', icon: Vote },
		{ id: 'leaderboard', path: '/users/leaderboard', label: 'Leaderboard', icon: Trophy },
		{ id: 'agents', path: '/users/agents', label: 'Find Agents', icon: MapPin },
		{ id: 'history', path: '/users/history', label: 'Transaction History', icon: History },
		{ id: 'profile', path: '/users/profile', label: 'Profile & Settings', icon: User }
	];

	const routes = userRoutes; // Can extend for agent/admin later

	function isActive(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}

	function getPageTitle(): string {
		const currentRoute = routes.find(r => isActive(r.path));
		return currentRoute?.label || 'Dashboard';
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/${userType}s/history?search=${encodeURIComponent(searchQuery)}`);
		}
	}

	function handleLogout() {
		// TODO: Implement logout
		goto('/');
	}
</script>

<div class="min-h-screen bg-white">
	<!-- Desktop Sidebar -->
	<div
		class="fixed left-0 top-0 h-screen bg-black text-white transition-all duration-300 ease-in-out z-50 hidden md:block {isExpanded ? 'w-64' : 'w-16'}"
		onmouseenter={() => isExpanded = true}
		onmouseleave={() => isExpanded = false}
	>
		<!-- Logo Section -->
		<div class="h-16 flex items-center justify-center border-b border-gray-800">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
					<span class="text-black font-bold text-sm">AT</span>
				</div>
				{#if isExpanded}
					<span class="font-bold text-lg whitespace-nowrap">AfriTokeni</span>
				{/if}
			</div>
		</div>

		<!-- Navigation Items -->
		<nav class="flex-1 py-6">
			<ul class="space-y-1 px-2">
				{#each routes as route}
					{@const active = isActive(route.path)}
					<li>
						<button
							onclick={() => goto(route.path)}
							class="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 {active ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}"
						>
							<svelte:component this={route.icon} class="w-5 h-5 flex-shrink-0" />
							{#if isExpanded}
								<span class="text-sm font-medium whitespace-nowrap">{route.label}</span>
							{/if}
							{#if !isExpanded && active}
								<ChevronRight class="w-3 h-3 ml-auto" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- Logout Button -->
		<div class="p-2 border-t border-gray-800">
			<button
				onclick={handleLogout}
				class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-200"
			>
				<LogOut class="w-5 h-5 flex-shrink-0" />
				{#if isExpanded}
					<span class="text-sm font-medium whitespace-nowrap">Logout</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="md:ml-16 transition-all duration-300">
		<!-- Top Header Bar -->
		<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
			<div class="flex items-center gap-4 min-w-0 flex-1">
				<h1 class="text-base md:text-xl lg:text-2xl font-bold text-black truncate">{getPageTitle()}</h1>
			</div>
			
			<div class="flex items-center gap-2 md:gap-4 flex-shrink-0">
				<!-- Search Bar - Hidden on mobile -->
				<form onsubmit={handleSearch} class="relative hidden lg:block">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search transactions..."
						class="w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
					/>
				</form>
				
				<!-- User Avatar -->
				<button
					onclick={() => goto(`/${userType}s/profile`)}
					class="w-10 h-10 bg-black rounded-full items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden hidden sm:flex"
				>
					<span class="text-white text-sm font-semibold">
						{userType === 'user' ? 'U' : userType === 'agent' ? 'A' : 'AD'}
					</span>
				</button>
			</div>
		</header>

		<!-- Page Content -->
		<main class="p-4 md:p-8 pb-20 md:pb-8">
			{@render children?.()}
		</main>
	</div>

	<!-- Mobile Bottom Navigation -->
	<div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
		<nav class="flex justify-around items-center h-16 px-2">
			{#each routes.slice(0, 5) as route}
				{@const active = isActive(route.path)}
				<button
					onclick={() => goto(route.path)}
					class="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-colors {active ? 'text-black' : 'text-gray-400'}"
				>
					<svelte:component this={route.icon} class="w-5 h-5" />
					<span class="text-xs font-medium">{route.label.split(' ')[0]}</span>
				</button>
			{/each}
		</nav>
	</div>
</div>
