export type CodeforcesSubmission = {
  id: number;
  creationTimeSeconds: number;
  problem?: { contestId?: number; index?: string; name?: string };
  programmingLanguage?: string;
  verdict?: string;
};

export async function fetchCodeforcesAccepted(handle: string, contestId: string, index: string) {
  const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=100`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Codeforces API returned ${response.status}`);
  const payload = await response.json() as { status: string; comment?: string; result?: CodeforcesSubmission[] };
  if (payload.status !== 'OK') throw new Error(payload.comment || 'Codeforces API failed');
  const accepted = (payload.result || []).find((submission) =>
    String(submission.problem?.contestId || '') === String(contestId) &&
    String(submission.problem?.index || '').toUpperCase() === String(index || '').toUpperCase() &&
    submission.verdict === 'OK'
  );
  return accepted || null;
}
