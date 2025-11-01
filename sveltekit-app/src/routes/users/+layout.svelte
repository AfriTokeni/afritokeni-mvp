<script lang="ts">
	import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
	let { children } = $props();
</script>

<DashboardLayout userType="user">
	{@render children()}
</DashboardLayout>
