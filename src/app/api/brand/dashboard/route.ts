import { apiSuccess, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/lib/permissions";
import { findOwnedBrand } from "@/lib/portal-access";
import { connectToDatabase } from "@/lib/db";
import Campaign from "@/models/Campaign";
import CampaignInvitation from "@/models/CampaignInvitation";
import Collaboration from "@/models/Collaboration";
import Deliverable from "@/models/Deliverable";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Notification from "@/models/Notification";

export const GET = withApiErrors(async () => {
  const user = await requireRole(["brand"]);
  await connectToDatabase();
  const brand = await findOwnedBrand(user);
  if (!brand) return apiSuccess({ brand: null, totals: null, campaigns: [], collaborations: [], deliverables: [] });
  const [campaigns, activeCampaigns, completedCampaigns, invitations, hiredCreatorIds, deliverables, recentCampaigns, recentCollaborations, upcomingDeliverables, notifications, progressGroups] = await Promise.all([
    Campaign.countDocuments({ brand: brand._id }),
    Campaign.countDocuments({ brand: brand._id, status: "active" }),
    Campaign.countDocuments({ brand: brand._id, status: "completed" }),
    CampaignInvitation.countDocuments({ brand: brand._id, status: "pending" }),
    Collaboration.distinct("creator", { brand: brand._id, status: { $ne: "cancelled" } }),
    Deliverable.countDocuments({ brand: brand._id, status: { $in: ["submitted", "revision_requested"] } }),
    Campaign.find({ brand: brand._id }).select("title status budget startDate endDate requiredCreators selectedCreators").sort({ createdAt: -1 }).limit(5).lean(),
    Collaboration.find({ brand: brand._id }).select("creator campaign status deadline agreedCompensation currency").populate("creator", "fullName profileImage primaryPlatform").populate("campaign", "title").sort({ updatedAt: -1 }).limit(5).lean(),
    Deliverable.find({ brand: brand._id, status: { $in: ["pending", "submitted", "revision_requested"] }, dueAt: { $gte: new Date() } }).select("description status dueAt campaign creator").populate("campaign", "title").populate("creator", "fullName").sort({ dueAt: 1 }).limit(8).lean(),
    Notification.find({ recipient: user._id }).select("title message type readAt createdAt data").sort({ createdAt: -1 }).limit(5).lean(),
    Deliverable.aggregate([
      { $match: { brand: brand._id } },
      { $group: { _id: "$campaign", total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } } } },
    ]),
  ]);
  const recentConversations = await Conversation.find({ brand: brand._id }).select("_id creator campaign").populate("creator", "fullName").populate("campaign", "title").sort({ lastMessageAt: -1 }).limit(10).lean();
  const conversationIds = recentConversations.map((conversation) => conversation._id);
  const latestMessages = conversationIds.length
    ? await Message.find({ conversation: { $in: conversationIds } }).populate("sender", "name").sort({ createdAt: -1 }).limit(5).lean()
    : [];
  const conversationsById = new Map(recentConversations.map((conversation) => [String(conversation._id), conversation]));
  const recentMessages = latestMessages.map((message) => {
    const conversation = conversationsById.get(String(message.conversation));
    return {
      id: String(message._id),
      body: message.body,
      sender: message.sender,
      createdAt: message.createdAt,
      creator: conversation?.creator,
      campaign: conversation?.campaign,
    };
  });
  const progressByCampaign = new Map(progressGroups.map((group) => [String(group._id), { approved: group.approved, total: group.total }]));
  const budget = await Campaign.aggregate([
    { $match: { brand: brand._id } },
    { $group: { _id: { $ifNull: ["$currency", "INR"] }, total: { $sum: "$budget" } } },
    { $sort: { _id: 1 } },
  ]);
  return apiSuccess({
    brand: { id: brand.id, companyName: brand.companyName, status: brand.status },
    totals: {
      campaigns,
      activeCampaigns,
      completedCampaigns,
      pendingCreatorResponses: invitations,
      hiredCreators: hiredCreatorIds.length,
      campaignBudgetByCurrency: budget,
      pendingApprovals: deliverables,
    },
    campaigns: recentCampaigns.map((campaign) => ({ ...campaign, deliverableProgress: progressByCampaign.get(String(campaign._id)) ?? { approved: 0, total: 0 } })),
    collaborations: recentCollaborations,
    deliverables: upcomingDeliverables,
    notifications,
    recentMessages,
  });
});
