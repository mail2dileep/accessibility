  import React from 'react';
        import { Textarea, Button } from "@heroui/react";
        import { Icon } from "@iconify/react";
        //import cors from 'cors';
       // const cors = require('cors');

        const App: React.FC = () => {
          const [text, setText] = React.useState("");
         //  const [htmlReport, setHtmlReport] = React.useState<string | null>(null);
          
          const handleTextChange = (value: string) => {
            setText(value);
          };

    const generateReport = () => {
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urls = text.match(urlPattern) || [];
      console.log("URLs found:", urls);

      if (urls.length === 0) {
        console.log("No URLs found in the text.");
        return;
      }

      // Send URLs to the server
      fetch('http://localhost:3000/run-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    }
        const htmlreport = () => {

          
      // This function will be called when the "Generate Report" button is clicked
      console.log("Generate Html report button clicked");
      fetch('http://localhost:3000/generate-report') // Adjust the URL to match your server's endpoint for generating HTML reports
        // Adjust the URL to match your server's endpoint for generating HTML reports
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    }
          // New function to extract URLs and generate CSV
         

          return (
            <div className="container mx-auto p-4 max-w-2xl">
              <h1 className="text-2xl font-bold mb-4">Accessibility Scanner</h1>
              <Textarea
                label="Enter your text (including URLs  )"
                placeholder="Paste or type URLs here..."
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
                  onPress={htmlreport}
                >
                  Generate HTML Report
                </Button>
              </div>
            </div>
          );
        };

        export default App;
       // app.use(cors());