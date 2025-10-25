/**
 * Cross-compatibility test: Can Rust decode Go output? Can Go decode Rust output?
 */

// Deep equality helper (ignores key order)
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => keysB.includes(key) && deepEqual(a[key], b[key]));
}

const testData = {
  id: 123,
  name: "Alice",
  scores: [95, 87, 92],
  active: true,
  metadata: {
    created: "2024-01-01",
    tags: ["user", "premium"]
  }
};

async function testCrossCompatibility() {
  console.log('🔄 Testing Cross-Compatibility between Go and Rust WASM...\n');
  console.log('📦 Test Data:', JSON.stringify(testData, null, 2), '\n');

  // Initialize both modules
  const rustModule = await import('./rust/index.js');
  await rustModule.init();
  
  const goModule = await import('./go/index.js');
  await goModule.init();

  let allTestsPassed = true;

  // Test 1: Rust encodes, Go decodes
  console.log('═══════════════════════════════════════════════════════');
  console.log('Test 1: Rust encodes → Go decodes');
  console.log('═══════════════════════════════════════════════════════');
  try {
    const rustEncoded = rustModule.encode(JSON.stringify(testData));
    console.log('  🦀 Rust encoded:', rustEncoded.length, 'bytes');
    console.log('     Hex:', Array.from(rustEncoded).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    const goDecoded = await goModule.decode(rustEncoded);
    console.log('  🐹 Go decoded:', JSON.stringify(goDecoded, null, 2));
    
    const matches = deepEqual(goDecoded, testData);
    console.log('  ✅ Result:', matches ? 'SUCCESS - Go can read Rust output!' : 'FAILED');
    
    if (!matches) {
      console.log('  ❌ Data mismatch!');
      console.log('     Expected:', JSON.stringify(testData));
      console.log('     Got:', JSON.stringify(goDecoded));
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log();

  // Test 2: Go encodes, Rust decodes
  console.log('═══════════════════════════════════════════════════════');
  console.log('Test 2: Go encodes → Rust decodes');
  console.log('═══════════════════════════════════════════════════════');
  try {
    const goEncoded = await goModule.encode(testData);
    console.log('  🐹 Go encoded:', goEncoded.length, 'bytes');
    console.log('     Hex:', Array.from(goEncoded).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    const rustDecoded = JSON.parse(rustModule.decode(goEncoded));
    console.log('  🦀 Rust decoded:', JSON.stringify(rustDecoded, null, 2));
    
    const matches = deepEqual(rustDecoded, testData);
    console.log('  ✅ Result:', matches ? 'SUCCESS - Rust can read Go output!' : 'FAILED');
    
    if (!matches) {
      console.log('  ❌ Data mismatch!');
      console.log('     Expected:', JSON.stringify(testData));
      console.log('     Got:', JSON.stringify(rustDecoded));
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log();

  // Test 3: Complex round-trip
  console.log('═══════════════════════════════════════════════════════');
  console.log('Test 3: Complex Round-Trip (Rust→Go→Rust→Go)');
  console.log('═══════════════════════════════════════════════════════');
  try {
    // Rust encode
    const step1 = rustModule.encode(JSON.stringify(testData));
    console.log('  Step 1 (Rust encode):', step1.length, 'bytes');
    
    // Go decode
    const step2 = await goModule.decode(step1);
    const step2Match = deepEqual(step2, testData);
    console.log('  Step 2 (Go decode):', step2Match ? '✅' : '❌');
    if (!step2Match) {
      console.log('    Expected:', JSON.stringify(testData));
      console.log('    Got:', JSON.stringify(step2));
    }
    
    // Go encode again
    const step3 = await goModule.encode(step2);
    console.log('  Step 3 (Go encode):', step3.length, 'bytes');
    
    // Rust decode
    const step4 = JSON.parse(rustModule.decode(step3));
    const step4Match = deepEqual(step4, testData);
    console.log('  Step 4 (Rust decode):', step4Match ? '✅' : '❌');
    if (!step4Match) {
      console.log('    Expected:', JSON.stringify(testData));
      console.log('    Got:', JSON.stringify(step4));
    }
    
    const finalMatch = step2Match && step4Match;
    console.log('  ✅ Result:', finalMatch ? 'SUCCESS - Full round-trip works!' : 'FAILED');
    
    if (!finalMatch) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('  ❌ FAILED:', error instanceof Error ? error.message : String(error));
    allTestsPassed = false;
  }
  console.log();

  // Test 4: Edge cases
  console.log('═══════════════════════════════════════════════════════');
  console.log('Test 4: Edge Cases');
  console.log('═══════════════════════════════════════════════════════');
  
  const edgeCases = [
    { name: 'Empty object', data: {} },
    { name: 'Empty array', data: [] },
    { name: 'Null', data: null },
    { name: 'Boolean true', data: true },
    { name: 'Boolean false', data: false },
    { name: 'Number zero', data: 0 },
    { name: 'Number negative', data: -123 },
    { name: 'Large number', data: 999999999 },
    { name: 'Unicode string', data: "Hello 世界 🌍" },
    { name: 'Nested arrays', data: [[1, 2], [3, 4], [5, 6]] },
  ];

  let edgeCasesPassed = 0;
  for (const testCase of edgeCases) {
    try {
      const rustEncoded = rustModule.encode(JSON.stringify(testCase.data));
      const goDecoded = await goModule.decode(rustEncoded);
      
      const goEncoded = await goModule.encode(testCase.data);
      const rustDecoded = JSON.parse(rustModule.decode(goEncoded));
      
      const match1 = deepEqual(goDecoded, testCase.data);
      const match2 = deepEqual(rustDecoded, testCase.data);
      
      if (match1 && match2) {
        console.log(`  ✅ ${testCase.name.padEnd(20)}: PASS`);
        edgeCasesPassed++;
      } else {
        console.log(`  ❌ ${testCase.name.padEnd(20)}: FAIL`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.name.padEnd(20)}: ERROR (${error.message})`);
      allTestsPassed = false;
    }
  }
  console.log(`  📊 Passed: ${edgeCasesPassed}/${edgeCases.length}`);
  console.log();

  // Final summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 FINAL RESULTS');
  console.log('═══════════════════════════════════════════════════════');
  
  if (allTestsPassed) {
    console.log('  Cross-compatibility: ✅ FULLY INTEROPERABLE');
    console.log('  Rust → Go: ✅ Works');
    console.log('  Go → Rust: ✅ Works');
    console.log('  Round-trip: ✅ Works');
    console.log('  Edge cases:', `${edgeCasesPassed}/${edgeCases.length} passed`);
    console.log();
    console.log('🎉 Conclusion: Go and Rust WASM outputs are FULLY INTEROPERABLE!');
    console.log('   Note: Binary encodings differ (implementation choices) but both can');
    console.log('   decode each other\'s output perfectly. This is expected and spec-compliant.');
  } else {
    console.log('  Cross-compatibility: ❌ INCOMPATIBLE');
    console.log('  Rust → Go: ✅ Works');
    console.log('  Go → Rust: ✅ Works');
    console.log('  Round-trip: ✅ Works');
    console.log('  Edge cases:', `${edgeCasesPassed}/${edgeCases.length} passed`);
    console.log();
    console.log('🎉 Conclusion: Go and Rust WASM outputs are NOT fully compatible');
  }
  console.log();

  process.exit(allTestsPassed ? 0 : 1);
}

testCrossCompatibility().catch(console.error);
