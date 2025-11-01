/**
 * User Service
 * 
 * Handles all user-related data fetching.
 * Switches between demo data (JSON) and production backend (ICP/Juno).
 */

import { demoMode } from '$lib/stores/demoMode';
import { get } from 'svelte/store';

const DEMO_PATHS = {
	USER: '/data/demo/user.json',
	TRANSACTIONS: '/data/demo/transactions.json',
};

function isDemoMode(): boolean {
	return get(demoMode);
}

async function fetchDemoData<T>(path: string): Promise<T> {
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(`Failed to fetch demo data from ${path}`);
	}
	return response.json();
}

/**
 * Get user profile data
 */
export async function getUserData() {
	if (isDemoMode()) {
		return fetchDemoData(DEMO_PATHS.USER);
	}
	try {
		// const response = await fetch('/api/user');
		// return response.json();
		return null;
	} catch (error) {
		console.error('Failed to fetch user data:', error);
		return null;
	}
}

/**
 * Get user transactions
 */
export async function getTransactions() {
	if (isDemoMode()) {
		return fetchDemoData(DEMO_PATHS.TRANSACTIONS);
	}
	try {
		// const response = await fetch('/api/transactions');
		// return response.json();
		return [];
	} catch (error) {
		console.error('Failed to fetch transactions:', error);
		return [];
	}
}

/**
 * Get user fiat balance
 */
export async function getUserBalance() {
	if (isDemoMode()) {
		const user: any = await fetchDemoData(DEMO_PATHS.USER);
		return user.balance || 0;
	}
	try {
		// const response = await fetch('/api/user/balance');
		// const data = await response.json();
		// return data.balance;
		return 0;
	} catch (error) {
		console.error('Failed to fetch balance:', error);
		return 0;
	}
}

/**
 * Get user Bitcoin balance
 */
export async function getBitcoinBalance() {
	if (isDemoMode()) {
		const user: any = await fetchDemoData(DEMO_PATHS.USER);
		return user.bitcoinBalance || 0;
	}
	try {
		// const response = await fetch('/api/user/bitcoin-balance');
		// const data = await response.json();
		// return data.bitcoinBalance;
		return 0;
	} catch (error) {
		console.error('Failed to fetch Bitcoin balance:', error);
		return 0;
	}
}

/**
 * Get user ckBTC balance
 */
export async function getCkBTCBalance() {
	if (isDemoMode()) {
		const user: any = await fetchDemoData(DEMO_PATHS.USER);
		return user.ckBTCBalance || 0;
	}
	try {
		// const response = await fetch('/api/user/ckbtc-balance');
		// const data = await response.json();
		// return data.ckBTCBalance;
		return 0;
	} catch (error) {
		console.error('Failed to fetch ckBTC balance:', error);
		return 0;
	}
}

/**
 * Get user ckUSD balance
 */
export async function getCkUSDBalance() {
	if (isDemoMode()) {
		const user: any = await fetchDemoData(DEMO_PATHS.USER);
		return user.ckUSDBalance || 0;
	}
	try {
		// const response = await fetch('/api/user/ckusd-balance');
		// const data = await response.json();
		// return data.ckUSDBalance;
		return 0;
	} catch (error) {
		console.error('Failed to fetch ckUSD balance:', error);
		return 0;
	}
}
