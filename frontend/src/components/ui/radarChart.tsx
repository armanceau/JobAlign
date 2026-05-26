
//compo radartchoart for App.tsx 
import React from "react";
import Chart from 'chart.js/auto';


function RadarChart({ data }: { data: any }) {
    const config = {
    type: 'radar',
    data: data,
    options: {
        elements: {
        line: {
            borderWidth: 3
        }
        }
    },
    };

    const dataRef = {//analysisResult.cv à récupérer depuis Main.tsx 
        labels: ['Running', 'Swimming', 'Eating', 'Cycling'],
        }
    return (
    <div>
        <canvas id="radarChart"></canvas>
    </div>
    );
}