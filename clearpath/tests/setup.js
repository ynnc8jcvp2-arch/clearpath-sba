/**
 * Test Setup & Configuration
 * Initializes mock Supabase client and test utilities
 */

// Mock Supabase client for testing
// Supports full fluent builder chain: from().insert().select(), from().select().eq().eq().order(), etc.
export function createMockSupabaseClient() {
  function makeBuilder(table, resolvedData) {
    // The builder is both thenable (so await works) and has chainable methods
    const builder = {
      _data: resolvedData,

      // Thenable — allows `await builder`
      then(onFulfilled, onRejected) {
        return Promise.resolve({ data: this._data, error: null }).then(onFulfilled, onRejected);
      },
      catch(onRejected) {
        return Promise.resolve({ data: this._data, error: null }).catch(onRejected);
      },

      // Chain methods — each returns a new builder with same or narrowed data
      select(_cols) {
        return makeBuilder(table, this._data);
      },
      insert(rows) {
        const inserted = Array.isArray(rows)
          ? rows.map((r, i) => ({ id: `${table}_${Date.now()}_${i}`, ...r }))
          : [{ id: `${table}_${Date.now()}`, ...rows }];
        return makeBuilder(table, inserted);
      },
      update(patch) {
        const updated = Array.isArray(this._data)
          ? this._data.map(r => ({ ...r, ...patch }))
          : [{ id: `${table}_123`, ...patch }];
        return makeBuilder(table, updated);
      },
      eq(_col, _val) {
        // Narrow data — keep as-is (mock doesn't filter, tests just need array)
        return makeBuilder(table, this._data);
      },
      order(_col, _opts) {
        return makeBuilder(table, this._data);
      },
      async single() {
        const row = Array.isArray(this._data) ? this._data[0] : this._data;
        return { data: row ?? { id: `${table}_123` }, error: null };
      },
      limit(_n) {
        return makeBuilder(table, this._data);
      },
      range(_from, _to) {
        return makeBuilder(table, this._data);
      },
    };
    return builder;
  }

  return {
    from(table) {
      // Default data seed: one row with predictable id
      return makeBuilder(table, [{ id: `${table}_123` }]);
    },
  };
}

// Test utilities
export const assert = {
  equal: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  },

  approximately: (actual, expected, tolerance, message) => {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
      throw new Error(`${message}: expected ~${expected}, got ${actual} (diff: ${diff})`);
    }
  },

  truthy: (value, message) => {
    if (!value) throw new Error(`${message}: expected truthy, got ${value}`);
  },

  falsy: (value, message) => {
    if (value) throw new Error(`${message}: expected falsy, got ${value}`);
  },

  deepEqual: (actual, expected, message) => {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`${message}:\nExpected: ${expectedStr}\nActual: ${actualStr}`);
    }
  },

  isArray: (value, message) => {
    if (!Array.isArray(value)) {
      throw new Error(`${message}: expected array, got ${typeof value}`);
    }
  },

  hasProperty: (obj, prop, message) => {
    if (!(prop in obj)) {
      throw new Error(`${message}: object missing property "${prop}"`);
    }
  },
};

// Test runner
export async function runTests(testSuite) {
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const [name, testFn] of Object.entries(testSuite)) {
    try {
      await testFn();
      passed++;
      results.push({ name, status: '✅ PASS' });
    } catch (error) {
      failed++;
      results.push({ name, status: '❌ FAIL', error: error.message });
    }
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS');
  console.log('='.repeat(70));

  results.forEach(result => {
    console.log(`\n${result.status}: ${result.name}`);
    if (result.error) {
      console.log(`   ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`SUMMARY: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('='.repeat(70) + '\n');

  return { passed, failed, results };
}

// Format currency for test output
export function usd(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format percentage
export function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}
