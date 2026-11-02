import { model, models, Schema, type InferSchemaType, type Types } from "mongoose";

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 240 },
    excerpt: { type: String, required: true, trim: true, maxlength: 1000 },
    content: { type: String, required: true, maxlength: 50000 },
    featuredImage: { type: String, trim: true, maxlength: 2048 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    tags: { type: [String], default: [] },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false, index: true },
    isDemo: { type: Boolean, default: false },
    publishedAt: { type: Date },
    seo: { title: { type: String, maxlength: 180 }, description: { type: String, maxlength: 320 } },
  },
  { timestamps: true, strict: "throw" },
);
blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, tags: 1 });

export type BlogPostRecord = InferSchemaType<typeof blogPostSchema> & { _id: Types.ObjectId };
const BlogPost = models.BlogPost ?? model("BlogPost", blogPostSchema);
export default BlogPost;
