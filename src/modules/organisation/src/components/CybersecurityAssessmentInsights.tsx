import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { LoaderCircle } from 'lucide-react';

interface CybersecurityAssessmentInsightsProps {
  cybersecurityAssessmentData: Array<{domain: string, score: number, color: string}>;
  priorityData: Array<{domain: string, priority: number}>;
  keyInsightsData: Array<{n: number, insight: string, domain: string}>;
  detailedInsightsData: Array<{domain_short: string, domain: string, question: string, avg_score: number, recommendation: string}>;
  isLoading?: boolean;
}

const domainScoreConfig = {
  score: {
    label: "Average Score",
    color: "#22c55e",
  },
};

const priorityConfig = {
  priority: {
    label: "Priority Level", 
    color: "hsl(var(--chart-1))",
  },
};

export const CybersecurityAssessmentInsights = ({
  cybersecurityAssessmentData,
  priorityData,
  keyInsightsData,
  detailedInsightsData,
  isLoading
}: CybersecurityAssessmentInsightsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cybersecurity Assessment Insights</h2>
          <p className="text-muted-foreground">Analysis of cybersecurity assessment results</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const getScoreBadgeColor = (score: number) => {
    if (score < 3) return "bg-destructive/10 text-destructive border-destructive/20";
    if (score <= 4) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-green-500/10 text-green-700 border-green-500/20";
  };

  const getPriorityColor = (priority: number) => {
    return priority >= 0 ? "#22c55e" : "#ef4444";
  };

  const formatPriority = (priority: number) => {
    return priority >= 0 ? `+${priority.toFixed(2)}` : priority.toFixed(2);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cybersecurity Behaviour Assessment Insights</h2>
        <p className="text-muted-foreground">Analysis of cybersecurity assessment results</p>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Average Score by Domain */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-center">Average Score by Domain</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cybersecurityAssessmentData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="domain" 
                  height={100}
                  tick={{ fontSize: 9 }}
                  interval={0}
                  allowDataOverflow={false}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  domain={[0, 5]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Average Score', angle: -90, position: 'center', fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}`, 'Score']}
                  labelFormatter={(label: string) => `Domain: ${label}`}
                />
                <Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]}>
                  {cybersecurityAssessmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#22c55e" />
                  ))}
                  <LabelList dataKey="score" position="top" style={{ fontSize: '10px', fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heat Map */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-center">Domain Priority Heat Map</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 pb-2">
            <div className="space-y-2">
              {priorityData.map((item, index) => {
                const isPositive = item.priority > 0;
                const barWidth = Math.min(Math.abs(item.priority) / 50 * 100, 100);
                
                return (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-xs text-gray-700 min-w-0 flex-1 pr-6">{item.domain}</span>
                    <div className="flex items-center gap-6 w-48">
                      <div className="w-32 h-4 bg-gray-200 overflow-hidden">
                        <div 
                          className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ 
                            width: `${barWidth}%`,
                            marginLeft: isPositive ? '0' : 'auto'
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-0">
                        {item.priority.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights and Areas of Improvement Tables */}
      <div className="space-y-6">
        {/* Key Insights Table - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3 text-xs">Insight</TableHead>
                  <TableHead className="w-2/3 text-xs">Domain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keyInsightsData.map((insight: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-medium py-2">{insight.insight || 'N/A'}</TableCell>
                    <TableCell className="text-xs py-2">{insight.domain || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {keyInsightsData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      No key insights available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top 3 Areas of Improvement Table - Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top 3 Areas of Improvement</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Domain</TableHead>
                  <TableHead className="text-xs">Question</TableHead>
                  <TableHead className="text-xs">Avg Score</TableHead>
                  <TableHead className="text-xs">Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedInsightsData.map((area: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-medium">{area.domain || 'N/A'}</TableCell>
                    <TableCell className="text-xs whitespace-normal max-w-xs">{area.question || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={area.avg_score >= 3 ? "default" : "destructive"}>
                        {area.avg_score || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-normal max-w-xs">{area.recommendation || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {detailedInsightsData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No improvement areas identified
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};