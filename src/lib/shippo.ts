import { Shippo } from "shippo";

if (!process.env.SHIPPO_API_KEY) {
  throw new Error("Missing SHIPPO_API_KEY in environment variables.");
}

// Initialize the global Shippo client
export const shippoClient = new Shippo({
  apiKeyHeader: `shippo_test_${process.env.SHIPPO_API_KEY.replace('shippo_test_', '')}`, // Ensures formatting
});

// A dummy company address to act as the "Return Address" or default origin
export const closetSwapOriginAddress = {
  name: "ClosetSwap Logistics",
  street1: "123 Tech Avenue",
  city: "San Francisco",
  state: "CA",
  zip: "94105",
  country: "US",
  phone: "+1 555 123 4567",
  email: "logistics@closetswap.com",
};