import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getAllCohortGroups, getCohortStudents, EnrichedStudent } from '@/lib/cohorts/service';
import { checkGoogleSheetsConnection } from '@/lib/cohorts/googleSheets';
import CohortClient from './CohortClient';

export const dynamic = 'force-dynamic';

export default async function CohortsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/cohorts');
  }

  const cohortGroups = await getAllCohortGroups();
  const connectionStatus = await checkGoogleSheetsConnection();

  // Find initial active cohort or default to the first group
  const defaultCohort =
    cohortGroups.find((g) => g.active && g.stats.totalStudents > 0) ||
    cohortGroups[0] ||
    null;

  let initialStudents: {
    students: EnrichedStudent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } = {
    students: [],
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  };

  if (defaultCohort) {
    initialStudents = await getCohortStudents(defaultCohort.cohortType, { page: 1, limit: 50 });
  }

  return (
    <CohortClient
      user={user}
      initialCohorts={JSON.parse(JSON.stringify(cohortGroups))}
      initialConnectionStatus={JSON.parse(JSON.stringify(connectionStatus))}
      initialSelectedCohortType={defaultCohort ? defaultCohort.cohortType : ''}
      initialStudents={JSON.parse(JSON.stringify(initialStudents))}
    />
  );
}
