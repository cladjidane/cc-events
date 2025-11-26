export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventlite.context-collective.org";

  const robotsTxt = `User-agent: *
Allow: /

# LLM/AI Documentation
# These files contain structured documentation for AI assistants
Sitemap: ${baseUrl}/sitemap.xml

# AI-readable documentation
# llms.txt - Brief overview for AI assistants
# llms-full.txt - Complete API documentation
# for-ai - Human-readable AI guide
LLMs-Txt: ${baseUrl}/llms.txt
LLMs-Full-Txt: ${baseUrl}/llms-full.txt
AI-Documentation: ${baseUrl}/for-ai
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
