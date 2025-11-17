import { RecommendationForm } from "@/components/recommendations/recommendation-form";
import { DUMMY_CLIENTS, DUMMY_POOLS } from "@/lib/placeholder-data";

export default function RecommendationsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">AI Product Recommendations</h1>
            </div>
            <p className="text-muted-foreground">
                Select a client and pool, then describe the current conditions to get AI-powered product recommendations.
            </p>

            <RecommendationForm clients={DUMMY_CLIENTS} pools={DUMMY_POOLS} />
        </div>
    )
}
