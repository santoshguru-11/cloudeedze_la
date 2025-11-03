import { Helmet } from "react-helmet-async";
import ComprehensiveCostForm from "@/components/comprehensive-cost-form";

export default function Calculator() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Comprehensive Cost Calculator - DZlens</title>
        <meta name="description" content="Calculate and compare comprehensive cloud costs across AWS, Azure, GCP, and Oracle Cloud including compute, storage, databases, networking, AI/ML, analytics, security, and more." />
      </Helmet>
      <div className="py-8">
        <ComprehensiveCostForm />
      </div>
    </div>
  );
}
