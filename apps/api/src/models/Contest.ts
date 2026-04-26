import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
  title: String,
  platform: String,
  url: String,
  difficulty: String,
  tags: [String],
  stdin: String,
  expectedOutput: String
});

const MemberSchema = new mongoose.Schema({
  name: String,
  handle: String
});

const SolveSchema = new mongoose.Schema({
  memberId: String,
  problemId: String,
  solvedAtMinute: Number,
  attempts: Number
});

const ContestSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    startTime: String,
    durationMinutes: Number,
    members: [MemberSchema],
    problems: [ProblemSchema],
    solves: [SolveSchema]
  },
  { timestamps: true }
);

export const ContestModel =
  mongoose.models.Contest || mongoose.model('Contest', ContestSchema);
