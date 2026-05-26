"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";

// ... existing sendMessage action ...

// NEW ACTION: Fetch messages quietly in the background
export async function getChatHistory(offerId: string) {
  try {
    const chatHistory = await db.select()
      .from(messages)
      .where(eq(messages.offerId, offerId))
      .orderBy(asc(messages.createdAt));
      
    return { success: true, data: chatHistory };
  } catch (error) {
    return { error: "Failed to fetch messages" };
  }
}


export async function sendMessage(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const offerId = formData.get("offerId") as string;
    const receiverId = formData.get("receiverId") as string;
    const content = formData.get("content") as string;

    if (!content || !content.trim()) {
      return { error: "Message cannot be empty" };
    }

    // Insert the message into our new ledger
    await db.insert(messages).values({
      id: randomUUID(),
      offerId,
      senderId: userId,
      receiverId,
      content: content.trim(),
    });

    // 🚀 MAGIC: This tells Next.js to instantly refresh the inbox page in the background!
    revalidatePath("/inbox"); 
    
    return { success: true };
  } catch (error) {
    console.error("Message Error:", error);
    return { error: "Failed to send message" };
  }
}