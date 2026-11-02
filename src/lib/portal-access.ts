import { Types } from "mongoose";
import { ApiError } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import Brand from "@/models/Brand";
import Creator from "@/models/Creator";
import type { UserRecord } from "@/models/User";

export async function findOwnedBrand(user: UserRecord) {
  await connectToDatabase();
  return Brand.findOne({ user: user._id });
}

export async function requireOwnedBrand(user: UserRecord, options: { active?: boolean } = {}) {
  const brand = await findOwnedBrand(user);
  if (!brand) throw new ApiError("Complete your brand profile before using this feature.", 409);
  if (options.active && brand.status !== "active") throw new ApiError("Your brand profile is awaiting approval.", 403);
  return brand;
}

export async function requireOwnedCreator(user: UserRecord) {
  const creator = await findOwnedCreator(user);
  if (!creator) throw new ApiError("A creator profile is required. Complete your profile or submit an application for review.", 409);
  return creator;
}

export async function findOwnedCreator(user: UserRecord) {
  await connectToDatabase();
  let creator = await Creator.findOne({ user: user._id });
  if (creator) return creator;

  if (!user.isEmailVerified) return null;
  creator = await Creator.findOneAndUpdate(
    { email: user.email, user: null },
    { $set: { user: user._id } },
    { returnDocument: "after", runValidators: true },
  );
  return creator;
}

export function objectId(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new ApiError("Record was not found.", 404);
  return new Types.ObjectId(value);
}
