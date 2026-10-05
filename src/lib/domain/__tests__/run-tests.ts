import { runAllDomainTests } from './domain.test';

console.log('--- Running Home Gym Domain Tests ---');
const result = runAllDomainTests();
console.log(`Passed: ${result.passed}`);
console.log(`Failed: ${result.failed}`);

if (result.failed > 0) {
  console.error('Test failures:');
  result.errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('All domain tests passed cleanly!');
  process.exit(0);
}
