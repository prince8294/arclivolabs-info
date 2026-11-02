import mongoose, { type ClientSession } from "mongoose";
import { ApiError } from "@/lib/api-response";
import { objectId } from "@/lib/portal-access";
import Campaign from "@/models/Campaign";
import CampaignInvitation from "@/models/CampaignInvitation";
import Collaboration from "@/models/Collaboration";
import Creator from "@/models/Creator";
import Deliverable from "@/models/Deliverable";
import Brand from "@/models/Brand";
import Notification from "@/models/Notification";
import { recordCommittedActivity } from "@/services/activity.service";
import type { UserRecord } from "@/models/User";

async function runWithOptionalTransaction<T>(operation: (session?: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    try {
      await session.withTransaction(async () => { result = await operation(session); });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
      const message = error instanceof Error ? error.message : "";
      if (code !== 20 && !message.includes("Transaction numbers are only allowed")) throw error;
      return operation();
    }
    if (result === undefined) throw new Error("Invitation transaction completed without a result.");
    return result;
  } finally {
    await session.endSession();
  }
}

export async function respondToCampaignInvitation(user: UserRecord, invitationId: string, response: "accepted" | "rejected") {
  const creator = await Creator.findOne({ user: user._id }).select("_id");
  if (!creator) throw new ApiError("An approved creator profile is required.", 409);
  const _id = objectId(invitationId);
  const now = new Date();

  if (response === "rejected") {
    const invitation = await CampaignInvitation.findOneAndUpdate(
      { _id, creator: creator._id, status: "pending", expiresAt: { $gt: now } },
      { $set: { status: "rejected", respondedAt: now } },
      { returnDocument: "after" },
    );
    if (!invitation) throw new ApiError("Invitation was not found, has expired, or was already answered.", 409);
    await recordCommittedActivity({ actorId: user._id.toString(), action: "campaign.invitation_rejected", resourceType: "CampaignInvitation", resourceId: invitation.id });
    return { invitation, collaboration: null };
  }

  const existingInvitation = await CampaignInvitation.findOne({ _id, creator: creator._id });
  if (!existingInvitation) throw new ApiError("Invitation was not found.", 404);
  if (existingInvitation.status === "accepted") {
    const collaboration = await Collaboration.findOne({ invitation: existingInvitation._id }).lean();
    if (!collaboration) throw new ApiError("The invitation was accepted but its collaboration record is missing. Contact support.", 409);
    return { invitation: existingInvitation, collaboration };
  }
  if (existingInvitation.status !== "pending" || existingInvitation.expiresAt <= now) {
    if (existingInvitation.status === "pending") await CampaignInvitation.updateOne({ _id, status: "pending" }, { $set: { status: "expired" } });
    throw new ApiError("Invitation has expired or is no longer available.", 409);
  }

  const result = await runWithOptionalTransaction(async (session) => {
    const invitation = await CampaignInvitation.findOneAndUpdate(
      { _id, creator: creator._id, status: "pending", expiresAt: { $gt: now } },
      { $set: { status: "accepted", respondedAt: now } },
      { returnDocument: "after", session },
    );
    if (!invitation) throw new ApiError("Invitation has already been answered or has expired.", 409);
    const [collaboration] = await Collaboration.create([{
      invitation: invitation._id,
      campaign: invitation.campaign,
      brand: invitation.brand,
      creator: creator._id,
      agreedCompensation: invitation.compensation,
      currency: invitation.currency,
      deliverables: invitation.deliverables,
      deadline: invitation.deadline,
      status: "accepted",
      agreementStatus: "accepted",
    }], session ? { session } : {});
    await Deliverable.insertMany(invitation.deliverables.map((item: { description: string; quantity: number; platform?: string }) => ({
      collaboration: collaboration._id,
      campaign: invitation.campaign,
      brand: invitation.brand,
      creator: creator._id,
      description: item.description,
      dueAt: invitation.deadline,
      status: "pending",
    })), session ? { session } : {});
    await Campaign.updateOne({ _id: invitation.campaign }, { $addToSet: { selectedCreators: creator._id } }, session ? { session } : {});
    return { invitation, collaboration };
  });

  const brand = await Brand.findById(result.invitation.brand).select("user").lean();
  if (brand?.user) await Notification.create({
    recipient: brand.user,
    type: "invitation_accepted",
    title: "Creator accepted an invitation",
    message: "A creator accepted your campaign invitation.",
    data: { href: `/brand/campaigns/${result.invitation.campaign}`, invitationId: result.invitation.id },
  });
  await recordCommittedActivity({ actorId: user._id.toString(), action: "campaign.invitation_accepted", resourceType: "CampaignInvitation", resourceId: result.invitation.id });
  return result;
}
