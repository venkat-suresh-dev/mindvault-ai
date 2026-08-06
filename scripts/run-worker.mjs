const baseUrl = (process.env.LOCAL_WORKER_URL ?? "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.JOB_RUNNER_SECRET;

if (!secret) {
  throw new Error("JOB_RUNNER_SECRET must be set in .env.local before running the local durable worker.");
}

const response = await fetch(`${baseUrl}/api/internal/jobs/run`, {
  headers: { authorization: `Bearer ${secret}` },
});

if (!response.ok) {
  throw new Error(`Local worker invocation failed (${response.status}). Confirm next dev is running and JOB_RUNNER_SECRET matches.`);
}

const result = await response.json();
process.stdout.write(`${result.ran ? "Processed one durable job." : "No queued durable job was due."}\n`);
