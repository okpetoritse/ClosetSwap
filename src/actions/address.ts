"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function saveAddress(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized: You must be logged in." };

    const id = randomUUID();

    await db.insert(addresses).values({
      id,
      userId,
      fullName: formData.get("fullName") as string,
      street1: formData.get("street1") as string,
      street2: formData.get("street2") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
      country: formData.get("country") as string || "US",
      phone: formData.get("phone") as string,
      isDefault: true,
    });

    // Refresh the closet page so the new data appears instantly
    // revalidatePath("/closet");
    
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { error: "Failed to save the shipping address to the secure ledger." };
  }
}