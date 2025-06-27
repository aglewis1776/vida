import { fetchOneEntry } from "@builder.io/sdk-svelte";

const BUILDER_PUBLIC_API_KEY = "ab78c3d245e24cd6a99e9b8c22149897";

async function testBuilderConnection() {
  try {
    console.log("Testing Builder.io API connection...");
    console.log("API Key:", BUILDER_PUBLIC_API_KEY);
    console.log("Fetching content for URL: /");

    const content = await fetchOneEntry({
      model: "page",
      apiKey: BUILDER_PUBLIC_API_KEY,
      userAttributes: {
        urlPath: "/",
      },
    });

    console.log("Response received:");
    if (content) {
      console.log("✅ Content found!");
      console.log("Content ID:", content.id);
      console.log("Content Name:", content.name);
      console.log("Content Data:", JSON.stringify(content.data, null, 2));
    } else {
      console.log("❌ No content found for this URL");
      console.log("This means:");
      console.log('1. No content is published in Builder.io for the "/" URL');
      console.log('2. Or the content URL path doesn\'t match "/"');
      console.log("3. Or the API key doesn't have access to the content");
    }
  } catch (error) {
    console.error("❌ Error connecting to Builder.io:", error.message);
    console.error("Full error:", error);
  }
}

testBuilderConnection();
