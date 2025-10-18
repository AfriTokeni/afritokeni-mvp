/**
 * Test setup - runs before all tests
 * Mocks Juno to prevent IndexedDB errors in Node.js
 */

// Set test environment to disable rate limiting
process.env.NODE_ENV = 'test';

// Mock Juno satellite ID globally
process.env.VITE_JUNO_SATELLITE_ID = 'uxrrr-q7777-77774-qaaaq-cai';

// Create a global satellite state that Juno will use
const mockSatelliteState = {
  satelliteId: 'uxrrr-q7777-77774-qaaaq-cai',
  initialized: true
};

// Mock the @junobuild/core module before it's imported
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id: string) {
  if (id === '@junobuild/core') {
    const mockJuno = require('./mocks/juno');
    return {
      setDoc: mockJuno.mockJuno.setDoc,
      getDoc: mockJuno.mockJuno.getDoc,
      listDocs: mockJuno.mockJuno.listDocs,
      deleteDoc: async () => {},
      initSatellite: async () => mockSatelliteState,
      authSubscribe: () => () => {},
      listAssets: async () => ({ items: [], items_length: 0n, matches_length: 0n, items_page: 0n, matches_pages: 0n }),
      satelliteId: () => mockSatelliteState.satelliteId
    };
  }
  return originalRequire.apply(this, arguments as any);
};

console.log('✅ Test setup complete - Juno mocked');
