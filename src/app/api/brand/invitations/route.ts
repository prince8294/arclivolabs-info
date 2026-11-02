import { z } from "zod";
import { apiSuccess, ApiError, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { objectId, requireOwnedBrand } from "@/lib/portal-access";
import { connectToDatabase } from "@/lib/db";
import { readJson, validateMutationOrigin } from "@/lib/request";
import { enforceRateLimit } from "@/lib/rate-limit";
import Campaign from "@/models/Campaign";
import CampaignInvitation from "@/models/CampaignInvitation";
import Creator from "@/models/Creator";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { enqueueEmail } from "@/services/email.service";

const invitationSchema = z.object({
  campaignId: z.string().trim().min(1),
  creatorId: z.string().trim().min(1),
  deliverables: z.array(z.object({ description: z.string().trim().min(2).max(500), quantity: z.coerce.number().int().min(1).max(1000), platform: z.string().trim().max(50).optional() }).strict()).min(1).max(30),
  compensation: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
  deadline: z.coerce.date(),
  message: z.string().trim().max(2000).optional(),
  expiresAt: z.coerce.date().optional(),
}).strict();

export const GET = withApiErrors(async () => {
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user);
  await connectToDatabase();
  const invitations = await CampaignInvitation.find({ brand: brand._id })
    .populate("campaign", "title status").populate("creator", "fullName profileImage primaryPlatform")
    .sort({ createdAt: -1 }).limit(200).lean();
  return apiSuccess({ invitations });
});

export const POST = withApiErrors(async (request) => {
  validateMutationOrigin(request);
  const user = await requireRole(["brand"]);
  const brand = await requireOwnedBrand(user, { active: true });
  const body = invitationSchema.parse(await readJson(request));
  await enforceRateLimit({ scope: "brand-invitation", identity: user.id, limit: 30, windowMs: 60 * 60 * 1000 });
  await connectToDatabase();
  const [campaign, creator] = await Promise.all([
    Campaign.findOne({ _id: objectId(body.campaignId), brand: brand._id, status: { $in: ["approved", "active"] } }).select("_id title"),
    Creator.findOne({ _id: objectId(body.creatorId), approvalStatus: "approved", availability: "available" }).select("_id user"),
  ]);
  if (!campaign) throw new ApiError("An approved or active campaign belonging to your brand is required.", 404);
  if (!creator) throw new ApiError("Creator was not found or is unavailable.", 404);
  const expiresAt = body.expiresAt ?? new Date(Date.now() + 14 * 86400000);
  if (body.deadline <= new Date() || expiresAt <= new Date() || expiresAt > body.deadline) throw new ApiError("Invitation and deliverable deadlines must be in the future.", 400);
  await CampaignInvitation.updateMany({ campaign: campaign._id, creator: creator._id, status: "pending", expiresAt: { $lte: new Date() } }, { $set: { status: "expired" } });
  if (await CampaignInvitation.exists({ campaign: campaign._id, creator: creator._id, status: "pending", expiresAt: { $gt: new Date() } })) {
    throw new ApiError("This creator already has an active invitation for the campaign.", 409);
  }
  const invitation = await CampaignInvitation.create({
    campaign: campaign._id, brand: brand._id, creator: creator._id, invitedBy: user._id,
    deliverables: body.deliverables, compensation: body.compensation, currency: body.currency.toUpperCase(),
    deadline: body.deadline, message: body.message, expiresAt,
  });
  const recipient = creator.user ? await User.findOne({ _id: creator.user, status: "active" }).select("_id name email").lean() : null;
  if (recipient) {
    await Notification.create({
      recipient: recipient._id,
      type: "campaign_invitation",
      title: "New campaign invitation",
      message: "A brand invited you to collaborate on a campaign.",
      data: { href: "/creator/invitations", invitationId: invitation.id },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
    if (appUrl) {
      try {
        await enqueueEmail(
          recipient.email,
          `campaign-invitation:${invitation.id}`,
          {
            template: "campaign_invitation",
            data: {
              name: recipient.name,
              campaignTitle: campaign.title,
              invitationUrl: `${appUrl.replace(/\/$/, "")}/creator/invitations`,
            },
          },
        );
      } catch (error) {
        console.error("Campaign invitation email could not be queued.", error);
      }
    }
  }
  return apiSuccess({ invitation: { id: invitation.id, status: invitation.status }, notificationQueued: Boolean(recipient), emailQueued: Boolean(recipient) }, "Creator invitation sent.", 201);
});
