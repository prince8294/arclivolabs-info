import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { findOwnedCreator } from "@/lib/portal-access";
import { requireRole } from "@/lib/permissions";
import CampaignInvitation from "@/models/CampaignInvitation";
import Collaboration from "@/models/Collaboration";
import Deliverable from "@/models/Deliverable";
import Notification from "@/models/Notification";
import PaymentTransaction from "@/models/PaymentTransaction";
import CreatorApplication from "@/models/CreatorApplication";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["creator"]);
  await connectToDatabase();
  const [creator, application] = await Promise.all([
    findOwnedCreator(user),
    CreatorApplication.findOne({ $or: [{ user: user._id }, { email: user.email }] }).select("approvalStatus").sort({ createdAt: -1 }).lean(),
  ]);
  if (!creator) return apiSuccess({
    profile: null,
    profileCompletion: 0,
    profileSuggestions: ["Save your creator profile and submit it for agency review."],
    applicationStatus: application?.approvalStatus ?? "not_submitted",
    totals: { invitations: 0, pendingInvitations: 0, activeCampaigns: 0, completedCampaigns: 0, pendingDeliverables: 0, recordedEarnings: [] },
    invitations: [], collaborations: [], deliverables: [], notifications: [],
  });
  const [totalInvitations, pendingInvitations, collaborations, deliverables, earnings, recentInvitations, recentCollaborations, upcomingDeliverables, notifications] = await Promise.all([
    CampaignInvitation.countDocuments({ creator: creator._id }),
    CampaignInvitation.countDocuments({ creator: creator._id, status: "pending", expiresAt: { $gt: new Date() } }),
    Collaboration.aggregate([{ $match: { creator: creator._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Deliverable.countDocuments({ creator: creator._id, status: { $in: ["pending", "revision_requested"] } }),
    PaymentTransaction.aggregate([{ $match: { creator: creator._id, status: { $in: ["paid", "pending"] } } }, { $group: { _id: { status: "$status", currency: "$currency" }, total: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { "_id.currency": 1, "_id.status": 1 } }]),
    CampaignInvitation.find({ creator: creator._id }).select("campaign brand status compensation currency deadline expiresAt createdAt").populate("campaign", "title industry").populate("brand", "companyName companyLogo").sort({ createdAt: -1 }).limit(5).lean(),
    Collaboration.find({ creator: creator._id }).select("campaign brand status deadline agreedCompensation currency").populate("campaign", "title").populate("brand", "companyName").sort({ updatedAt: -1 }).limit(5).lean(),
    Deliverable.find({ creator: creator._id, status: { $in: ["pending", "revision_requested"] } }).select("description status dueAt campaign brand").populate("campaign", "title").sort({ dueAt: 1 }).limit(8).lean(),
    Notification.find({ recipient: user._id }).select("title message type readAt createdAt data").sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  const collaborationCounts = Object.fromEntries(collaborations.map((row) => [row._id, row.count])) as Record<string, number>;
  const profileChecks = [
    Boolean(creator.profileImage), Boolean(creator.bio?.trim()), Boolean(creator.primaryPlatform),
    creator.contentCategories.length > 0, creator.followers > 0, Boolean(creator.location?.trim()),
    creator.languages.length > 0, Boolean(creator.portfolioUrl),
    Boolean(creator.instagramUsername || creator.youtubeChannel || creator.otherSocialPlatforms.length),
  ];
  const profileSuggestions = [
    !creator.profileImage && "Add a clear profile photo.",
    !creator.bio?.trim() && "Write a concise creator bio.",
    !creator.languages.length && "Add the languages your audience speaks.",
    !creator.portfolioUrl && "Add a portfolio link or upload portfolio examples.",
    !creator.instagramUsername && !creator.youtubeChannel && !creator.otherSocialPlatforms.length && "Connect at least one social account.",
  ].filter((suggestion): suggestion is string => Boolean(suggestion));
  return apiSuccess({
    profile: {
      id: creator.id, fullName: creator.fullName, profileImage: creator.profileImage,
      approvalStatus: creator.approvalStatus, metricsVerificationStatus: creator.metricsVerificationStatus,
      completion: Math.round(profileChecks.filter(Boolean).length / profileChecks.length * 100),
      improvementSuggestions: profileSuggestions,
    },
    totals: {
      invitations: totalInvitations,
      pendingInvitations,
      activeCampaigns: (collaborationCounts.accepted ?? 0) + (collaborationCounts.in_progress ?? 0) + (collaborationCounts.content_submitted ?? 0) + (collaborationCounts.revision_requested ?? 0) + (collaborationCounts.approved ?? 0),
      completedCampaigns: collaborationCounts.completed ?? 0,
      pendingDeliverables: deliverables,
      recordedEarnings: earnings,
    },
    invitations: recentInvitations,
    collaborations: recentCollaborations,
    deliverables: upcomingDeliverables,
    notifications,
  });
});
