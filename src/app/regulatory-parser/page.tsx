
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileText, Send } from 'lucide-react';
import LoadingSpinner from '@/components/chat/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RegulatoryParserPage() {
  const [regulatoryLink, setRegulatoryLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null); // Replace 'any' with a proper type later

  const handleSubmit = async () => {
    if (!regulatoryLink.trim()) {
      setError('Please enter a regulatory link.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedData(null);
    // Placeholder for actual parsing logic
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    // Simulating an error for demonstration - remove in actual implementation
    if (regulatoryLink.includes("error")) {
        setError("Simulated error: Could not parse the provided link. Please ensure it's a valid eCFR link.");
    } else if (regulatoryLink.includes("empty")) {
        setParsedData({ summaryTable: [] }); // Simulate empty result
    }
     else {
      // Placeholder data
      setParsedData({
        summaryTable: [
          { obligation: 'Maintain minimum capital ratios', rule: '12 CFR § 217.10', details: 'Banks must maintain specific capital adequacy ratios.' },
          { obligation: 'Report suspicious activities', rule: '31 CFR § 1020.320', details: 'Financial institutions must file SARs for certain transactions.' },
        ],
        sourceTitle: "Example Regulation Document Title"
      });
    }
    setIsLoading(false);
  };

  return (
    <main className="flex flex-col items-center flex-grow bg-background p-4 md:p-6 lg:p-8 space-y-6">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-primary">
            <FileText className="h-6 w-6" />
            Regulatory Obligations Parser
          </CardTitle>
          <CardDescription>
            Enter a link to a regulatory document (e.g., from eCFR). The tool will attempt to parse and summarize key obligations and rules. (This is a placeholder and will be fully implemented later)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="regulatoryLink" className="text-base font-medium">Regulatory Document Link</Label>
            <Input
              id="regulatoryLink"
              type="url"
              value={regulatoryLink}
              onChange={(e) => setRegulatoryLink(e.target.value)}
              placeholder="e.g., https://www.ecfr.gov/current/title-12/chapter-II/part-217"
              className="mt-1 text-sm"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !regulatoryLink.trim()} className="w-full md:w-auto">
            {isLoading ? <LoadingSpinner size={18} className="mr-2" /> : <Send className="mr-2 h-5 w-5" />}
            Parse Obligations
          </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <Card className="w-full max-w-3xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-center">
            <LoadingSpinner size={24} />
            <p className="ml-3 text-muted-foreground">Parsing document and extracting obligations...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="w-full max-w-3xl">
          <FileText className="h-4 w-4" />
          <AlertTitle>Parsing Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parsedData && !isLoading && (
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Parsed Obligations Summary</CardTitle>
            {parsedData.sourceTitle && <CardDescription>Source: {parsedData.sourceTitle}</CardDescription>}
          </CardHeader>
          <CardContent>
            {parsedData.summaryTable && parsedData.summaryTable.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 text-left font-semibold text-foreground">Obligation</th>
                      <th scope="col" className="px-4 py-2.5 text-left font-semibold text-foreground">Rule/Reference</th>
                      <th scope="col" className="px-4 py-2.5 text-left font-semibold text-foreground">Details/Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {parsedData.summaryTable.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-normal align-top">{item.obligation}</td>
                        <td className="px-4 py-3 whitespace-nowrap align-top text-accent hover:underline">
                            {/* Basic link detection - improve with actual linkifier if needed */}
                            {item.rule.startsWith('http') ? 
                                <a href={item.rule} target="_blank" rel="noopener noreferrer">{item.rule}</a> : 
                                item.rule
                            }
                        </td>
                        <td className="px-4 py-3 whitespace-normal align-top">{item.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No specific obligations or rules were extracted from the provided link, or the document format is not yet supported.</p>
            )}
          </CardContent>
        </Card>
      )}
       <Alert className="w-full max-w-3xl" variant="default">
        <FileText className="h-4 w-4" />
        <AlertTitle>Feature Under Development</AlertTitle>
        <AlertDescription>
          The ability to parse regulatory documents and extract obligations is currently a placeholder. 
          Full functionality will be implemented in a future update. The current table is for demonstration purposes.
        </AlertDescription>
      </Alert>
    </main>
  );
}
