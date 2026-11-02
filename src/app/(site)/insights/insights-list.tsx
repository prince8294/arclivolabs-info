"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PublicArticle } from "@/services/public-content.service";

export function InsightsList({ articles }: { articles: PublicArticle[] }) {
  const [category, setCategory] = useState("All topics");
  const [search, setSearch] = useState("");
  const topics = ["All topics", ...Array.from(new Set(articles.map((article) => article.category)))];
  const filtered = useMemo(() => articles.filter((article) => (category === "All topics" || article.category === category) && `${article.title} ${article.excerpt}`.toLowerCase().includes(search.toLowerCase())), [articles, category, search]);
  return <><div className="insights-controls"><input aria-label="Search articles" placeholder="Search insights" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="filter-pills">{topics.map((topic) => <button className={topic === category ? "filter-pill active" : "filter-pill"} onClick={() => setCategory(topic)} type="button" key={topic}>{topic}</button>)}</div></div>{filtered.length ? <div className="insights-grid">{filtered.map((article, index) => <article className={index === 0 ? "article-card article-featured" : "article-card"} key={article.slug}><Link className="article-image" href={`/insights/${article.slug}`}><Image src={article.image} alt={article.title} fill sizes={index === 0 ? "(max-width: 700px) 90vw, 65vw" : "(max-width: 700px) 90vw, 30vw"} unoptimized /><span>{article.isDemo ? "DEMO ARTICLE" : "INSIGHT"}</span></Link><div className="article-copy"><span className="eyebrow">{article.category} · {article.date}</span><h2><Link href={`/insights/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link className="text-link" href={`/insights/${article.slug}`}>Read article <ArrowUpRight size={15} /></Link></div></article>)}</div> : <p className="empty-state">No published insights match your search yet.</p>}</>;
}
