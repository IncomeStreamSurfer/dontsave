import { Shopify } from '@shopify/shopify-api';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  const session = await Shopify.Utils.loadCurrentSession(req, res);
  const client = new Shopify.Clients.Rest(session.shop, session.accessToken);

  const { businessName, businessInfo } = req.body;

  try {
    // Fetch products
    const products = await client.get({
      path: 'products',
    });

    // Process products and generate tags
    const updatedProducts = await Promise.all(products.body.products.map(async (product) => {
      const tags = await generateTags(product.title, product.body_html, businessName, businessInfo);
      return client.put({
        path: `products/${product.id}`,
        data: { product: { id: product.id, tags: tags.join(',') } },
      });
    }));

    res.status(200).json({ message: 'Products scanned and tagged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while scanning products' });
  }
}

async function generateTags(title, description, businessName, businessInfo) {
  const prompt = `You are writing for ${businessName}. ${businessInfo} Generate relevant tags for an online shop with the following product title and description:
Title: ${title}
Description: ${description}
Please answer in this format: tag1,tag2,tag3,tag4,tag5,etc. Generate as many relevant tags as possible:`;

  const completion = await anthropic.completions.create({
    model: "claude-3-sonnet-20240229",
    max_tokens_to_sample: 300,
    prompt: prompt,
  });

  return completion.completion.trim().split(',').map(tag => tag.trim());
}
