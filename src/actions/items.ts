"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

export async function uploadItem(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: You must be logged in to upload.");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const transactionType = formData.get("transactionType") as any;
  const baseCategory = formData.get("baseCategory") as any;
  const itemCondition = formData.get("itemCondition") as any;
  
  // 🚀 CATCH THE NEW PRICE FIELD
  const salePriceString = formData.get("salePrice") as string;
  const salePrice = salePriceString ? salePriceString : null;

  const mediaUrlsString = formData.get("mediaUrls") as string;
  let mediaUrlsArray: string[] = [];
  try {
    if (mediaUrlsString) mediaUrlsArray = JSON.parse(mediaUrlsString);
  } catch (error) {
    mediaUrlsArray = [];
  }

  const attributesObj: Record<string, any> = {};
  if (baseCategory === "sneakers") {
    attributesObj.brand = formData.get("attr_brand");
    attributesObj.size = formData.get("attr_size");
  } else if (baseCategory === "jewelry") {
    attributesObj.material = formData.get("attr_material");
    attributesObj.gemstone = formData.get("attr_gemstone");
  }

  await db.insert(items).values({
    id: randomUUID(),
    ownerId: userId,
    title,
    description,
    transactionType,
    baseCategory,
    itemCondition,
    salePrice, // 🚀 SAVE THE PRICE TO TIDB!
    attributes: attributesObj,
    mediaUrls: mediaUrlsArray,
  });

  redirect("/");
}