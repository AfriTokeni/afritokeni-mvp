<script lang="ts">
	let { children } = $props();
</script>

<!-- No Header/Footer for user dashboard - DashboardLayout handles everything -->
{@render children()}
