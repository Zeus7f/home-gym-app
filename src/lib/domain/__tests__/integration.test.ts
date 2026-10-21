// Integration Test: trainer publishes a program → member sees it
// Exercises the store, the API layer and the analytics together.

import { gymStore } from '../../supabase/mockStore';
import { saveProgram, publishProgram, getPublishedProgram } from '../../../api/programs';
import { getMemberSessions } from '../../../api/members';
import { getNotifications } from '../../../api/notifications';
import { computeMemberAnalytics } from '../memberAnalytics';
import { EXERCISE_CATALOG } from '../../exercises/catalog';
import { getTodayJalaliKey } from '../../date/jalali';
import type { ProgramExercise } from '../gymManagement';

export async function runIntegrationTests(): Promise<{
  passed: number;
  failed: number;
  errors: string[];
}> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`Assertion failed: ${testName}`);
    }
  }

  const originalPrograms = gymStore.programs;
  const originalAuditLogs = gymStore.auditLogs;
  gymStore.programs = [];
  gymStore.auditLogs = [];

  const member = gymStore.members.find(m => m.id === 'm-reza')!;
  const trainer = gymStore.trainers.find(t => t.id === 't-ali')!;

  const benchPress = EXERCISE_CATALOG.find(e => e.id === 'ex-bench-press')!;

  const programExercise: ProgramExercise = {
    exerciseId: benchPress.id,
    name: benchPress.nameFa,
    bodyPart: benchPress.primaryMuscleFa || benchPress.bodyPartFa,
    equipment: benchPress.equipmentFa,
    sets: 4,
    repsMin: 8,
    repsMax: 10,
    loadKg: 40,
  };

  // ── 1. Save a draft ─────────────────────────────────────────────
  const draft = await saveProgram({
    memberId: member.id,
    memberName: member.name,
    trainerId: trainer.id,
    trainerName: trainer.name,
    title: 'برنامه ادغامی تست',
    days: [{ id: 'day-1', title: 'روز ۱ — بالاتنه', items: [programExercise] }],
  });

  assert(draft.status === 'draft', 'a newly saved program should be a draft');
  assert(draft.id.startsWith('prog-'), 'the program should receive a generated id');

  // ورزشکار نباید هنوز برنامه منتشرشده‌ای ببیند
  assert(
    (await getPublishedProgram(member.id)) === undefined,
    'a draft program must not be visible to the member'
  );

  // ── 2. Publish ──────────────────────────────────────────────────
  const published = await publishProgram(draft.id);
  assert(published.success === true, 'publishing a valid program should succeed');

  const visible = await getPublishedProgram(member.id);
  assert(visible !== undefined, 'the member should see the published program');
  assert(visible?.title === 'برنامه ادغامی تست', 'the program title should match');
  assert(visible?.status === 'published', 'the program status should be published');
  assert(visible?.days.length === 1, 'the published program should keep its day');
  assert(visible?.days[0].items.length === 1, 'the published program should keep its exercises');
  assert(
    visible?.days[0].items[0].exerciseId === 'ex-bench-press',
    'the published exercise should keep the real catalog exerciseId'
  );

  // audit log
  assert(
    gymStore.auditLogs.some(a => a.action === 'PROGRAM_PUBLISHED'),
    'publishing should write a PROGRAM_PUBLISHED audit entry'
  );

  // ── 3. Publishing a second program demotes the first ────────────
  const second = await saveProgram({
    memberId: member.id,
    memberName: member.name,
    trainerId: trainer.id,
    trainerName: trainer.name,
    title: 'برنامه دوم',
    days: [{ id: 'day-1', title: 'روز ۱', items: [programExercise] }],
  });
  await publishProgram(second.id);

  assert(
    gymStore.programs.find(p => p.id === draft.id)?.status === 'draft',
    'publishing a new program should demote the previous one to draft'
  );
  assert(
    (await getPublishedProgram(member.id))?.title === 'برنامه دوم',
    'the member should see only the latest published program'
  );

  // ── 4. Publishing an empty program is rejected ──────────────────
  const empty = await saveProgram({
    memberId: member.id,
    memberName: member.name,
    trainerId: trainer.id,
    trainerName: trainer.name,
    title: 'برنامه خالی',
    days: [],
  });
  const emptyRes = await publishProgram(empty.id);
  assert(emptyRes.success === false, 'publishing a program with no days should fail');
  assert(
    gymStore.programs.find(p => p.id === empty.id)?.status === 'draft',
    'a rejected publish must leave the program as a draft'
  );

  // روز بدون حرکت هم نباید منتشر شود
  const emptyDay = await saveProgram({
    memberId: member.id,
    memberName: member.name,
    trainerId: trainer.id,
    trainerName: trainer.name,
    title: 'برنامه با روز خالی',
    days: [{ id: 'day-1', title: 'روز ۱', items: [] }],
  });
  const emptyDayRes = await publishProgram(emptyDay.id);
  assert(emptyDayRes.success === false, 'publishing a program with an empty day should fail');

  // ── 5. The member gets a notification about it ──────────────────
  const originalUser = gymStore.currentUser;
  gymStore.currentUser = {
    id: 'u-reza',
    username: 'reza',
    password: '123',
    role: 'member',
    entityId: member.id,
    displayName: member.name,
  };

  const notifications = await getNotifications();
  assert(
    notifications.some(n => n.kind === 'program_published'),
    'the member should get a notification when a program is published'
  );

  gymStore.currentUser = originalUser;

  // ── 6. The published program joins to the analytics pipeline ────
  // یک جلسه تکمیل‌شده با همان حرکت برنامه بسازیم و ببینیم تحلیل آن را می‌بیند
  const originalToday = gymStore.todaySessions;
  gymStore.todaySessions = [
    {
      id: 'sess-int',
      date: 'Today',
      time: '10:00',
      memberId: member.id,
      memberName: member.name,
      trainerId: trainer.id,
      trainerName: trainer.name,
      status: 'completed',
      exercises: [
        {
          id: 'rec-int',
          exerciseId: 'ex-bench-press',
          name: benchPress.nameFa,
          bodyPart: 'سینه',
          equipment: 'هالتر',
          sets: 4,
          reps: 8,
          weightKg: 40,
          completedSets: [
            { r: 8, w: 40, d: true },
            { r: 8, w: 40, d: true },
            { r: 8, w: 42.5, d: true },
            { r: 8, w: 42.5, d: true },
          ],
        },
      ],
    },
  ];

  const sessions = await getMemberSessions(member.id);
  assert(sessions.length > 0, 'the member should have sessions');

  const analytics = computeMemberAnalytics({
    sessions,
    catalog: EXERCISE_CATALOG,
    todayKey: getTodayJalaliKey(),
  });
  assert(
    analytics.totalCompletedSessions >= 1,
    'the integration session should be counted as completed'
  );
  assert(
    analytics.mainExerciseName.includes('پرس سینه'),
    'the bench press should become the main exercise in the analytics'
  );
  assert(
    analytics.progression !== null,
    'the analytics should produce a progression recommendation from the session'
  );
  assert(
    analytics.personalRecords.length > 0,
    'the analytics should detect personal records from the session'
  );

  gymStore.todaySessions = originalToday;
  gymStore.programs = originalPrograms;
  gymStore.auditLogs = originalAuditLogs;

  return { passed, failed, errors };
}
