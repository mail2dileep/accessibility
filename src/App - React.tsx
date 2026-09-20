import React from 'react';
import { Textarea, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);
Chart.register(ArcElement, Tooltip, Legend);

type ChartData = {
  title: string;
  labels: string[];
  values: number[];
};

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart: any) {
    const { ctx, chartArea: { left, right, top, bottom, width, height } } = chart;
    ctx.save();
    ctx.font = 'bold 1.5em Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';
    const total = chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
    ctx.fillText(total, left + width / 2, top + height / 2);
    ctx.restore();
  }
};

const App: React.FC = () => {
  const [text, setText] = React.useState("");
  const [charts, setCharts] = React.useState<ChartData[]>([]);

  const handleTextChange = (value: string) => setText(value);

  const generateReport = () => {
    // Extract lines and normalize to full URLs (prepend https:// if missing)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const urls = lines.map(u => {
      if (/^https?:\/\//i.test(u)) return u;
      return `https://${u}`;
    });
    if (urls.length === 0) return;
    // POST to server and then refresh chart data
    fetch('http://localhost:3002/run-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    })
    .then(() => {
      // give server a moment to generate files, then fetch charts
      setTimeout(() => fetchChartData(), 1500);
    })
    .catch(err => console.error('Error starting scan:', err));
  };

  const fetchChartData = () => {
    fetch('http://localhost:3002/generate-report')
      .then(response => response.json())
      .then(data => setCharts(data.charts || []))
      .catch(error => console.error('Error fetching chart data:', error));
  };

  return (
    <div className="container mx-auto p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Accessibility Scanner</h1>
      <Textarea
        label="Enter your text (including URLs)"
        placeholder="Paste or type multiple lines of text here"
        value={text}
        onValueChange={handleTextChange}
        minRows={5}
        className="mb-4"
      />
      <div className="flex gap-4">
        <Button
          color="primary"
          id="runButton"
          endContent={<Icon icon="lucide:file-text" />}
          onPress={generateReport}
        >
          Accessibility check
        </Button>
        <Button
          color="primary"
          id="runButton1"
          endContent={<Icon icon="lucide:file-text" />}
          onPress={fetchChartData}
        >
          Generate HTML Report
        </Button>
      </div>
      {charts.length > 0 && (
        <div className="mt-8 w-full flex flex-wrap gap-8 justify-center items-start">
          {charts.map((chart, idx) => (
            <div key={idx} className="mb-8 flex flex-col items-center bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-2">{chart.title}</h2>
              <Doughnut
                data={{
                  labels: chart.labels,
                  datasets: [
                    {
                      data: chart.values,
                      backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#66bb6a', '#ab47bc',
                        '#29b6f6', '#ef5350', '#ffa726', '#8d6e63', '#26a69a',
                        '#d4e157', '#5c6bc0', '#ec407a', '#42a5f5', '#7e57c2'
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { display: true, position: 'bottom' },
                    datalabels: {
                      color: '#333',
                      font: { weight: 'bold' },
                      formatter: (value: number) => value
                    }
                  },
                  cutout: '60%',
                  //maintainAspectRatio: false,
                }}
                plugins={[centerTextPlugin]}
                style={{ width: 320, height: 300 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;