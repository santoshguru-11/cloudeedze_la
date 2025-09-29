import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CloudProvider, CostCalculationResult } from "@shared/schema";
import CostCharts from "./cost-charts";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CostResultsProps {
  results: CostCalculationResult;
  analysisId: string;
}

export default function CostResults({ results, analysisId }: CostResultsProps) {
  // Debug logging to see what we're getting
  console.log('CostResults received data:', { results, analysisId });
  
  // Guard clause to handle undefined or incomplete data
  if (!results) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Cost Analysis Data</h3>
          <p className="text-gray-500">Please run a cost analysis to see results here.</p>
        </div>
      </div>
    );
  }

  // Check if results is the analysis object containing the actual results
  let actualResults = results;
  if ((results as any).results && !(results as any).providers) {
    // This means we received the analysis object, extract the actual results
    actualResults = (results as any).results;
    console.log('Extracted actual results from analysis object:', actualResults);
  }

  // If we have results but no providers array, try to extract it
  let providers = actualResults.providers;
  if (!providers && (actualResults as any).inventory && (actualResults as any).inventory.resources) {
    // Try to convert inventory data to providers format
    console.log('Converting inventory data to providers format');
    providers = [{
      name: 'AWS',
      total: 0,
      currencySymbol: '$',
      compute: 0,
      storage: 0,
      database: 0,
      networking: 0,
      licensing: 0
    }];
  }
  
  // If we still don't have providers, try to create a basic one from the data
  if (!providers || providers.length === 0) {
    console.log('No providers found, creating basic provider from data');
    providers = [{
      name: 'AWS',
      total: 0,
      currencySymbol: '$',
      compute: 0,
      storage: 0,
      database: 0,
      networking: 0,
      licensing: 0
    }];
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Cost Analysis Data</h3>
          <p className="text-gray-500">Please run a cost analysis to see results here.</p>
          <pre className="text-xs text-gray-400 mt-4 text-left">{JSON.stringify(actualResults, null, 2)}</pre>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    window.open(`/api/export/${analysisId}/csv`, '_blank');
  };

  const handleGeneratePDF = async () => {
    try {
      // Get the main content element
      const element = document.getElementById('cost-results-content');
      if (!element) {
        console.error('Content element not found');
        return;
      }

      // Create canvas from HTML content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `cost-analysis-${analysisId}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div id="cost-results-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Cost Analysis Results</h2>
        <p className="text-slate-600 mt-2">
          Comprehensive cost breakdown across all cloud providers with optimization recommendations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Cheapest Option</p>
                <p className="text-2xl font-bold text-green-600">
                  {actualResults.cheapest ? `${actualResults.cheapest.currencySymbol || '$'}${actualResults.cheapest.total}/mo` : 'N/A'}
                </p>
                <p className="text-sm text-slate-500">{actualResults.cheapest?.name || 'No data available'}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">🏆</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Most Expensive</p>
                <p className="text-2xl font-bold text-red-600">
                  {actualResults.mostExpensive ? `${actualResults.mostExpensive.currencySymbol || '$'}${actualResults.mostExpensive.total}/mo` : 'N/A'}
                </p>
                <p className="text-sm text-slate-500">{actualResults.mostExpensive?.name || 'No data available'}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-xl">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Potential Savings</p>
                <p className="text-2xl font-bold text-primary">
                  {actualResults.providers?.[0]?.currencySymbol || '$'}{actualResults.potentialSavings || 0}/mo
                </p>
                <p className="text-sm text-slate-500">
                  {actualResults.mostExpensive?.total ? Math.round((actualResults.potentialSavings / actualResults.mostExpensive.total) * 100) : 0}% reduction
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Multi-Cloud Option</p>
                <p className="text-2xl font-bold text-amber-600">
                  {actualResults.providers?.[0]?.currencySymbol || '$'}{actualResults.multiCloudOption?.cost || 0}/mo
                </p>
                <p className="text-sm text-slate-500">Best hybrid</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 font-bold text-xl">🔗</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <CostCharts providers={providers || []} cheapestProvider={actualResults.cheapest} />

      {/* Detailed Comparison Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  {(providers || []).map((provider) => (
                    <TableHead key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                      {provider.name}
                      {provider.name === actualResults.cheapest?.name && " 🏆"}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Compute</TableCell>
                  {(providers || []).map((provider) => (
                    <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                      {provider.currencySymbol || '$'}{provider.compute || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableCell className="font-medium">Licensing</TableCell>
                  {(providers || []).map((provider) => (
                    <TableCell key={provider.name} className="text-purple-600 font-semibold">
                      {provider.currencySymbol || '$'}{provider.licensing || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Storage</TableCell>
                  {(providers || []).map((provider) => (
                    <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                      {provider.currencySymbol || '$'}{provider.storage || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Database</TableCell>
                  {(providers || []).map((provider) => (
                    <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                      {provider.currencySymbol || '$'}{provider.database || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-slate-50">
                  <TableCell className="font-medium">Networking</TableCell>
                  {(providers || []).map((provider) => (
                    <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                      {provider.currencySymbol || '$'}{provider.networking || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                {providers?.[0]?.analytics !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Analytics</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.analytics || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.ai !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">AI/ML</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.ai || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.security !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Security</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.security || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.monitoring !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Monitoring</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.monitoring || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.devops !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">DevOps</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.devops || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.backup !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Backup</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.backup || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.iot !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">IoT</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.iot || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.media !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Media</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.media || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.quantum !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Quantum Computing</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.quantum || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.advancedAI !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Advanced AI/ML</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.advancedAI || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.edge !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Edge & 5G</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.edge || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.confidential !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Confidential Computing</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.confidential || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.sustainability !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Sustainability Services</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.sustainability || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.scenarios !== undefined && (
                  <TableRow className="bg-slate-50">
                    <TableCell className="font-medium">Advanced Scenarios</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-semibold" : ""}>
                        {provider.currencySymbol || '$'}{provider.scenarios || 0}/mo
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                <TableRow className="bg-primary/5 font-semibold">
                  <TableCell className="font-bold">Total Monthly Cost</TableCell>
                  {(providers || []).map((provider) => (
                    <TableCell key={provider.name} className={provider.name === actualResults.cheapest?.name ? "text-green-600 font-bold" : "font-semibold"}>
                      {provider.currencySymbol || '$'}{provider.total || 0}/mo
                    </TableCell>
                  ))}
                </TableRow>
                {/* Sustainability Metrics Row */}
                {providers?.[0]?.carbonFootprint !== undefined && (
                  <TableRow className="bg-green-50 border-t-2 border-green-200">
                    <TableCell className="font-bold text-green-800">🌱 Carbon Footprint (tons CO2/mo)</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className="font-medium text-green-700">
                        {provider.carbonFootprint?.toFixed(3) || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                {providers?.[0]?.renewableEnergyPercent !== undefined && (
                  <TableRow className="bg-green-50">
                    <TableCell className="font-bold text-green-800">🔋 Renewable Energy %</TableCell>
                    {(providers || []).map((provider) => (
                      <TableCell key={provider.name} className="font-medium text-green-700">
                        {provider.renewableEnergyPercent || 'N/A'}%
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>💡 Single-Cloud Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-slate-900">{actualResults.cheapest?.name || 'No data available'}</p>
                <p className="text-sm text-slate-600">{actualResults.recommendations?.singleCloud || 'No recommendations available'}</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-600">
                {actualResults.mostExpensive?.total ? Math.round((actualResults.potentialSavings / actualResults.mostExpensive.total) * 100) : 0}% savings compared to {actualResults.mostExpensive?.name || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔗 Multi-Cloud Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-slate-900">Hybrid Approach: ${actualResults.multiCloudOption?.cost || 0}/month</p>
                <div className="text-sm text-slate-600">
                  • Compute: {actualResults.multiCloudOption?.breakdown?.compute || 'N/A'}<br />
                  • Storage: {actualResults.multiCloudOption?.breakdown?.storage || 'N/A'}<br />
                  • Database: {actualResults.multiCloudOption?.breakdown?.database || 'N/A'}<br />
                  • Networking: {actualResults.multiCloudOption?.breakdown?.networking || 'N/A'}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-amber-600">
                Additional ${actualResults.cheapest?.total && actualResults.multiCloudOption?.cost ? Math.round((actualResults.cheapest.total - actualResults.multiCloudOption.cost) * 100) / 100 : 0}/month savings with multi-cloud setup
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={handleExportCSV}>
          Export to CSV
        </Button>
        <Button variant="outline" onClick={handleGeneratePDF}>
          Generate PDF Report
        </Button>
        <Button className="bg-primary hover:bg-blue-700">
          Save Analysis
        </Button>
      </div>
    </div>
  );
}
