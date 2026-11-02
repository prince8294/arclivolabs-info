"use client";

import { useState } from "react";
import { CaseCard } from "@/components/site";
import { caseStudies } from "@/data/site-data";

export function StudyGrid() {
  const [industry, setIndustry] = useState("All industries");
  const industries = ["All industries", ...Array.from(new Set(caseStudies.map((study) => study.industry)))];
  const visible = industry === "All industries" ? caseStudies : caseStudies.filter((study) => study.industry === industry);
  return <><div className="filter-pills" aria-label="Filter by industry">{industries.map((item) => <button type="button" className={industry === item ? "filter-pill active" : "filter-pill"} onClick={() => setIndustry(item)} key={item}>{item}</button>)}</div><div className="case-grid">{visible.map((study) => <CaseCard study={study} key={study.brand} />)}</div><p className="demo-notice">These are fictional campaign concepts for layout demonstration. All brand names and results are placeholders; no real client work is represented.</p></>;
}
