import { Shopify } from '@shopify/shopify-api';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  const session = await Shopify.Utils.loadCurrentSession(req, res);
  const client = new Shopify.Clients.Rest(session.shop, session.accessToken);

  try {
    const tags = await fetchUniqueTags(client);

    const collections = await Promise.all(tags.map(async (tag) => {
      const collectionData = await generateCollectionData(tag);
      return client.post({
        path: 'smart_collections',
        data: { smart_collection: collectionData },
      });
    }));

    res.status(200).json({ message: 'Collections generated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while generating collections' });
  }
}

async function fetchUniqueTags(client) {
  const products = await client.get({
    path: 'products',
  });

  const allTags = products.body.products.flatMap(product => product.tags.split(',').map(tag => tag.trim()));
  return [...new Set(allTags)];
}

async function generateCollectionData(tag) {
  const prompt = `Generate a SEO-optimized title, handle, and description for a product collection based on the tag: ${tag}. 
  Format the response as JSON with the following structure:
  {
    "title": "SEO-optimized title",
    "handle": "seo-optimized-handle",
    "body_html": "<p>SEO-optimized description</p>"
  }`;

  const completion = await anthropic.completions.create({
    model: "claude-3-sonnet-20240229",
    max_tokens_to_sample: 300,
    prompt: prompt,
  });

  const collectionData = JSON.parse(completion.completion);
  collectionData.rules = [{ column: 'tag', relation: 'equals', condition: tag }];

  return collectionData;
}
