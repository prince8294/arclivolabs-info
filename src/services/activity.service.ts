import { createHash } from "node:crypto";
import ActivityLog from "@/models/ActivityLog";
import { connectToDatabase } from "@/lib/db";

type ActivityInput = {
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, string | number | boolean>;
};

export async function writeActivityLog(input: ActivityInput): Promise<void> {
  await connectToDatabase();
  await ActivityLog.create({
    actor: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    ipHash: input.ipAddress ? createHash("sha256").update(input.ipAddress).digest("hex") : undefined,
    metadata: input.metadata,
  });
}

export async function recordCommittedActivity(input: ActivityInput): Promise<void> {
  try {
    await writeActivityLog(input);
  } catch (error) {
    console.error(`Activity log persistence failed for ${input.action}.`, error);
  }
}
