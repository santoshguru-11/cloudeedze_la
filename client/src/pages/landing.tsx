import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalculatorIcon, 
  CloudIcon, 
  ShieldCheckIcon, 
  TrendingUpIcon,
  ArrowRightIcon,
  StarIcon,
  ZapIcon,
  GlobeIcon,
  BarChart3Icon,
  UsersIcon,
  CheckCircleIcon,
  SparklesIcon
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Helmet>
        <title>DZlens - Multi-Cloud Cost Calculator & Optimization Platform | Save 40% on Cloud Costs</title>
        <meta name="description" content="Multi-cloud cost calculator for AWS, Azure, GCP, and Oracle Cloud. Upload Terraform files, scan resources, and get detailed cost breakdowns. Save up to 40% on cloud costs with AI-powered insights." />
        <meta name="keywords" content="multi-cloud cost calculator, cloud cost optimization, AWS cost analysis, Azure cost management, GCP cost optimization, Oracle Cloud costs, Terraform cost analysis, cloud cost calculator, infrastructure cost optimization, cloud savings" />
        <meta name="author" content="DZlens" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://app.cloudeedze.ai/" />
        <meta property="og:title" content="DZlens - Multi-Cloud Cost Calculator & Optimization Platform" />
        <meta property="og:description" content="Multi-cloud cost calculator for AWS, Azure, GCP, and Oracle Cloud. Save up to 40% on cloud costs with AI-powered insights." />
        <meta property="og:image" content="https://app.cloudeedze.ai/og-image.jpg" />
        <meta property="og:site_name" content="DZlens" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://app.cloudeedze.ai/" />
        <meta property="twitter:title" content="DZlens - Multi-Cloud Cost Calculator & Optimization Platform" />
        <meta property="twitter:description" content="Multi-cloud cost calculator for AWS, Azure, GCP, and Oracle Cloud. Save up to 40% on cloud costs with AI-powered insights." />
        <meta property="twitter:image" content="https://app.cloudeedze.ai/og-image.jpg" />

        {/* Additional SEO */}
        <link rel="canonical" href="https://app.cloudeedze.ai/" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "DZlens",
            "description": "Multi-cloud cost calculator for AWS, Azure, GCP, and Oracle Cloud",
            "url": "https://app.cloudeedze.ai/",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free trial available"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "10000"
            }
          })}
        </script>
      </Helmet>

      <div className="relative z-10">
        {/* Hero Section */}
        <main>
          <section className="container mx-auto px-4 py-20 text-center" aria-labelledby="hero-heading">
            <div className="max-w-6xl mx-auto">
              <Badge className="mb-6 bg-blue-600 text-white border-0 px-6 py-2 text-sm font-medium">
                <SparklesIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                Multi-Cloud Cost Calculator Platform
              </Badge>
              
              <h1 id="hero-heading" className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                Multi-Cloud Cost Calculator
                <span className="block text-blue-600">
                  Across All Providers
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                The most advanced multi-cloud cost calculator. Compare, analyze, and optimize your infrastructure 
                across AWS, Azure, GCP, and Oracle Cloud with AI-powered insights and recommendations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Button 
                  onClick={handleLogin} 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                  data-testid="button-login"
                  aria-label="Get started with DZlens free trial"
                >
                  Get Started Free
                  <ArrowRightIcon className="ml-2 w-5 h-5" aria-hidden="true" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                  aria-label="Watch DZlens demo video"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto" aria-label="Platform statistics">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" aria-label="2.3 million dollars saved">$2.3M+</div>
                  <div className="text-gray-600">Saved by Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" aria-label="10 thousand active users">10K+</div>
                  <div className="text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" aria-label="99.9 percent uptime">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" aria-label="4.9 star user rating">4.9★</div>
                  <div className="text-gray-600">User Rating</div>
                </div>
              </section>
            </div>
          </section>
        </main>

        {/* Features Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 id="features-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Powerful Features for
                <span className="block text-blue-600">
                  Multi-Cloud Cost Calculator
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to analyze, optimize, and manage your cloud infrastructure costs across all major providers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label="Platform features">
              <article className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg" data-testid="card-feature-calculator" role="listitem">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <CalculatorIcon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 text-xl">Multi-Cloud Calculator</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600">
                    Compare costs across AWS, Azure, GCP, and Oracle Cloud with detailed breakdowns by service category.
                  </CardDescription>
                </CardContent>
              </article>

              <article className="bg-white border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg" data-testid="card-feature-terraform" role="listitem">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <CloudIcon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 text-xl">Terraform Integration</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600">
                    Upload your .tfstate files to automatically analyze your existing infrastructure and calculate costs.
                  </CardDescription>
                </CardContent>
              </article>

              <article className="bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg" data-testid="card-feature-scanning" role="listitem">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 text-xl">Live Resource Scanning</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600">
                    Connect your cloud credentials to scan actual resources and get real-time cost analysis.
                  </CardDescription>
                </CardContent>
              </article>

              <article className="bg-white border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg" data-testid="card-feature-optimization" role="listitem">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <TrendingUpIcon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 text-xl">AI-Powered Optimization</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600">
                    Get detailed recommendations for cost savings, right-sizing, and multi-cloud optimization strategies.
                  </CardDescription>
                </CardContent>
              </article>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white" aria-labelledby="benefits-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 id="benefits-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose
                <span className="block text-blue-600">
                  DZlens?
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Trusted by thousands of organizations worldwide for comprehensive multi-cloud cost calculation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto" role="list" aria-label="Platform benefits">
              <article className="text-center group" role="listitem">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                  <BarChart3Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Comprehensive Analysis</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Analyze compute, storage, database, networking, and advanced services across all major cloud providers with detailed cost breakdowns.
                </p>
              </article>

              <article className="text-center group" role="listitem">
                <div className="w-20 h-20 bg-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                  <ShieldCheckIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Security</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Your cloud credentials and infrastructure data are encrypted and stored securely with enterprise-grade security and compliance.
                </p>
              </article>

              <article className="text-center group" role="listitem">
                <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                  <ZapIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Insights</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Get specific recommendations for cost optimization, resource right-sizing, and multi-cloud strategies powered by advanced AI.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50" aria-labelledby="testimonials-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Trusted by Industry Leaders
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See what our customers are saying about their cost savings and optimization results.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto" role="list" aria-label="Customer testimonials">
              <article className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm" role="listitem">
                <CardContent>
                  <div className="flex items-center mb-4" aria-label="5 star rating">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 mb-6 text-lg">
                    "DZlens helped us reduce our cloud costs by 40% in just 3 months. The insights were incredibly detailed and actionable."
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4" aria-hidden="true">
                      JS
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">John Smith</div>
                      <div className="text-gray-500">CTO, TechCorp</div>
                    </div>
                  </div>
                </CardContent>
              </article>

              <article className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm" role="listitem">
                <CardContent>
                  <div className="flex items-center mb-4" aria-label="5 star rating">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 mb-6 text-lg">
                    "The multi-cloud comparison feature is a game-changer. We saved over $50K annually by switching providers."
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4" aria-hidden="true">
                      MJ
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">Maria Johnson</div>
                      <div className="text-gray-500">DevOps Lead, StartupXYZ</div>
                    </div>
                  </div>
                </CardContent>
              </article>

              <article className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm" role="listitem">
                <CardContent>
                  <div className="flex items-center mb-4" aria-label="5 star rating">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 mb-6 text-lg">
                    "The Terraform integration made it so easy to analyze our existing infrastructure. Highly recommended!"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4" aria-hidden="true">
                      DR
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">David Rodriguez</div>
                      <div className="text-gray-500">Cloud Architect, Enterprise Inc</div>
                    </div>
                  </div>
                </CardContent>
              </article>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center mb-8">
                <img
                  src="/dZlens.png"
                  alt="DZlens Logo - Multi-Cloud Cost Calculator Platform"
                  className="h-16 w-auto"
                  width="64"
                  height="64"
                  loading="lazy"
                />
              </div>
              <h2 id="cta-heading" className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
                Ready to Calculate Your
                <span className="block text-blue-600">
                  Multi-Cloud Costs?
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
                Join thousands of developers and organizations saving millions on cloud infrastructure. 
                Start your free trial today and see the difference.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Button 
                  onClick={handleLogin} 
                  size="lg" 
                  className="text-xl px-12 py-8 bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                  data-testid="button-login-cta"
                  aria-label="Start your free trial with DZlens"
                >
                  Start Free Trial
                  <ArrowRightIcon className="ml-3 w-6 h-6" aria-hidden="true" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-xl px-12 py-8 border-gray-300 text-gray-700 hover:bg-gray-50"
                  aria-label="Schedule a demo with DZlens"
                >
                  Schedule Demo
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600" role="list" aria-label="Trial benefits">
                <div className="flex items-center" role="listitem">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" aria-hidden="true" />
                  No credit card required
                </div>
                <div className="flex items-center" role="listitem">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" aria-hidden="true" />
                  Setup in 5 minutes
                </div>
                <div className="flex items-center" role="listitem">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" aria-hidden="true" />
                  24/7 support
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}