import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudProvider } from "@shared/schema";
import { ChartData } from "@/lib/types";

declare global {
  interface Window {
    Chart: any;
  }
}

interface CostChartsProps {
  providers: CloudProvider[];
  cheapestProvider?: CloudProvider;
}

export default function CostCharts({ providers, cheapestProvider }: CostChartsProps) {
  const costChartRef = useRef<HTMLCanvasElement>(null);
  const breakdownChartRef = useRef<HTMLCanvasElement>(null);
  const sustainabilityChartRef = useRef<HTMLCanvasElement>(null);
  const serviceComparisonRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Chart) {
      initCostChart();
      initBreakdownChart();
      initSustainabilityChart();
      initServiceComparisonChart();
    } else {
      // Load Chart.js if not already loaded
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => {
        initCostChart();
        initBreakdownChart();
        initSustainabilityChart();
        initServiceComparisonChart();
      };
      document.head.appendChild(script);
    }
  }, [providers, cheapestProvider]);

  const initCostChart = () => {
    if (!costChartRef.current || !window.Chart) return;

    const ctx = costChartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(costChartRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: providers.map(p => p.name),
        datasets: [{
          label: 'Monthly Cost ($)',
          data: providers.map(p => p.total),
          backgroundColor: [
            '#FF9F43',
            '#0078D4',
            '#4285F4',
            '#F80000'
          ],
          borderColor: [
            '#FF7F00',
            '#106EBE',
            '#1E6DE5',
            '#C80000'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return '$' + value;
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  };

  const initBreakdownChart = () => {
    if (!breakdownChartRef.current || !window.Chart || !cheapestProvider) return;

    const ctx = breakdownChartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(breakdownChartRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    // Build comprehensive service categories data
    const labels = [];
    const data = [];
    const colors = [
      '#2563EB', // Compute - Blue
      '#10B981', // Storage - Green  
      '#F59E0B', // Database - Amber
      '#EF4444', // Networking - Red
      '#8B5CF6', // Analytics - Purple
      '#06B6D4', // AI/ML - Cyan
      '#EC4899', // Security - Pink
      '#84CC16', // Monitoring - Lime
      '#F97316', // DevOps - Orange
      '#6366F1', // Backup - Indigo
      '#14B8A6', // IoT - Teal
      '#F59E0B'  // Media - Amber variant
    ];

    // Add core services
    if (cheapestProvider.compute > 0) {
      labels.push('Compute');
      data.push(cheapestProvider.compute);
    }
    if (cheapestProvider.storage > 0) {
      labels.push('Storage');
      data.push(cheapestProvider.storage);
    }
    if (cheapestProvider.database > 0) {
      labels.push('Database');
      data.push(cheapestProvider.database);
    }
    if (cheapestProvider.networking > 0) {
      labels.push('Networking');
      data.push(cheapestProvider.networking);
    }

    // Add comprehensive services if they exist and have costs > 0
    if (cheapestProvider.analytics && cheapestProvider.analytics > 0) {
      labels.push('Analytics');
      data.push(cheapestProvider.analytics);
    }
    if (cheapestProvider.ai && cheapestProvider.ai > 0) {
      labels.push('AI/ML');
      data.push(cheapestProvider.ai);
    }
    if (cheapestProvider.security && cheapestProvider.security > 0) {
      labels.push('Security');
      data.push(cheapestProvider.security);
    }
    if (cheapestProvider.monitoring && cheapestProvider.monitoring > 0) {
      labels.push('Monitoring');
      data.push(cheapestProvider.monitoring);
    }
    if (cheapestProvider.devops && cheapestProvider.devops > 0) {
      labels.push('DevOps');
      data.push(cheapestProvider.devops);
    }
    if (cheapestProvider.backup && cheapestProvider.backup > 0) {
      labels.push('Backup');
      data.push(cheapestProvider.backup);
    }
    if (cheapestProvider.iot && cheapestProvider.iot > 0) {
      labels.push('IoT');
      data.push(cheapestProvider.iot);
    }
    if (cheapestProvider.media && cheapestProvider.media > 0) {
      labels.push('Media');
      data.push(cheapestProvider.media);
    }

    // Add advanced 2025 services if they exist and have costs > 0
    if (cheapestProvider.quantum && cheapestProvider.quantum > 0) {
      labels.push('Quantum');
      data.push(cheapestProvider.quantum);
    }
    if (cheapestProvider.advancedAI && cheapestProvider.advancedAI > 0) {
      labels.push('Advanced AI');
      data.push(cheapestProvider.advancedAI);
    }
    if (cheapestProvider.edge && cheapestProvider.edge > 0) {
      labels.push('Edge & 5G');
      data.push(cheapestProvider.edge);
    }
    if (cheapestProvider.confidential && cheapestProvider.confidential > 0) {
      labels.push('Confidential');
      data.push(cheapestProvider.confidential);
    }
    if (cheapestProvider.sustainability && cheapestProvider.sustainability > 0) {
      labels.push('Sustainability');
      data.push(cheapestProvider.sustainability);
    }
    if (cheapestProvider.scenarios && cheapestProvider.scenarios > 0) {
      labels.push('Scenarios');
      data.push(cheapestProvider.scenarios);
    }

    new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value}/mo (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };

  const initSustainabilityChart = () => {
    if (!sustainabilityChartRef.current || !window.Chart || !cheapestProvider) return;
    
    const ctx = sustainabilityChartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(sustainabilityChartRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    // Check if providers have sustainability data
    const hasRenewableData = providers.some(p => p.renewableEnergyPercent !== undefined);
    const hasCarbonData = providers.some(p => p.carbonFootprint !== undefined);
    
    if (!hasRenewableData && !hasCarbonData) return;

    const datasets = [];
    
    if (hasRenewableData) {
      datasets.push({
        label: 'Renewable Energy %',
        data: providers.map(p => p.renewableEnergyPercent || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        yAxisID: 'y'
      });
    }

    if (hasCarbonData) {
      datasets.push({
        label: 'Carbon Footprint (tons CO2/mo)',
        data: providers.map(p => p.carbonFootprint || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        yAxisID: 'y1'
      });
    }

    new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: providers.map(p => p.name),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear' as const,
            display: hasRenewableData,
            position: 'left' as const,
            max: 100,
            title: {
              display: true,
              text: 'Renewable Energy %'
            }
          },
          y1: {
            type: 'linear' as const,
            display: hasCarbonData,
            position: 'right' as const,
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'CO2 Emissions'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top' as const
          }
        }
      }
    });
  };

  const initServiceComparisonChart = () => {
    if (!serviceComparisonRef.current || !window.Chart) return;
    
    const ctx = serviceComparisonRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = window.Chart.getChart(serviceComparisonRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    // Define all service categories with their display names
    const serviceCategories = [
      { key: 'compute', name: 'Compute' },
      { key: 'storage', name: 'Storage' },
      { key: 'database', name: 'Database' },
      { key: 'networking', name: 'Networking' },
      { key: 'analytics', name: 'Analytics' },
      { key: 'ai', name: 'AI/ML' },
      { key: 'quantum', name: 'Quantum' },
      { key: 'advancedAI', name: 'Adv AI' },
      { key: 'edge', name: 'Edge/5G' },
      { key: 'confidential', name: 'Confidential' },
      { key: 'security', name: 'Security' },
      { key: 'monitoring', name: 'Monitoring' },
      { key: 'devops', name: 'DevOps' },
      { key: 'backup', name: 'Backup' }
    ];

    // Filter to only show categories that have non-zero costs
    const activeServices = serviceCategories.filter(service => 
      providers.some(provider => (provider as any)[service.key] > 0)
    );

    if (activeServices.length === 0) return;

    const datasets = providers.map((provider, index) => ({
      label: provider.name,
      data: activeServices.map(service => (provider as any)[service.key] || 0),
      backgroundColor: [
        'rgba(255, 159, 67, 0.8)',   // AWS - Orange
        'rgba(0, 120, 212, 0.8)',    // Azure - Blue
        'rgba(66, 133, 244, 0.8)',   // GCP - Google Blue
        'rgba(248, 0, 0, 0.8)'       // Oracle - Red
      ][index],
      borderColor: [
        'rgb(255, 159, 67)',
        'rgb(0, 120, 212)',
        'rgb(66, 133, 244)',
        'rgb(248, 0, 0)'
      ][index],
      borderWidth: 1
    }));

    new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: activeServices.map(s => s.name),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Monthly Cost ($)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top' as const
          }
        }
      }
    });
  };

  return (
    <div className="space-y-8 mb-8">
      {/* Primary Cost Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={costChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={breakdownChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>🌱 Sustainability Metrics</CardTitle>
            <p className="text-sm text-slate-600">Environmental impact comparison across providers</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={sustainabilityChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Service-by-Service Comparison</CardTitle>
            <p className="text-sm text-slate-600">Detailed cost analysis by service category</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={serviceComparisonRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Advanced Cloud Cost Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {providers.length > 0 && cheapestProvider ? Math.round((1 - cheapestProvider.total / Math.max(...providers.map(p => p.total))) * 100) : 0}%
              </div>
              <div className="text-sm text-slate-600 mt-1">Cost Optimization</div>
              <div className="text-xs text-slate-500 mt-1">vs most expensive option</div>
            </div>
            
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {providers.length > 0 ? Math.max(...providers.map(p => p.renewableEnergyPercent || 0)) : 0}%
              </div>
              <div className="text-sm text-slate-600 mt-1">Best Renewable Energy</div>
              <div className="text-xs text-slate-500 mt-1">highest among providers</div>
            </div>
            
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {/* Count of unique services with costs > 0 */}
                  {providers.length > 0 && cheapestProvider ? Object.keys(cheapestProvider).filter(key => 
                    !['name', 'total', 'carbonFootprint', 'renewableEnergyPercent'].includes(key) && 
                    (cheapestProvider as any)[key] > 0
                  ).length : 0}
              </div>
              <div className="text-sm text-slate-600 mt-1">Active Services</div>
              <div className="text-xs text-slate-500 mt-1">across your infrastructure</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
