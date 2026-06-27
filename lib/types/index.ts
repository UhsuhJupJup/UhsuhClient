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
