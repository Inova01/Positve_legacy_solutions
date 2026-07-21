export type PostStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: PostStatus;
  featuredImageUrl: string;
  author: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CmsDocument = {
  id: string;
  title: string;
  description: string;
  filename: string;
  contentType: string;
  size: number;
  status: PostStatus;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
};
