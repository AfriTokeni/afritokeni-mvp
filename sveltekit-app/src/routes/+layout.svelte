<script lang="ts">
	import '../app.css';
	import DemoModeBanner from '$lib/components/shared/DemoModeBanner.svelte';
	let { children } = $props();
</script>

<DemoModeBanner />
{@render children()}
