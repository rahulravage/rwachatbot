
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileText, Send, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/chat/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseRegulatoryDocument, type ParseRegulatoryDocumentOutput } from '@/ai/flows/parse-regulatory-document-flow';
import { useToast } from '@/hooks/use-toast';
import { createCfrLink } from '@/lib/utils'; // Added import

export default function RegulatoryParserPage() {
  const [regulatoryLink, setRegulatoryLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParseRegulatoryDocumentOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!regulatoryLink.trim()) {
      setError('Please enter a regulatory link.');
      toast({ variant: "destructive", title: "Input Error", description: "Please enter a regulatory link." });
      return;
    }
    // Basic URL validation
    try {
        new URL(regulatoryLink);
    } catch (_) {
        setError('Invalid URL format. Please enter a valid link.');
        toast({ variant: "destructive", title: "Input Error", description: "Invalid URL format." });
        return;
    }

    setIsLoading(true);
    setError(null);
    setParsedData(null);
    
    try {
      const result = await parseRegulatoryDocument({ documentUrl: regulatoryLink });
      setParsedData(result);
      if (result.obligations.length === 0) {
        toast({ title: "Parsing Complete", description: "No specific obligations were extracted, or the document might not be a standard eCFR page." });
      } else {
        toast({ title: "Parsing Successful", description: `Extracted ${result.obligations.length} obligation(s).` });
      }
    } catch (err) {
      console.error('Error parsing regulatory document:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during parsing.';
      setError(`Failed to parse document: ${errorMessage}`);
      toast({ variant: "destructive", title: "Parsing Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
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
            Enter a link to a regulatory document (preferably from eCFR.gov). The tool will attempt to parse and summarize key obligations and rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="regulatoryLink" className="text-base font-medium">Regulatory Document Link</Label>
            <Input
              id="regulatoryLink"
              type="url"
              value={regulatoryLink}
              onChange={(e) => {
                setRegulatoryLink(e.target.value)
                if (error) setError(null); // Clear error on input change
              }}
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
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Parsing Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parsedData && !isLoading && (
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Parsed Obligations Summary</CardTitle>
            {parsedData.sourceTitle && <CardDescription>Source Document Title: {parsedData.sourceTitle}</CardDescription>}
            {!parsedData.sourceTitle && <CardDescription>Obligations extracted from the provided link.</CardDescription>}
          </CardHeader>
          <CardContent>
            {parsedData.obligations && parsedData.obligations.length > 0 ? (
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
                    {parsedData.obligations.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-normal align-top">{item.obligation}</td>
                        <td className="px-4 py-3 whitespace-normal align-top">
                          {(() => {
                            let linkUrl: string | null = null;
                            if (item.rule.startsWith('http://') || item.rule.startsWith('https://')) {
                              linkUrl = item.rule;
                            } else {
                              linkUrl = createCfrLink(item.rule);
                            }

                            if (linkUrl) {
                              return (
                                <a
                                  href={linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:underline"
                                >
                                  {item.rule}
                                </a>
                              );
                            }
                            return item.rule; 
                          })()}
                        </td>
                        <td className="px-4 py-3 whitespace-normal align-top">{item.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>No Obligations Extracted</AlertTitle>
                <AlertDescription>
                  No specific obligations or rules were extracted. This could be because the document format is not recognized, the link does not point to a standard eCFR page, or the content does not contain clearly defined obligations based on the parsing logic.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
       <Alert className="w-full max-w-3xl" variant="default">
        <FileText className="h-4 w-4" />
        <AlertTitle>About this Tool</AlertTitle>
        <AlertDescription>
          This tool uses AI to attempt to parse regulatory documents from eCFR.gov links. 
          The accuracy and completeness of the extracted information depend on the AI model's understanding and the structure of the source document. Always verify critical information with the official source.
        </AlertDescription>
      </Alert>
    </main>
  );
}

