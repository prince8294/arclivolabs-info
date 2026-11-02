import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublishedArticle, getPublishedArticleMetadata } from "@/services/public-content.service";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleMetadata(slug);
  return article ? { title: article.title, description: article.excerpt } : { title: "Insight not found" };
}

export default async function InsightArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  return <article className="article-detail"><Link className="text-link" href="/insights"><ArrowLeft size={15} /> Back to insights</Link><span className="eyebrow">{article.category} · {article.date} · {article.readTime}{article.isDemo ? " · DEMO CONTENT" : ""}</span><h1>{article.title}</h1><p className="article-lede">{article.excerpt}</p><div className="article-detail-image"><Image src={article.image} alt={article.title} fill sizes="(max-width: 800px) 92vw, 800px" unoptimized /></div><div className="article-body">{article.content.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}{article.isDemo && <p className="demo-notice">Demo article text. This is not a published agency insight or professional recommendation.</p>}</div></article>;
}
