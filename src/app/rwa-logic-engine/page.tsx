'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, Send, Brain, Calculator, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processRwaText, type ProcessRwaTextOutput, type ProcessRwaTextInput } from '@/ai/flows/process-rwa-text-flow';
import { calculateRwa, type CalculateRwaOutput, type CalculateRwaInput } from '@/ai/flows/calculate-rwa-flow';
import LoadingSpinner from '@/components/chat/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type RequiredInput = ProcessRwaTextOutput['requiredInputs'][number];

export default function RwaLogicEnginePage() {
  const [pastedResponse, setPastedResponse] = useState('');
  const [identifiedLogic, setIdentifiedLogic] = useState<string | null>(null);
  const [requiredParams, setRequiredParams] = useState<RequiredInput[] | null>(null);
  const [userInputValues, setUserInputValues] = useState<Record<string, string>>({});
  const [calculatedRwaResult, setCalculatedRwaResult] = useState<CalculateRwaOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isLoadingLogic, setIsLoadingLogic] = useState(false);
  const [isLoadingCalculation, setIsLoadingCalculation] = useState(false);

  const { toast } = useToast();

  const handleProcessText = async () => {
    if (!pastedResponse.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please paste the bot response first.' });
      return;
    }
    setIsLoadingLogic(true);
    setError(null);
    setIdentifiedLogic(null);
    setRequiredParams(null);
    setUserInputValues({});
    setCalculatedRwaResult(null);

    try {
      const result = await processRwaText({ rwaText: pastedResponse });
      setIdentifiedLogic(result.logicSummary);
      setRequiredParams(result.requiredInputs);
      if (result.requiredInputs.length === 0) {
        toast({ title: 'Information', description: 'No specific input parameters were identified for calculation based on the provided text.' });
      }
    } catch (err) {
      console.error('Error processing RWA text:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process text.';
      setError(`Error extracting logic: ${errorMessage}`);
      toast({ variant: 'destructive', title: 'Processing Error', description: errorMessage });
    } finally {
      setIsLoadingLogic(false);
    }
  };

  const handleUserInputChange = (paramName: string, value: string) => {
    setUserInputValues(prev => ({ ...prev, [paramName]: value }));
  };

  const handleCalculateRwa = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifiedLogic || !requiredParams) {
      toast({ variant: 'destructive', title: 'Error', description: 'Logic not identified. Process text first.' });
      return;
    }

    // Basic validation: check if all required fields are filled
    for (const param of requiredParams) {
      if (!userInputValues[param.name]?.trim()) {
        toast({ variant: 'destructive', title: 'Input Missing', description: `Please provide a value for "${param.label}".` });
        return;
      }
      if (param.type === 'number' || param.type === 'percentage') {
        if (isNaN(parseFloat(userInputValues[param.name]))) {
          toast({ variant: 'destructive', title: 'Invalid Input', description: `"${param.label}" must be a valid number.` });
          return;
        }
      }
    }


    setIsLoadingCalculation(true);
    setError(null);
    setCalculatedRwaResult(null);

    const inputsForFlow: Record<string, string | number> = {};
    Object.entries(userInputValues).forEach(([key, value]) => {
      const paramDefinition = requiredParams.find(p => p.name === key);
      if (paramDefinition && (paramDefinition.type === 'number' || paramDefinition.type === 'percentage')) {
        inputsForFlow[key] = parseFloat(value);
      } else {
        inputsForFlow[key] = value;
      }
    });

    try {
      const result = await calculateRwa({
        rwaContext: identifiedLogic,
        providedInputs: inputsForFlow,
      });
      setCalculatedRwaResult(result);
      toast({ title: 'Calculation Successful', description: `RWA calculated: ${result.calculatedRwa}` });
    } catch (err) {
      console.error('Error calculating RWA:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate RWA.';
      setError(`Error in calculation: ${errorMessage}`);
      toast({ variant: 'destructive', title: 'Calculation Error', description: errorMessage });
    } finally {
      setIsLoadingCalculation(false);
    }
  };

  return (
    <main className="flex flex-col items-center flex-grow bg-background p-4 md:p-6 lg:p-8 space-y-6">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-primary">
            <Cog className="h-6 w-6" />
            RWA Logic Engine (Standardized Approach)
          </CardTitle>
          <CardDescription>
            Paste a bot response containing RWA calculation logic. The engine will identify parameters and then calculate RWA based on your inputs, adhering to CFR Title 12.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pastedResponse" className="text-base font-medium">Step 1: Paste Bot Response</Label>
            <Textarea
              id="pastedResponse"
              value={pastedResponse}
              onChange={(e) => setPastedResponse(e.target.value)}
              placeholder="Paste the RWA calculation logic and examples from the chatbot here..."
              rows={8}
              className="mt-1 text-sm"
              disabled={isLoadingLogic || isLoadingCalculation}
            />
          </div>
          <Button onClick={handleProcessText} disabled={isLoadingLogic || isLoadingCalculation || !pastedResponse.trim()} className="w-full md:w-auto">
            {isLoadingLogic ? <LoadingSpinner size={18} className="mr-2" /> : <Brain className="mr-2 h-5 w-5" />}
            Extract Logic & Identify Inputs
          </Button>
        </CardContent>
      </Card>

      {isLoadingLogic && (
        <Card className="w-full max-w-3xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-center">
            <LoadingSpinner size={24} />
            <p className="ml-3 text-muted-foreground">Identifying calculation logic and parameters...</p>
          </CardContent>
        </Card>
      )}

      {error && (
         <Alert variant="destructive" className="w-full max-w-3xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {identifiedLogic && requiredParams && !isLoadingLogic && (
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Info className="h-5 w-5 text-primary" />Identified Logic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{identifiedLogic}</p>
          
            {requiredParams.length > 0 && (
              <form onSubmit={handleCalculateRwa} className="space-y-6 mt-6">
                <Separator />
                <h3 className="text-base font-medium pt-4">Step 2: Provide Input Values</h3>
                {requiredParams.map((param) => (
                  <div key={param.name} className="space-y-1.5">
                    <Label htmlFor={param.name} className="text-sm font-medium">
                      {param.label}
                      {param.type === 'percentage' && ' (%)'}
                    </Label>
                    {param.description && <p className="text-xs text-muted-foreground italic">{param.description}</p>}
                    <Input
                      id={param.name}
                      type={param.type === 'text' ? 'text' : 'number'}
                      value={userInputValues[param.name] || ''}
                      onChange={(e) => handleUserInputChange(param.name, e.target.value)}
                      placeholder={param.type === 'percentage' ? 'e.g., 50 for 50%' : `Enter ${param.label.toLowerCase()}`}
                      required
                      className="text-sm"
                      disabled={isLoadingCalculation}
                      step={param.type === 'number' || param.type === 'percentage' ? 'any' : undefined}
                    />
                  </div>
                ))}
                <Button type="submit" disabled={isLoadingCalculation} className="w-full md:w-auto">
                  {isLoadingCalculation ? <LoadingSpinner size={18} className="mr-2" /> : <Calculator className="mr-2 h-5 w-5" />}
                  Calculate RWA
                </Button>
              </form>
            )}
             {requiredParams.length === 0 && (
                <Alert className="mt-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Inputs Required</AlertTitle>
                    <AlertDescription>
                        The system did not identify any specific input parameters needed for a calculation based on the provided text. 
                        This might mean the text describes a general concept or the parameters are implicit.
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {isLoadingCalculation && (
         <Card className="w-full max-w-3xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-center">
            <LoadingSpinner size={24} />
            <p className="ml-3 text-muted-foreground">Calculating RWA...</p>
          </CardContent>
        </Card>
      )}

      {calculatedRwaResult && !isLoadingCalculation && (
        <Card className="w-full max-w-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5 text-primary" />RWA Calculation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground/90">Calculated RWA</Label>
              <p className="text-2xl font-bold text-primary p-2 bg-muted/30 rounded-md">{calculatedRwaResult.calculatedRwa.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground/90">Calculation Method (CFR Title 12)</Label>
              <p className="text-sm p-2 bg-muted/30 rounded-md whitespace-pre-wrap">{calculatedRwaResult.calculationMethod}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground/90">Step-by-Step Explanation</Label>
              <div className="text-sm p-3 bg-muted/30 rounded-md prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap break-words">
                {calculatedRwaResult.calculationSteps}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
