import React from 'react';
import { Textarea, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Doughnut } from 'react-chartjs-2';

// Types for props
interface ChartData {
  title: string;
  labels: string[];
  values: number[];
}

interface AppViewProps {
  text: string;
  onTextChange: (value: string) => void;
  isScanning: boolean;
  scanMessage: string;
  charts: ChartData[];
  details: any[];
  selected: { chartTitle: string, label: string } | null;
  onCrawlSite: () => void;
  onGenerateReport: () => void;
  onFetchChartData: () => void;
  onFetchSliceDetails: (chartTitle: string, label: string) => void;
  onDownloadHtmlReport: () => void;
  onDownloadReportWithSuggestions: () => void;
  ProgressBar: React.FC<{ show: boolean }>;
  centerTextPlugin: any;
}

const AppView: React.FC<AppViewProps> = ({
  text,
  onTextChange,
  isScanning,
  scanMessage,
  charts,
  details,
  selected,
  onCrawlSite,
  onGenerateReport,
  onFetchChartData,
  onFetchSliceDetails,
  onDownloadHtmlReport,
  onDownloadReportWithSuggestions,
  ProgressBar,
  centerTextPlugin,
}) => (
  <div className="container mx-auto p-4 w-full">
    <h1 className="text-4xl font-bold mb-4 text-center">Accessibility Checker</h1>
    <ProgressBar show={isScanning} />
    {scanMessage && (
      <div className="bg-blue-100 text-blue-800 p-4 rounded mb-4">
        <Icon icon="lucide:info" className="inline mr-2" />
        {scanMessage}
      </div>
    )}
    <label className="block text-xl font-semibold mb-2 text-center" htmlFor="url-textarea">
      URLs  for Accessibility Check
    </label>
    <div className="w-full flex justify-center mb-4">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <Textarea
          id="url-textarea"
          placeholder="Paste or type multiple URLs/ Website's URL for crawling here"
          value={text}
          onValueChange={onTextChange}
          minRows={5}
          className="w-full"
        />
        <div className="flex flex-row gap-4 mt-4 justify-center">
          <Button
            color="secondary"
            id="crawlButton"
            endContent={<Icon icon="lucide:globe" />}
            onPress={onCrawlSite}
          >
            Scan Website
          </Button>
          <Button
            color="primary"
            id="runButton"
            endContent={<Icon icon="lucide:file-text" />}
            onPress={onGenerateReport}
          >
            Scan Pages
          </Button>
          <Button
            color="primary"
            id="runButton1"
            endContent={<Icon icon="lucide:file-text" />}
            onPress={onFetchChartData}
          >
            Generate Report
          </Button>
        </div>
      </div>
    </div>
    {charts.length > 0 && (
      <div className="flex items-center mb-8 w-full max-w-5xl mx-auto">
        <div className="flex-1" />
        <span className="text-lg font-semibold text-center flex-1" style={{ minWidth: 180 }}>
          Total Issues:{' '}
          <a
            href="#"
            className="text-blue-600 underline font-semibold"
            onClick={e => {
              e.preventDefault();
              onFetchSliceDetails(charts[0].title, '');
            }}
            title={`Show all records for ${charts[0].title}`}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onFetchSliceDetails(charts[0].title, '');
              }
            }}
            style={{ textDecoration: 'underline' }}
          >
            {charts[0]?.values?.reduce((a, b) => a + b, 0) ?? 0}
          </a>
        </span>
        <div className="flex-1 flex justify-end gap-2">
          <Button
            color="secondary"
            id="downloadButton"
            endContent={<Icon icon="lucide:download" />}
            onPress={onDownloadHtmlReport}
          >
            Report
          </Button>
          <Button
            color="success"
            id="downloadAIButton"
            endContent={<Icon icon="lucide:sparkles" />}
            onPress={onDownloadReportWithSuggestions}
          >
            AI Report
          </Button>
        </div>
      </div>
    )}
    {charts.length > 0 && (
      <div className="mt-8 w-full flex flex-wrap gap-8 justify-center items-start relative">
        {charts.map((chart, idx) => (
          <div
            key={idx}
            className="mb-8 flex flex-col items-center bg-white rounded shadow p-4"
            style={{ minWidth: 340, maxWidth: 400, flex: '1 1 340px', position: 'relative' }}
          >
            <h2 className="text-2xl font-semibold mb-2">{chart.title}</h2>
            <div style={{ position: 'relative', width: 340, height: 340 }}>
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
                  onHover: (event: any, chartElement: any[]) => {
                    if (chartElement && chartElement.length > 0) {
                      event.native.target.style.cursor = 'pointer';
                    } else {
                      event.native.target.style.cursor = 'default';
                    }
                  },
                  onClick: (event: any, elements: any[]) => {
                    if (elements && elements.length > 0) {
                      const sliceIdx = elements[0].index;
                      onFetchSliceDetails(chart.title, chart.labels[sliceIdx]);
                    }
                  }
                }}
                plugins={[centerTextPlugin]}
                style={{ width: '100%', height: '340px' }}
              />
              {/* Center overlay for click */}
              <div
                title={`Show all records for ${chart.title}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 190,
                  height: 190,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 100,
                  pointerEvents: 'auto',
                  background: 'rgba(255,255,255,0)',
                  borderRadius: '50%',
                }}
                onClick={() => {
                  onFetchSliceDetails(chart.title, '');
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
   
  </div>
);

export default AppView;