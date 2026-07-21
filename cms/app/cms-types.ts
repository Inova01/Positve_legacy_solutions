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

export type ClientStatus = "new" | "contacted" | "active" | "closed";

export type ClientRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  source: string;
  status: ClientStatus;
  notes: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientMessage = {
  id: string;
  clientId: string;
  subject: string;
  body: string;
  channel: "email";
  status: "prepared";
  createdAt: string;
};
