import { Insight } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Clock, AlertTriangle, TrendingUp, Code, BarChart2 } from "lucide-react";

interface SmartInsightsProps {
    insights: Insight[];
}

export default function SmartInsights({ insights }: SmartInsightsProps) {
    if (insights.length === 0) return null;

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "zap": return <Zap className="h-5 w-5 text-yellow-500" />;
            case "clock": return <Clock className="h-5 w-5 text-blue-500" />;
            case "alert": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case "chart": return <BarChart2 className="h-5 w-5 text-purple-500" />;
            case "code": return <Code className="h-5 w-5 text-green-500" />;
            default: return <TrendingUp className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Smart Insights
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {insights.map((insight, index) => (
                        <div key={index} className="flex gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex-shrink-0 mt-1">
                                {getIcon(insight.icon)}
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-foreground mb-1">{insight.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {insight.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
