export type CampaignStatus = "draft" | "pending" | "approved" | "active" | "completed" | "cancelled";

export type CampaignSummary = {
  id: string;
  title: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
};
