import { describe, expect, it } from "vitest";
import {
  creatorApplicationInstagramUpdate,
  isAllowedInstagramImageUrl,
  isManagedProfileImagePublicId,
  metaApiFailure,
  profileImageUrl,
  profileUsername,
} from "@/services/meta-instagram-sync.service";

describe("profile image sync safeguards", () => {
  it("reads Meta Business Discovery profile fields", () => {
    const record = {
      username: "@ArclivoLabs",
      profile_picture_url: "https://scontent.cdninstagram.com/profile.jpg",
    };
    expect(profileUsername(record)).toBe("arclivolabs");
    expect(profileImageUrl(record)).toBe(record.profile_picture_url);
  });

  it("accepts Instagram CDN images and rejects unsafe source URLs", () => {
    expect(isAllowedInstagramImageUrl("https://scontent-bom2-1.cdninstagram.com/v/image.jpg")).toBe(true);
    expect(isAllowedInstagramImageUrl("https://instagram.fdel1-5.fna.fbcdn.net/v/image.jpg")).toBe(true);
    expect(isAllowedInstagramImageUrl("http://scontent.cdninstagram.com/image.jpg")).toBe(false);
    expect(isAllowedInstagramImageUrl("https://cdninstagram.com.attacker.test/image.jpg")).toBe(false);
    expect(isAllowedInstagramImageUrl("https://127.0.0.1/image.jpg")).toBe(false);
  });

  it("only treats auto-sync Cloudinary assets as deletable", () => {
    expect(isManagedProfileImagePublicId("arclivo/creators/instagram/creator-id/asset-id")).toBe(true);
    expect(isManagedProfileImagePublicId("arclivo/creators/instagram/applications/application-id/asset-id")).toBe(true);
    expect(isManagedProfileImagePublicId("arclivo/creators/instagram/creator-id/default-avatar")).toBe(false);
    expect(isManagedProfileImagePublicId("arclivo/creators/profiles/default")).toBe(false);
    expect(isManagedProfileImagePublicId("default-profile-image")).toBe(false);
    expect(isManagedProfileImagePublicId(null)).toBe(false);
  });

  it("turns an expired Meta token into an actionable authentication error", () => {
    const failure = metaApiFailure(JSON.stringify({
      error: {
        code: 190,
        error_subcode: 463,
        message: "Error validating access token: Session has expired.",
      },
    }), 401);

    expect(failure.status).toBe(401);
    expect(failure.message).toContain("META_ACCESS_TOKEN");
    expect(failure.message).toContain("long-lived token");
  });

  it("uses only non-empty profile values and real media metrics for application sync", () => {
    const syncedAt = new Date("2026-01-02T03:04:05.000Z");
    const update = creatorApplicationInstagramUpdate({
      username: "real_creator",
      name: "",
      biography: " ",
      followers_count: 1000,
      follows_count: 250,
      media_count: 42,
      media: {
        data: [
          { id: "1", media_product_type: "REELS", like_count: 10, comments_count: 2, view_count: 100 },
          { id: "2", media_product_type: "FEED", like_count: 20, comments_count: 4, views: 200 },
          { id: "3", media_product_type: "FEED" },
        ],
      },
    }, syncedAt);

    expect(update).toMatchObject({
      instagramUsername: "real_creator",
      socialProfile: "https://www.instagram.com/real_creator/",
      followers: 1000,
      followingCount: 250,
      postsCount: 42,
      averageLikes: 15,
      averageComments: 3,
      averageViews: 150,
      engagementRate: 1.8,
      instagramLastSyncedAt: syncedAt,
    });
    expect(update).not.toHaveProperty("name");
    expect(update).not.toHaveProperty("instagramBio");
    expect(update).not.toHaveProperty("email");
    expect(update).not.toHaveProperty("phone");
  });

  it("does not invent missing engagement metrics", () => {
    const update = creatorApplicationInstagramUpdate({
      username: "creator_without_metrics",
      followers_count: 0,
      media: { data: [{ id: "1", media_product_type: "REELS" }] },
    });

    expect(update).not.toHaveProperty("averageLikes");
    expect(update).not.toHaveProperty("averageComments");
    expect(update).not.toHaveProperty("averageViews");
    expect(update).not.toHaveProperty("engagementRate");
  });
});
