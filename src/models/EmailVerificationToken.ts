import { model, models, Schema } from "mongoose";

const emailVerificationTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken = models.EmailVerificationToken ?? model("EmailVerificationToken", emailVerificationTokenSchema);
export default EmailVerificationToken;
