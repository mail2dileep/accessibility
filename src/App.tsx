import React, { useEffect, useState } from 'react';
import { Textarea, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);
Chart.register(ArcElement, Tooltip, Legend);
import AppView from './AppView';
import DetailsTable from './DetailsTable';

// API base URL configurable via Vite env var `VITE_API_URL` (set in Render static site)
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002';

type ChartData = {
  title: string;
  labels: string[];
  values: number[];
};

const ProgressBar: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="w-full flex justify-center my-4">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full animate-pulse"
            style={{ width: '80%' }}
          />
        </div>
        <span className="ml-3 text-blue-700 font-semibold mt-2">Scanning in progress...</span>
      </div>
    </div>
  );
};

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart: any) {
    try {
      const { ctx, chartArea: { left, width, top, height } } = chart;
      ctx.save();
      ctx.font = 'bold 1.2em Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      const total = (chart.data?.datasets?.[0]?.data || []).reduce((a: number, b: number) => a + b, 0);
      ctx.fillText(String(total), left + width / 2, top + height / 2);
      ctx.restore();
    } catch (e) {
      // ignore
    }
  }
};

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ chartTitle: string; label: string } | null>(null);

  useEffect(() => {
    // placeholder: could fetch initial data
  }, []);

  const handleTextChange = (val: string) => setText(val);

  const fetchAllDetails = async () => {
    // try to fetch details from backend; fallback to current details
    try {
      const res = await fetch(`${API_BASE}/slice-details`);
      if (res.ok) {
        const body = await res.json();
        return body.details || [];
      }
    } catch (e) {}
    return details || [];
  };

  const downloadHtmlReport = async () => {
    const allDetails = await fetchAllDetails(); // Fetch all records
    const order = ['URL', 'LEVEL', 'Impact','Rule','Violation Type','Violation Description'];
    const orderedCharts = [
      ...order.map(title => charts.find((c: any) => c && c.title === title)).filter(Boolean),
      ...charts.filter((c: any) => c && !order.includes(c.title))
    ];
    if (!allDetails.length || !orderedCharts.length) {
      alert("No data available to download the report.");
      return;
    }
    let html = `
      <html>
        <head>
          <title>Accessibility Report</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            .chart-container {
              display: inline-block;
              vertical-align: top;
              margin: 16px;
              background: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 8px #0001;
              padding: 16px;
              width: 420px;
              position: relative;
            }
            .chart-title { text-align: center; margin-bottom: 8px; }
            .center-overlay {
              position: absolute;
              left: 50%; top: 50%;
              transform: translate(-50%, -50%);
              width: 252px; height: 252px;
              cursor: pointer;
              z-index: 10;
              background: rgba(255,255,255,0);
              border-radius: 50%;
            }
            #details-table { margin-top: 32px; border-collapse: collapse; width: 100%; }
            #details-table th, #details-table td { border: 1px solid #ccc; padding: 6px 10px; }
            #details-table th { background: #f5f5f5; }
            .total-issues-link {
              color: #2563eb;
              text-decoration: underline;
              font-weight: 600;
              font-size: 1.15em;
              cursor: pointer;
            }
            .total-issues-summary {
              text-align: center;
              margin: 18px 0 30px 0;
              font-size: 1.15em;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <h1 style="text-align:center">Accessibility Report</h1>
          <div class="total-issues-summary">
            Total Issues:
            <a href="#" class="total-issues-link" id="totalIssuesLink"></a>
          </div>
          <div id="charts-row">
            ${orderedCharts.map((chart: any, idx: number) => `
              <div class="chart-container">
                <h2 class="chart-title">${chart.title}</h2>
                <canvas id="chart${idx}" width="360" height="300"></canvas>
                <div class="center-overlay" id="centerOverlay${idx}" title="Show all records for ${chart.title}"></div>
              </div>
            `).join('')}
          </div>
          <div id="details"></div>
          <script>
            const centerTextPlugin = {
              id: 'centerText',
              afterDraw(chart) {
                const { ctx, chartArea: { left, width, top, height } } = chart;
                ctx.save();
                ctx.font = 'bold 1.5em Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#333';
                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                ctx.fillText(total, left + width / 2, top + height / 2);
                ctx.restore();
              }
            };

            const allDetails = ${JSON.stringify(allDetails)};
            const chartConfigs = ${JSON.stringify(orderedCharts)};

            // Calculate total issues from the first chart (like in React)
            const totalIssues = chartConfigs[0]?.values?.reduce((a, b) => a + b, 0) || 0;
            document.addEventListener('DOMContentLoaded', function() {
              const totalLink = document.getElementById('totalIssuesLink');
              if (totalLink) {
                totalLink.textContent = totalIssues;
                totalLink.onclick = function(e) {
                  e.preventDefault();
                  // Show all records for the first chart
                  renderTable(allDetails, '', chartConfigs[0]?.title || '');
                };
              }

              chartConfigs.forEach(function(chart, idx) {
                const ctx = document.getElementById('chart' + idx).getContext('2d');
                new Chart(ctx, {
                  type: 'doughnut',
                  data: {
                    labels: chart.labels,
                    datasets: [{
                      data: chart.values,
                      backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#66bb6a', '#ab47bc',
                        '#29b6f6', '#ef5350', '#ffa726', '#8d6e63', '#26a69a',
                        '#d4e157', '#5c6bc0', '#ec407a', '#42a5f5', '#7e57c2'
                      ]
                    }]
                  },
                  options: {
                    plugins: {
                      legend: { display: true, position: 'bottom', labels: { boxWidth: 20, font: { size: 14 } } },
                      datalabels: {
                        color: '#333',
                        font: { weight: 'bold', size: 16 },
                        formatter: function(value, context) { return value; },
                        listeners: {
                          enter: function(context) {
                            context.chart.canvas.style.cursor = 'pointer';
                          },
                          leave: function(context) {
                            context.chart.canvas.style.cursor = 'default';
                          }
                        }
                      }
                    },
                    cutout: '60%',
                    onClick: function(event, elements) {
                      if (elements && elements.length > 0) {
                        const sliceIdx = elements[0].index;
                        const label = this.data.labels[sliceIdx];
                        // Try to find a matching key (normalize spaces/underscores/case)
                        const key = Object.keys(allDetails[0]).find(
                          k => k.replace(/[_\s]/g, '').toLowerCase() === chart.title.replace(/[_\s]/g, '').toLowerCase()
                        );
                        let filtered = [];
                        if (key) {
                          filtered = allDetails.filter(row => row[key] && row[key].toString().trim() === label.toString().trim());
                        }
                        // Fallback: try to find a matching key with trimmed spaces and trimmed value
                        if ((!filtered || filtered.length === 0) && allDetails.length > 0) {
                          const tryKey = (row) => {
                            const keys = Object.keys(row);
                            const match = keys.find(k => k.trim().toLowerCase() === chart.title.trim().toLowerCase());
                            return match ? allDetails.filter((row) => row[match] && row[match].toString().trim() === label.toString().trim()) : [];
                          };
                          filtered = tryKey(allDetails[0]);
                        }
                        // Final fallback: match any value in the row
                        if ((!filtered || filtered.length === 0) && allDetails.length > 0) {
                          filtered = allDetails.filter(row => {
                            return Object.values(row).some(
                              v => v && v.toString().trim() === label.toString().trim()
                            );
                          });
                        }
                        renderTable(filtered, label, chart.title);
                      }
                    }
                  },
                  plugins: [ChartDataLabels, centerTextPlugin]
                });

                // Center overlay click for all records
                document.getElementById('centerOverlay' + idx).onclick = function() {
                  renderTable(allDetails, '', chart.title);
                };
              });
            });

            function escapeHtml(text) {
              return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#039;");
            }
            function renderTable(records, label, chartTitle) {
              if (!records || records.length === 0) {
                document.getElementById('details').innerHTML = '<a id="details-anchor"></a><p style="margin-top:32px;">No records found.</p>';
                document.getElementById('details-anchor').scrollIntoView({ behavior: 'smooth' });
                return;
              }
              let html = '<a id="details-anchor"></a>';
              html += '<h3>Details for <b>' + (label ? label : 'All') + '</b> in <b>' + chartTitle + '</b></h3>';
              html += '<table id="details-table"><thead><tr>';
              Object.keys(records[0]).forEach(key => {
                html += '<th>' + key + '</th>';
              });
              html += '</tr></thead><tbody>';
              records.forEach(row => {
                html += '<tr>';
                Object.values(row).forEach(val => {
                  html += '<td>' + escapeHtml(val) + '</td>';
                });
                html += '</tr>';
              });
              html += '</tbody></table>';
              document.getElementById('details').innerHTML = html;
              document.getElementById('details-anchor').scrollIntoView({ behavior: 'smooth' });
            }
          </script>
        </body>
      </html>
    `;

    // Create a blob and trigger download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadReportWithSuggestions = () => {
    fetch(`${API_BASE}/generate-report-with-suggestions`)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'accessibility-report-with-suggestions.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setScanMessage('Report with AI suggestions downloaded successfully!');
      })
      .catch(error => {
        console.error('Error downloading report:', error);
        setScanMessage('Failed to download report with suggestions. Make sure you have completed a scan.');
      });
  };

  // Placeholder functions used by AppView
  const crawlSite = async () => {
    setIsScanning(true);
    setScanMessage('Scanning started...');
    try {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const urls = lines.map(u => (/^https?:\/\//i.test(u) ? u : `https://${u}`));
      if (urls.length > 0) {
        await fetch(`${API_BASE}/crawl-site`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls })
        });
      }
      setScanMessage('Scanning in progress...');
      // give server time to run then refresh charts
      await new Promise(r => setTimeout(r, 1500));
      await fetchChartData();
      setScanMessage('Scanning completed');
    } catch (err) {
      console.error('crawlSite error', err);
      setScanMessage('Scanning failed');
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  const generateReport = async () => {
    // Send URLs to server to run scan, then fetch chart data
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const urls = lines.map(u => (/^https?:\/\//i.test(u) ? u : `https://${u}`));
    if (urls.length === 0) return;
    setIsScanning(true);
    setScanMessage('Scanning started...');
    try {
      await fetch(`${API_BASE}/run-script`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls })
      });
      setScanMessage('Scanning in progress...');
      // allow server to generate CSV/json
      await new Promise(r => setTimeout(r, 1500));
      await fetchChartData();
      setScanMessage('Scanning completed');
    } catch (err) {
      console.error('generateReport error', err);
      setScanMessage('Scanning failed');
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch(`${API_BASE}/generate-report`);
      if (!res.ok) throw new Error('Failed to fetch charts');
      const body = await res.json();
      setCharts(body.charts || []);
    } catch (err) {
      console.error('fetchChartData error', err);
    }
  };

  const fetchSliceDetails = async (chartTitle: string, label: string) => {
    try {
      const params = new URLSearchParams();
      if (chartTitle) params.set('chartTitle', chartTitle as string);
      if (label) params.set('label', label as string);
      const res = await fetch(`${API_BASE}/slice-details?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch slice details');
      const body = await res.json();
      setDetails(body.details || []);
      setSelected({ chartTitle, label });
    } catch (err) {
      console.error('fetchSliceDetails error', err);
    }
  };

  return (
    <>
      <AppView
        text={text}
        onTextChange={handleTextChange}
        isScanning={isScanning}
        scanMessage={scanMessage}
        charts={charts}
        details={details}
        selected={selected}
        onCrawlSite={crawlSite}
        onGenerateReport={generateReport}
        onFetchChartData={fetchChartData}
        onFetchSliceDetails={fetchSliceDetails}
        onDownloadHtmlReport={downloadHtmlReport}
        onDownloadReportWithSuggestions={downloadReportWithSuggestions}
        ProgressBar={ProgressBar}
        centerTextPlugin={centerTextPlugin}
      />
      <DetailsTable details={details} />
    </>
  );
};

export default App;
