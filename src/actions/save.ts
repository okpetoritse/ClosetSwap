"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function toggleSaveItem(itemId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "You must be logged in to save items." };

    // Check if it's already saved
    const existingSave = await db.select()
      .from(savedItems)
      .where(and(
        eq(savedItems.userId, userId),
        eq(savedItems.itemId, itemId)
      ));

    if (existingSave.length > 0) {
      // It exists! UN-SAVE IT.
      await db.delete(savedItems)
        .where(eq(savedItems.id, existingSave[0].id));
    } else {
      // It doesn't exist! SAVE IT.
      await db.insert(savedItems).values({
        id: randomUUID(),
        userId,
        itemId,
      });
    }

    // Refresh the current page to update the UI counter
    revalidatePath(`/item/${itemId}`);
    return { success: true };
  } catch (error) {
    console.error("Save Error:", error);
    return { error: "Failed to update watchlist." };
  }
}