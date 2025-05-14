
"use client";

import type { AnswerRegQQuestionOutput } from '@/ai/flows/answer-regq-question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { linkifyCfrText } from '@/lib/utils';
import { Edit3, Save, XCircle, Copy } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface StructuredResponseProps {
  response: AnswerRegQQuestionOutput;
  onSave?: (editedResponse: AnswerRegQQuestionOutput) => Promise<void>;
  isSaving?: boolean;
  isHistoryView?: boolean; // New prop
}

const StructuredResponse: React.FC<StructuredResponseProps> = ({ 
  response, 
  onSave, 
  isSaving,
  isHistoryView = false // Default to false
 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<AnswerRegQQuestionOutput>(response);
  const { toast } = useToast();

  useEffect(() => {
    setEditedContent(response);
    // Only exit edit mode if the response prop itself has changed AND we are not currently in the process of saving.
    // This prevents exiting edit mode prematurely if the parent re-renders for other reasons while an edit is in progress.
    if (response !== editedContent && !isSaving) { 
       setIsEditing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]); // Dependency on `response` is correct here. `editedContent` and `isSaving` should not be deps for this specific effect.

  const handleEditToggle = () => {
    if (isHistoryView || !onSave) return; // Do nothing if in history view or no onSave handler

    if (isEditing) { 
      // This is the "Save" action
      onSave(editedContent).then(() => {
        setIsEditing(false); // Exit edit mode on successful save
      }).catch(() => {
        // Error handling is typically in parent via toast, keep edit mode active
      });
    } else { 
      // This is the "Edit" action
      setEditedContent(JSON.parse(JSON.stringify(response))); // Reset to current pristine response before editing
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (isHistoryView) return;
    setEditedContent(JSON.parse(JSON.stringify(response))); // Revert to original response state
    setIsEditing(false);
  };

  const handleChange = (field: keyof AnswerRegQQuestionOutput, value: string) => {
    if (isHistoryView) return;
    setEditedContent(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = async () => {
    const contentToCopy = [
      `Summary: ${response.summary}`,
      `Detailed Explanation: ${response.explanation}`,
      `References: ${response.references || 'N/A'}`,
      response.calculationLogic ? `Calculation Logic: ${response.calculationLogic}` : null,
      response.referenceTables ? `Reference Tables: ${response.referenceTables}` : null,
      response.calculationExamples ? `Calculation Examples: ${response.calculationExamples}` : null,
    ].filter(Boolean).join('\n\n');

    try {
      await navigator.clipboard.writeText(contentToCopy);
      toast({
        title: "Copied to clipboard",
        description: "Bot response has been copied.",
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy response to clipboard.",
      });
    }
  };

  const renderField = (
    label: string,
    fieldKey: keyof AnswerRegQQuestionOutput,
    isMultiline: boolean = true
  ) => {
    const value = editedContent[fieldKey] || "";
    // Only render the field if it exists in the original response, or in the edited content,
    // or if we are in edit mode (to allow adding content to initially empty fields).
    if (!response[fieldKey] && !editedContent[fieldKey] && !(isEditing && !isHistoryView)) return null;

    const displayValueIsEmpty = typeof value !== 'string' || value.trim() === "";

    return (
      <div className="w-full space-y-1 mb-4">
        <Label htmlFor={fieldKey} className="text-sm font-semibold text-foreground/90">{label}</Label>
        {(isEditing && !isHistoryView) ? (
          <Textarea
            id={fieldKey}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            rows={isMultiline ? (String(value).split('\n').length > 2 ? Math.min(String(value).split('\n').length, 10) : 3) : 1}
            className="w-full p-2 border rounded-md shadow-sm bg-background focus:ring-primary focus:border-primary text-sm"
            readOnly={isHistoryView}
          />
        ) : (
          <div className="p-3 bg-muted/30 rounded-md text-sm prose prose-sm max-w-none dark:prose-invert break-words">
            {displayValueIsEmpty ? (
              <span className="italic text-muted-foreground">Not provided</span>
            ) : (fieldKey === 'summary' || fieldKey === 'explanation' || fieldKey === 'references') ? (
              linkifyCfrText(value)
            ) : (typeof value === 'string' && value.includes('\n')) ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">{value}</pre>
            ) : (
              <p className="text-sm">{value}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full shadow-md bg-card text-card-foreground rounded-lg">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Bot Response</CardTitle>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={isSaving}>
                <Copy className="mr-1 h-4 w-4" /> Copy
              </Button>
            )}
            {!isHistoryView && onSave && ( // Only show Edit/Save/Cancel if not history and onSave is provided
              <>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    <XCircle className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                )}
                <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={handleEditToggle} disabled={isSaving}>
                  {isEditing ? <Save className="mr-1 h-4 w-4" /> : <Edit3 className="mr-1 h-4 w-4" />}
                  {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full px-4 py-2 space-y-2">
        {renderField("Summary", "summary", false)}
        {renderField("Detailed Explanation", "explanation")}
        {renderField("References", "references")}
        {/* Conditionally render optional fields only if they have content or if in edit mode */}
        {response.calculationLogic || editedContent.calculationLogic || (isEditing && !isHistoryView) ? renderField("Calculation Logic", "calculationLogic") : null}
        {response.referenceTables || editedContent.referenceTables || (isEditing && !isHistoryView) ? renderField("Reference Tables", "referenceTables") : null}
        {response.calculationExamples || editedContent.calculationExamples || (isEditing && !isHistoryView) ? renderField("Calculation Examples", "calculationExamples") : null}
      </CardContent>
    </Card>
  );
};

export default StructuredResponse;
