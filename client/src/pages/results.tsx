import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CostResults from "@/components/cost-results";
import type { CostAnalysis } from "@shared/schema";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const analysisId = params?.id;

  const { data: analysis, isLoading, error } = useQuery<CostAnalysis>({
    queryKey: ['/api/analysis', analysisId],
    enabled: !!analysisId,
  });

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Analysis Not Found</h1>
              <p className="text-slate-600">
                The cost analysis you're looking for could not be found or may have expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Cost Analysis Results - Cloudedze</title>
        <meta name="description" content="View detailed cost comparison results across all major cloud providers with optimization recommendations." />
      </Helmet>
      <CostResults results={analysis.results as any} analysisId={analysisId!} />
    </div>
  );
}
