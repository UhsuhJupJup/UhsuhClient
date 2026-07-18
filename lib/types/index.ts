export interface Topic {
  id: number;
  name: string;
}

export interface Blog {
  id: number;
  name: string;
  domain: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface ArticleCardData {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  blog: { id: number; name: string };
  keywords: string[];
}

export interface ArticlePage {
  content: ArticleCardData[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface TopicDetail {
  id: number;
  name: string;
  keywords: Keyword[];
}

export interface KeywordDetail {
  id: number;
  name: string;
  topics: Topic[];
}

export interface MatchedKeyword {
  id: number;
  name: string;
  matchedVia: string | null;
}

export interface ArticleDetail {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  blog: Blog;
  keywords: MatchedKeyword[];
}

export type MemberRole = "USER" | "ADMIN";

export interface Member {
  id: number;
  email: string;
  provider: string;
  role: MemberRole;
  consentAt: string | null;
  createdAt: string;
}

export type PipelineRunStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export interface PipelineRun {
  id: number;
  startedAt: string;
  finishedAt: string;
  status: PipelineRunStatus;
  durationSeconds: number;
  collectedTotal: number;
  collectedNew: number;
  collectFailed: number;
  matchedArticles: number;
  tagsCreated: number;
  membersNotified: number;
  notificationsRecorded: number;
  notifyFailed: number;
}

export interface AdminBlog {
  id: number;
  name: string;
  domain: string;
  rssUrl: string;
  active: boolean;
}
