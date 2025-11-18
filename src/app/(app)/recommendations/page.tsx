import { RecommendationForm } from "@/components/recommendations/recommendation-form";
import { DUMMY_CLIENTS, DUMMY_POOLS } from "@/lib/placeholder-data";

export default function RecommendationsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Recomendações de Produtos com IA</h1>
            </div>
            <p className="text-muted-foreground">
                Selecione um cliente e piscina, depois descreva as condições atuais para obter recomendações de produtos com IA.
            </p>

            <RecommendationForm clients={DUMMY_CLIENTS} pools={DUMMY_POOLS} />
        </div>
    )
}
