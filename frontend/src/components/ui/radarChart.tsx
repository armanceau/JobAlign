
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

//import type { NlpAnalysisResponse } from "../../App";

interface Props {
    analysisResult: any | null;
}

export default function RadarChart({ analysisResult }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        const labels = [
            "Compétences techniques",
            "Soft skills",
            "Langues",
            "Expérience",
        ];

        const values = labels.map((label) => {
            if (!analysisResult) return 0;
            // map label to matching key
            const keyMap: Record<string, keyof any> = {
                "Compétences techniques": "technical_skills",
                "Soft skills": "soft_skills",
                "Langues": "language",
                "Expérience": "experience",
            };
            const key = keyMap[label];
            const sub = analysisResult.matching?.subscores?.[key];
            const percent = sub?.score_percent ?? 0;
            // ensure 1-100 scale; if zero, keep 0
            return Math.max(0, Math.min(100, Math.round(percent)));
        });

        const data = {
            labels,
            datasets: [
                {
                    label: "Matching par catégorie",
                    data: values,
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    borderColor: "#000000",
                    borderWidth: 2,
                    pointBackgroundColor: "rgba(0, 0, 0, 0.3)",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 1,
                },
            ],
        };

        const options: any = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        stepSize: 20,
                        backdropColor: "transparent",
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    enabled: true,
                },
            },
        };

        if (canvasRef.current) {
            if (chartRef.current) {
                chartRef.current.data = data as any;
                chartRef.current.options = options;
                chartRef.current.update();
            } else {
                chartRef.current = new Chart(canvasRef.current, {
                    type: "radar",
                    data,
                    options,
                });
            }
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [analysisResult]);

    return (
        <div className="h-64">
            <canvas ref={canvasRef} />
        </div>
    );
}