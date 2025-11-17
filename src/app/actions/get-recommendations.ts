'use server';

import { getProductRecommendations as getProductRecommendationsFlow, type ProductRecommendationsInput, type ProductRecommendationsOutput } from '@/ai/flows/ai-product-recommendations';

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
    // In a real application, you would add validation, logging, and error handling here.
    try {
        const recommendations = await getProductRecommendationsFlow(input);
        return recommendations;
    } catch (error) {
        console.error("Error getting AI recommendations:", error);
        // Return a structured error response
        return {
            recommendedProducts: [{
                productName: "Error",
                dosage: "N/A",
                reason: "Could not generate recommendations at this time. Please try again later."
            }]
        };
    }
}
