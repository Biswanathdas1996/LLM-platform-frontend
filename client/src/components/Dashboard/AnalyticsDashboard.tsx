import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, FileSpreadsheet, TrendingUp, BarChart3, 
  PieChart, LineChart, Download, Trash2, Lightbulb,
  Target, Activity, AlertTriangle, Loader2
} from "lucide-react";
import { 
  BarChart, Bar, LineChart as RechartsLine, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Dataset, DataInsight } from "@shared/schema";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AnalyticsDashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch all datasets
  const { data: datasetsData, isLoading: datasetsLoading } = useQuery({
    queryKey: ['/api/analytics/datasets'],
  });

  // Fetch selected dataset details
  const { data: datasetDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/analytics/datasets', selectedDatasetId],
    enabled: selectedDatasetId !== null,
  });

  // Fetch insights for selected dataset
  const { data: insightsData, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['/api/analytics/datasets', selectedDatasetId, 'insights'],
    enabled: false, // Manual trigger
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(50);
      const response = await fetch('/api/analytics/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }
      
      setUploadProgress(100);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Dataset uploaded successfully",
        description: `${data.dataset.rows} rows and ${data.dataset.columns} columns loaded`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/datasets'] });
      setSelectedDatasetId(data.dataset.id);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload dataset",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/analytics/datasets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Delete failed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dataset deleted",
        description: "The dataset has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/datasets'] });
      if (selectedDatasetId) {
        setSelectedDatasetId(null);
      }
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleGenerateInsights = () => {
    refetchInsights();
  };

  const datasets: Dataset[] = datasetsData?.datasets || [];
  const insights: DataInsight[] = insightsData?.insights || [];
  const stats = datasetDetails?.statistics || {};
  const data = datasetDetails?.data;

  // Prepare chart data from dataset
  const prepareChartData = () => {
    if (!data || !data.rows || data.rows.length === 0) return null;

    const numericColumns = Object.entries(stats)
      .filter(([_, stat]: [string, any]) => stat.type === 'numeric')
      .map(([col, _]) => col);

    if (numericColumns.length === 0) return null;

    // Take first 20 rows for visualization
    const chartData = data.rows.slice(0, 20).map((row: any[], index: number) => {
      const dataPoint: any = { index: index + 1 };
      data.headers.forEach((header: string, colIndex: number) => {
        if (numericColumns.includes(header)) {
          dataPoint[header] = typeof row[colIndex] === 'number' 
            ? row[colIndex] 
            : parseFloat(row[colIndex]) || 0;
        }
      });
      return dataPoint;
    });

    return { chartData, numericColumns };
  };

  const chartInfo = prepareChartData();

  // Prepare pie chart data for categorical columns
  const prepareCategoricalData = () => {
    const categoricalColumns = Object.entries(stats)
      .filter(([_, stat]: [string, any]) => stat.type === 'categorical')
      .map(([col, stat]) => ({ column: col, stat }));

    if (categoricalColumns.length === 0) return null;

    const firstCategorical = categoricalColumns[0];
    const pieData = (firstCategorical.stat as any).topValues.map((item: any, index: number) => ({
      name: item.value,
      value: item.count,
      color: COLORS[index % COLORS.length],
    }));

    return { pieData, column: firstCategorical.column };
  };

  const pieInfo = prepareCategoricalData();

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card data-testid="card-upload-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Dataset
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files (up to 1GB) for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              data-testid="button-select-file"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Select File
                </>
              )}
            </Button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="flex-1">
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dataset List */}
      {datasets.length > 0 && (
        <Card data-testid="card-dataset-list">
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {datasets.map((dataset) => (
                <Card
                  key={dataset.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDatasetId === dataset.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedDatasetId(dataset.id)}
                  data-testid={`card-dataset-${dataset.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold truncate" data-testid={`text-dataset-name-${dataset.id}`}>
                          {dataset.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{dataset.filename}</p>
                        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                          <span>{dataset.rows.toLocaleString()} rows</span>
                          <span>{dataset.columns} columns</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(dataset.id);
                        }}
                        data-testid={`button-delete-${dataset.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Analysis */}
      {selectedDatasetId && datasetDetails && (
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="statistics" data-testid="tab-statistics">
              <Activity className="mr-2 h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">
              <Lightbulb className="mr-2 h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Raw Data
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card data-testid="card-total-rows">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rows</p>
                      <p className="text-2xl font-bold">{datasetDetails.dataset.rows.toLocaleString()}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-total-columns">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Columns</p>
                      <p className="text-2xl font-bold">{datasetDetails.dataset.columns}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-file-size">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">File Size</p>
                      <p className="text-2xl font-bold">
                        {(datasetDetails.dataset.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <FileSpreadsheet className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {chartInfo && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card data-testid="card-line-chart">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Trend Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLine data={chartInfo.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {chartInfo.numericColumns.slice(0, 3).map((col, index) => (
                          <Line
                            key={col}
                            type="monotone"
                            dataKey={col}
                            stroke={COLORS[index]}
                            strokeWidth={2}
                          />
                        ))}
                      </RechartsLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card data-testid="card-bar-chart">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Value Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartInfo.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {chartInfo.numericColumns.slice(0, 3).map((col, index) => (
                          <Bar key={col} dataKey={col} fill={COLORS[index]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {pieInfo && (
              <Card data-testid="card-pie-chart">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    {pieInfo.column} Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={pieInfo.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieInfo.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(stats).map(([column, stat]: [string, any]) => (
                <Card key={column} data-testid={`card-stat-${column}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{column}</CardTitle>
                    <CardDescription>
                      Type: <span className="capitalize">{stat.type}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stat.type === 'numeric' ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Count:</span>
                            <span className="font-semibold">{stat.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min:</span>
                            <span className="font-semibold">{stat.min}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max:</span>
                            <span className="font-semibold">{stat.max}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mean:</span>
                            <span className="font-semibold">{stat.mean}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Median:</span>
                            <span className="font-semibold">{stat.median}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Std Dev:</span>
                            <span className="font-semibold">{stat.stdDev}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Count:</span>
                            <span className="font-semibold">{stat.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Unique Values:</span>
                            <span className="font-semibold">{stat.unique}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mode:</span>
                            <span className="font-semibold">{stat.mode}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-1">Top Values:</p>
                            {stat.topValues.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.value}</span>
                                <span className="text-muted-foreground">{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI-Generated Insights & Predictions
                  </CardTitle>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={insightsLoading}
                    data-testid="button-generate-insights"
                  >
                    {insightsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <Alert key={index} data-testid={`alert-insight-${index}`}>
                        <div className="flex items-start gap-3">
                          {insight.type === 'summary' && <Activity className="h-5 w-5 mt-0.5" />}
                          {insight.type === 'trend' && <TrendingUp className="h-5 w-5 mt-0.5 text-blue-500" />}
                          {insight.type === 'anomaly' && <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-500" />}
                          {insight.type === 'correlation' && <BarChart3 className="h-5 w-5 mt-0.5 text-green-500" />}
                          {insight.type === 'prediction' && <Target className="h-5 w-5 mt-0.5 text-purple-500" />}
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{insight.title}</h4>
                            <AlertDescription>{insight.description}</AlertDescription>
                            {insight.confidence && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Confidence:</span>
                                  <Progress value={insight.confidence * 100} className="h-1 w-24" />
                                  <span className="text-xs">{(insight.confidence * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Click "Generate Insights" to analyze your data with local AI models</p>
                    <p className="text-sm mt-1">Works completely offline using statistical analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card data-testid="card-raw-data">
              <CardHeader>
                <CardTitle>Raw Data Preview</CardTitle>
                <CardDescription>Showing first 100 rows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="p-2 text-left font-semibold">#</th>
                        {data.headers.map((header: string, index: number) => (
                          <th key={index} className="p-2 text-left font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.slice(0, 100).map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-b">
                          <td className="p-2 text-muted-foreground">{rowIndex + 1}</td>
                          {row.map((cell: any, cellIndex: number) => (
                            <td key={cellIndex} className="p-2">
                              {cell !== null && cell !== undefined ? String(cell) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {datasets.length === 0 && !uploadMutation.isPending && (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="p-12">
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No datasets uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first CSV or Excel file to start analyzing data
              </p>
              <Button onClick={() => fileInputRef.current?.click()} data-testid="button-upload-first">
                <Upload className="mr-2 h-4 w-4" />
                Upload Dataset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
