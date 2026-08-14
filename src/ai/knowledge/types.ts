export type KnowledgeCategory =
  | "doctor"
  | "membership"
  | "packages"
  | "consultations"
  | "services"
  | "products"
  | "faq"
  | "blog"
  | "videos"
  | "contact"
  | "navigation"
  | "policies"
  | "app-features";

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  keywords: string[];
  /** Internal route this item relates to, if any — must always be a real, existing route. */
  route?: string;
}

export interface KnowledgeBase {
  /** ISO timestamp is intentionally NOT embedded (would break deterministic diffs) — see generatedFrom instead. */
  generatedFrom: string;
  items: KnowledgeItem[];
}
