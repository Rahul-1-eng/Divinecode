import { connectDB } from './db';
import { ContestModel } from './models/Contest';
import { SubmissionModel } from './models/Submission';
import { UserModel } from './models/User';

export async function upsertGoogleUser(input: { name?: string; email?: string; avatar?: string; googleId?: string }) {
  await connectDB();
  if (!input.email) throw new Error('Email is required');
  return UserModel.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        name: input.name || input.email,
        email: input.email,
        avatar: input.avatar,
        googleId: input.googleId,
        handle: input.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase()
      }
    },
    { upsert: true, new: true }
  );
}

export async function saveContestDocument(contest: any) {
  await connectDB();
  return ContestModel.findOneAndUpdate(
    { _id: contest.id },
    {
      $set: {
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        durationMinutes: contest.durationMinutes,
        members: contest.members,
        problems: contest.problems,
        solves: contest.solves
      }
    },
    { upsert: true, new: true }
  );
}

export async function saveSubmissionDocument(input: any) {
  await connectDB();
  return SubmissionModel.create(input);
}
