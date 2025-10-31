<script lang="ts">
	import '../../app.css';
	let { children } = $props();
</script>

<!-- Override root layout - No Header/Footer for user dashboard -->
<div class="min-h-screen bg-white">
	{@render children()}
</div>
