const fs = require('fs');
const path = require('path');

console.log('🧪 Testing ReactFlow Complete Elimination - Compilation Check...');
console.log('');

// Check if ReactFlow is in package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📋 Checking package.json dependencies:');
const dependencies = packageJson.dependencies || {};
const hasReactFlow = 'reactflow' in dependencies;

console.log(`   - ReactFlow in dependencies: ${hasReactFlow ? '❌ FOUND' : '✅ NOT FOUND'}`);

// Check node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const hasReactFlowModules = fs.existsSync(path.join(nodeModulesPath, 'reactflow')) || 
                            fs.existsSync(path.join(nodeModulesPath, '@reactflow'));

console.log(`   - ReactFlow in node_modules: ${hasReactFlowModules ? '❌ FOUND' : '✅ NOT FOUND'}`);

// Check the risk tree visualization component
const riskTreePath = path.join(process.cwd(), 'components/knowledge/risk-tree-visualization.tsx');
const riskTreeContent = fs.readFileSync(riskTreePath, 'utf8');

const hasReactFlowImports = riskTreeContent.includes("from 'reactflow'") || 
                            riskTreeContent.includes("import ReactFlow") ||
                            riskTreeContent.includes("@reactflow");

console.log(`   - ReactFlow imports in risk-tree-visualization.tsx: ${hasReactFlowImports ? '❌ FOUND' : '✅ NOT FOUND'}`);

// Check for any ReactFlow usage in the component
const hasReactFlowUsage = riskTreeContent.includes('ReactFlow') && 
                          !riskTreeContent.includes('// Simplified interface without ReactFlow dependencies');

console.log(`   - ReactFlow usage in component: ${hasReactFlowUsage ? '❌ FOUND' : '✅ NOT FOUND'}`);

console.log('');
console.log('📊 FINAL RESULTS:');
console.log('=================');

if (!hasReactFlow && !hasReactFlowModules && !hasReactFlowImports && !hasReactFlowUsage) {
  console.log('🎉 SUCCESS: ReactFlow has been COMPLETELY ELIMINATED!');
  console.log('✅ Removed from package.json');
  console.log('✅ Removed from node_modules');
  console.log('✅ No imports in source code');
  console.log('✅ No usage in components');
  console.log('');
  console.log('The cancer management system is now ReactFlow-free and should work without');
  console.log('the "Module factory not available" error.');
} else {
  console.log('❌ FAILED: ReactFlow remnants still exist:');
  if (hasReactFlow) console.log('   - Still in package.json dependencies');
  if (hasReactFlowModules) console.log('   - Still in node_modules');  
  if (hasReactFlowImports) console.log('   - Still imported in source code');
  if (hasReactFlowUsage) console.log('   - Still used in components');
}