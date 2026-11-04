import { runAllDomainTests } from './domain.test';
import { runMemberAnalyticsTests } from './memberAnalytics.test';
import { runStoreTests } from './store.test';
import { runIntegrationTests } from './integration.test';
import { runBugfixTests } from './bugfixes.test';
import { runAuthTests } from './auth.test';
import { runRolesTests } from './roles.test';
import { runReportingTests } from './reporting.test';
import { runSessionDraftTests } from '../../../features/trainer/hooks/__tests__/useSessionDraft.test';
import { gymStore } from '../../store/gymStore';

async function main() {
  console.log('--- Running GymVero Domain Tests ---');

  // استور دیگر خودکار با دادهٔ نمونه پر نمی‌شود (مرورگر آن را لازم ندارد)،
  // پس تست‌ها پیش از اجرا باشگاه دمو را صریحاً بار می‌کنند.
  await gymStore.loadDemoData();

  const suites = [
    ['domain', runAllDomainTests()],
    ['memberAnalytics', runMemberAnalyticsTests()],
    ['store', runStoreTests()],
    ['sessionDraft', runSessionDraftTests()],
    ['integration', await runIntegrationTests()],
    ['bugfixes', runBugfixTests()],
    ['auth', await runAuthTests()],
    ['roles', runRolesTests()],
    ['reporting', runReportingTests()],
  ] as const;

  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [name, result] of suites) {
    passed += result.passed;
    failed += result.failed;
    for (const e of result.errors) errors.push(`[${name}] ${e}`);
    console.log(`  ${name}: ${result.passed} passed, ${result.failed} failed`);
  }

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error('Test failures:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('All domain tests passed cleanly!');
    process.exit(0);
  }
}

main();
