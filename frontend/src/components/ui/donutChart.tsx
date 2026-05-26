import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface DonutChartProps {
  score: number;
}

function getScorePalette(score: number) {
  if (score >= 75) {
    return {
      fill: "#10b981",
      track: "rgba(16, 185, 129, 0.14)",
      text: "#047857",
    };
  }

  if (score >= 55) {
    return {
      fill: "#f59e0b",
      track: "rgba(245, 158, 11, 0.16)",
      text: "#b45309",
    };
  }

  return {
    fill: "#f43f5e",
    track: "rgba(244, 63, 94, 0.14)",
    text: "#be123c",
  };
}

export default function DonutChart({ score }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const safeScore = Math.max(0, Math.min(100, Math.round(score)));
    const palette = getScorePalette(safeScore);

    const centerLabelPlugin = {
      id: "centerLabel",
      afterDraw(chart: Chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        const firstArc = meta.data[0] as (typeof meta.data)[number] | undefined;

        if (!firstArc) {
          return;
        }

        const arcElement = firstArc as unknown as {
          x: number;
          y: number;
        };

        const centerX = arcElement.x;
        const centerY = arcElement.y;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = palette.text;
        ctx.font = "700 28px Geist, Inter, sans-serif";
        ctx.fillText(`${safeScore}%`, centerX, centerY - 8);
        ctx.fillStyle = "#475569";
        ctx.font = "500 11px Geist, Inter, sans-serif";
        ctx.fillText("Score global", centerX, centerY + 14);
        ctx.restore();
      },
    };

    const data = {
      labels: ["Alignement", "Reste"],
      datasets: [
        {
          data: [safeScore, 100 - safeScore],
          backgroundColor: [palette.fill, palette.track],
          borderWidth: 0,
          hoverOffset: 2,
          spacing: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      rotation: -90,
      circumference: 360,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    };

    if (canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: "doughnut",
        data,
        options,
        plugins: [centerLabelPlugin],
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [score]);

  return (
    <div className="mx-auto h-64 w-full max-w-xs">
      <canvas ref={canvasRef} />
    </div>
  );
}
