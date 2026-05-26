"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shippoClient, closetSwapOriginAddress } from "@/lib/shippo";

export async function generateShippingLabel() {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    // 1. Get the user's physical address from TiDB
    const userAddresses = await db.select().from(addresses).where(eq(addresses.userId, userId));
    const destination = userAddresses[0];

    if (!destination) {
      return { error: "No shipping address found. Please update your profile." };
    }

    // 2. Create the Shipment in Shippo
    const shipment = await shippoClient.shipments.create({
      addressFrom: closetSwapOriginAddress,
      addressTo: {
        name: destination.fullName,
        street1: destination.street1,
        street2: destination.street2 || "",
        city: destination.city,
        state: destination.state,
        zip: destination.zipCode,
        country: destination.country,
        phone: destination.phone,
      },
      parcels: [{
        length: "12",
        width: "10",
        height: "4",
        distanceUnit: "in",
        weight: "2", // Standard 2lb package for shoes/clothes
        massUnit: "lb"
      }],
      async: false // Wait for Shippo to return the rates instantly
    });

    // 3. Grab the cheapest/fastest shipping rate (Usually USPS Priority in Test Mode)
    const rate = shipment.rates[0];
    if (!rate) return { error: "Shippo could not calculate a rate for this address." };

    // 4. Purchase the actual Label using the Test API Key
    const transaction = await shippoClient.transactions.create({
      rate: rate.objectId,
      labelFileType: "PDF",
      async: false
    });

    if (transaction.status !== "SUCCESS") {
      return { error: "Label purchase failed: " + transaction.messages?.[0]?.text };
    }

    // 5. Return the tracking number and the printable PDF link
    return {
      success: true,
      trackingNumber: transaction.trackingNumber,
      labelUrl: transaction.labelUrl,
    };

  } catch (error: any) {
    console.error("Shippo Error:", error);
    return { error: "Logistics engine failed to generate the label." };
  }
}