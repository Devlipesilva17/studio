'use server';

/**
 * @fileOverview AI-powered product recommendations for pool maintenance.
 *
 * - getProductRecommendations - A function that returns product recommendations for a given pool.
 * - ProductRecommendationsInput - The input type for the getProductRecommendations function.
 * - ProductRecommendationsOutput - The return type for the getProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationsInputSchema = z.object({
  poolSize: z.number().describe('The size of the pool in gallons.'),
  poolType: z.string().describe('The type of pool (e.g., chlorine, saltwater).'),
  lastTreatment: z.string().describe('Description of the last pool treatment performed.'),
  algaeLevel: z.string().describe('The level of algae present in the pool (e.g., low, medium, high).'),
  pHLevel: z.number().describe('The pH level of the pool water.'),
});
export type ProductRecommendationsInput = z.infer<typeof ProductRecommendationsInputSchema>;

const ProductRecommendationsOutputSchema = z.object({
  recommendedProducts: z.array(
    z.object({
      productName: z.string().describe('The name of the recommended product.'),
      dosage: z.string().describe('The recommended dosage of the product.'),
      reason: z.string().describe('The reason for recommending this product.'),
    })
  ).describe('A list of recommended products for the pool.'),
});
export type ProductRecommendationsOutput = z.infer<typeof ProductRecommendationsOutputSchema>;

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  return productRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productRecommendationsPrompt',
  input: {schema: ProductRecommendationsInputSchema},
  output: {schema: ProductRecommendationsOutputSchema},
  prompt: `You are an expert pool maintenance advisor. Based on the following pool characteristics, provide a list of recommended products, their dosage, and the reasoning behind each recommendation.

Pool Size: {{{poolSize}}} gallons
Pool Type: {{{poolType}}}
Last Treatment: {{{lastTreatment}}}
Algae Level: {{{algaeLevel}}}
pH Level: {{{pHLevel}}}

Respond with a list of recommended products, dosage, and a brief explanation for each recommendation.
Ensure the recommendations are safe and effective for the given pool type and conditions.`, 
});

const productRecommendationsFlow = ai.defineFlow(
  {
    name: 'productRecommendationsFlow',
    inputSchema: ProductRecommendationsInputSchema,
    outputSchema: ProductRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
