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
