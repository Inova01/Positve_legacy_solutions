import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  category: text("category").notNull().default("Community"),
  tags: text("tags").notNull().default("[]"),
  status: text("status").notNull().default("draft"),
  featuredImageUrl: text("featured_image_url").notNull().default(""),
  author: text("author").notNull().default("Positive Legacy Solutions"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  filename: text("filename").notNull(),
  objectKey: text("object_key").notNull().unique(),
  contentType: text("content_type").notNull().default("application/pdf"),
  size: integer("size").notNull().default(0),
  status: text("status").notNull().default("published"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
