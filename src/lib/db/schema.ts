import { mysqlTable, serial, varchar, decimal, json, mysqlEnum, timestamp, text } from "drizzle-orm/mysql-core";

// 1. Users & Makers
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  stripeId: varchar("stripe_id", { length: 255 }),
  userType: mysqlEnum("user_type", ["user", "maker"]).default("user"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Closet Items (The Heart of ClosetSwap)
export const items = mysqlTable("items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  transactionType: mysqlEnum("transaction_type", ["swap_only", "sale_only", "both"]).notNull(),
  baseCategory: mysqlEnum("base_category", ["clothing", "sneakers", "jewelry", "accessories"]).notNull(),
  itemCondition: mysqlEnum("item_condition", ["new_with_tags", "like_new", "fairly_used", "vintage_distressed"]).notNull(),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }), // For Swap Logic
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), // For Maker/Sale Logic
  
  // The JSON Magic: Stores brand, size, color, material, etc.
  attributes: json("attributes").$type<{
    brand?: string;
    size?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  }>(),
  
  mediaUrls: json("media_urls").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["active", "in_escrow", "swapped", "sold"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Swap Proposals
export const swaps = mysqlTable("swaps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  senderItems: json("sender_items").$type<string[]>().notNull(), // Array of Item IDs
  receiverItems: json("receiver_items").$type<string[]>().notNull(), // Array of Item IDs
  status: mysqlEnum("status", ["pending", "accepted", "paid", "shipped", "completed", "cancelled"]).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});