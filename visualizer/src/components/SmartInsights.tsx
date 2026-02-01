import { Insight } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Clock, AlertTriangle, TrendingUp, Code, BarChart2, Laptop, Shuffle, BookOpen, Music, Users, Layers, CheckCircle, Shield } from "lucide-react";

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
            case "activity": return <Zap className="h-5 w-5 text-orange-500" />;
            case "laptop": return <Laptop className="h-5 w-5 text-blue-400" />;
            case "shuffle": return <Shuffle className="h-5 w-5 text-indigo-500" />;
            case "book": return <BookOpen className="h-5 w-5 text-teal-500" />;
            case "music": return <Music className="h-5 w-5 text-pink-500" />;
            case "users": return <Users className="h-5 w-5 text-sky-500" />;
            case "layers": return <Layers className="h-5 w-5 text-indigo-400" />;
            case "check": return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case "shield": return <Shield className="h-5 w-5 text-blue-500" />;
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
                        <div key={index} className="flex gap-4 p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors">
                            <div className="flex-shrink-0 mt-1">
                                {getIcon(insight.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground mb-1 truncate">{insight.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
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
