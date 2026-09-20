import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

interface DetailsTableProps {
  details: any[];
}

const DetailsTable: React.FC<DetailsTableProps> = ({ details }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<number>>(new Set());
  const [detailsWithSuggestions, setDetailsWithSuggestions] = useState<any[]>(details);

  useEffect(() => {
    if (details && details.length > 0) {
      setDetailsWithSuggestions(details);
      setTimeout(() => {
        const anchor = document.getElementById('details-table');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [details]);

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const generateSuggestion = async (index: number) => {
    if (detailsWithSuggestions[index]['AI Suggestion']) {
      return; // Already has suggestion
    }

    setLoadingSuggestions(prev => new Set(prev).add(index));
    
    try {
      const response = await fetch('http://localhost:3000/generate-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue: detailsWithSuggestions[index] })
      });

      if (!response.ok) throw new Error('Failed to generate suggestion');
      
      const data = await response.json();
      const updatedDetails = [...detailsWithSuggestions];
      updatedDetails[index] = {
        ...updatedDetails[index],
        'AI Suggestion': data.suggestion
      };
      setDetailsWithSuggestions(updatedDetails);
      
      // Auto-expand to show suggestion
      const newExpanded = new Set(expandedRows);
      newExpanded.add(index);
      setExpandedRows(newExpanded);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      const updatedDetails = [...detailsWithSuggestions];
      updatedDetails[index] = {
        ...updatedDetails[index],
        'AI Suggestion': 'Error generating suggestion. Please try again.'
      };
      setDetailsWithSuggestions(updatedDetails);
    } finally {
      setLoadingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  if (!detailsWithSuggestions || detailsWithSuggestions.length === 0) return null;

  const mainColumns = ['URL', 'Rule', 'Violation description', 'Violation Type', 'Impact', 'LEVEL'];
  const getMainColumnValue = (row: any, col: string) => {
    return row[col] || row[col.toLowerCase()] || row[col.charAt(0).toUpperCase() + col.slice(1).toLowerCase()] || '';
  };

  return (
    <div id="details-table" className="w-full px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Accessibility Issues Details</h2>
      <div className="space-y-4">
        {detailsWithSuggestions.map((row, idx) => (
          <Card key={idx} className="w-full">
            <CardHeader 
              className="flex gap-2 cursor-pointer hover:bg-gray-100 p-4"
              onClick={() => toggleRowExpansion(idx)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon 
                    icon={expandedRows.has(idx) ? "mdi:chevron-down" : "mdi:chevron-right"}
                    width={24}
                  />
                  <div>
                    <p className="font-semibold text-sm">{row.Rule}</p>
                    <p className="text-xs text-gray-600">{row.URL}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  row.Impact === 'critical' ? 'bg-red-200 text-red-800' :
                  row.Impact === 'serious' ? 'bg-orange-200 text-orange-800' :
                  row.Impact === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {row.Impact}
                </span>
              </div>
            </CardHeader>
            
            {expandedRows.has(idx) && (
              <>
                <Divider />
                <CardBody className="gap-4 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-sm mb-1">Violation Type</p>
                      <p className="text-sm">{row['Violation Type']}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">Level</p>
                      <p className="text-sm">{row.LEVEL || row.Level}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-sm mb-1">Violation Description</p>
                    <p className="text-sm">{row['Violation description']}</p>
                  </div>
                  
                  {row['HTML Element'] && (
                    <div>
                      <p className="font-semibold text-sm mb-1">HTML Element</p>
                      <code className="text-xs bg-gray-100 p-2 block overflow-auto">{row['HTML Element']}</code>
                    </div>
                  )}
                  
                  {row['DOM Element'] && (
                    <div>
                      <p className="font-semibold text-sm mb-1">DOM Element</p>
                      <code className="text-xs bg-gray-100 p-2 block overflow-auto">{row['DOM Element']}</code>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <Icon icon="mdi:lightbulb" width={18} />
                        AI Fix Suggestion
                      </p>
                      {!row['AI Suggestion'] && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => generateSuggestion(idx)}
                          isLoading={loadingSuggestions.has(idx)}
                        >
                          <Icon icon="mdi:sparkles" width={18} />
                        </Button>
                      )}
                    </div>
                    
                    {row['AI Suggestion'] ? (
                      <div className="text-sm whitespace-pre-wrap">
                        {row['AI Suggestion']}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Click the sparkle icon to generate AI suggestions</p>
                    )}
                  </div>
                </CardBody>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DetailsTable;