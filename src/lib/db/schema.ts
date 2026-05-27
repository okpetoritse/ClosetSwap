import { mysqlTable, varchar, decimal, json, mysqlEnum, timestamp, text, unique, boolean } from "drizzle-orm/mysql-core";

// 1. Users & Makers
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  stripeId: varchar("stripe_id", { length: 255 }),
  userType: mysqlEnum("user_type", ["user", "maker"]).default("user"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  createdAt: timestamp("created_at").defaultNow(),
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
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
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }), 
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), 
  attributes: json("attributes").$type<Record<string, any>>(),
  mediaUrls: json("media_urls").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["active", "in_escrow", "swapped", "sold"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Swap Proposals
export const swaps = mysqlTable("swaps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  senderItems: json("sender_items").$type<string[]>().notNull(), 
  receiverItems: json("receiver_items").$type<string[]>().notNull(), 
  status: mysqlEnum("status", ["pending", "accepted", "paid", "shipped", "completed", "cancelled"]).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Offers
export const offers = mysqlTable("offers", { 
  id: varchar("id", { length: 255 }).primaryKey(),
  targetItemId: varchar("target_item_id", { length: 255 }).notNull(), 
  receiverId: varchar("receiver_id", { length: 255 }).notNull(), 
  senderId: varchar("sender_id", { length: 255 }).notNull(), 
  offerType: varchar("offer_type", { length: 50 }).notNull(), 
  offeredItemIds: json("offered_item_ids").$type<string[]>(),
  cashAmount: varchar("cash_amount", { length: 50 }).default("0"), 
  message: text("message"), 
  status: varchar("status", { length: 50 }).default("pending").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Messages
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  offerId: varchar("offer_id", { length: 255 }).notNull(), 
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Saved Items
export const savedItems = mysqlTable("saved_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  itemId: varchar("item_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueSave: unique("unique_save").on(table.userId, table.itemId),
  };
});

// Add this to the bottom of src/lib/db/schema.ts

export const addresses = mysqlTable("addresses", {
  id: varchar("id", { length: 255 }).primaryKey(), // We will use a UUID here
  userId: varchar("user_id", { length: 255 }).notNull(), // Links to Clerk
  
  // Shippo Requirements
  fullName: text("full_name").notNull(),
  street1: text("street_1").notNull(),
  street2: text("street_2"), // Optional (Apt, Suite, etc.)
  city: text("city").notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 2 }).default("US").notNull(), // ISO Code (e.g., US)
  phone: varchar("phone", { length: 20 }).notNull(),
  
  // Is this their primary address?
  isDefault: boolean("is_default").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});