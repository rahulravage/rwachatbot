"use client";

import type { AnswerRegQQuestionOutput } from '@/ai/flows/answer-regq-question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { linkifyCfrText } from '@/lib/utils';
import { Edit3, Save, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface StructuredResponseProps {
  response: AnswerRegQQuestionOutput;
  onSave: (editedResponse: AnswerRegQQuestionOutput) => Promise<void>;
  isSaving: boolean;
}

const StructuredResponse: React.FC<StructuredResponseProps> = ({ response, onSave, isSaving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<AnswerRegQQuestionOutput>(response);

  useEffect(() => {
    setEditedContent(response);
    // Only reset editing state if the response fundamentally changes (e.g. new message ID, not just content update of same message)
    // For simplicity, we'll let it persist if an edit was in progress for the same conceptual message.
    // Or, if a save is successful, the parent might re-render with isEditing false.
    // If response object identity changes, it implies a new message, so reset editing.
    if (response !== editedContent) { // Basic check, could be improved with ID
       setIsEditing(false);
    }
  }, [response]);

  const handleEditToggle = () => {
    if (isEditing) { 
      onSave(editedContent).then(() => {
        // Optionally turn off editing mode after successful save.
        // This depends on desired UX. For now, keep it simple.
        // setIsEditing(false); 
      }).catch(() => {
        // Handle save error if needed, toast is usually in parent
      });
    } else { 
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(response); 
    setIsEditing(false);
  };

  const handleChange = (field: keyof AnswerRegQQuestionOutput, value: string) => {
    setEditedContent(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (
    label: string,
    fieldKey: keyof AnswerRegQQuestionOutput,
    isMultiline: boolean = true,
    isReference: boolean = false
  ) => {
    const value = editedContent[fieldKey] || "";
    // Always render the field if isEditing is true, even if value is empty, to allow adding content.
    if (!value && !isEditing && !response[fieldKey]) return null;


    return (
      <div className="space-y-1 mb-4">
        <Label htmlFor={fieldKey} className="text-sm font-semibold text-foreground/90">{label}</Label>
        {isEditing ? (
          <Textarea
            id={fieldKey}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            rows={isMultiline ? (String(value).split('\n').length > 2 ? Math.min(String(value).split('\n').length, 10) : 3) : 1}
            className="w-full p-2 border rounded-md shadow-sm bg-background focus:ring-primary focus:border-primary text-sm"
          />
        ) : (
          <div className="p-3 bg-muted/30 rounded-md text-sm prose prose-sm max-w-none dark:prose-invert break-words">
            {isReference ? (
                typeof value === 'string' ? linkifyCfrText(value) : value
            ) : (
                (typeof value === 'string' && value.includes('\n')) ? <pre className="whitespace-pre-wrap font-sans text-sm">{value}</pre> : <p className="text-sm">{value}</p>
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
            {isEditing && (
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                <XCircle className="mr-1 h-4 w-4" /> Cancel
              </Button>
            )}
            <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={handleEditToggle} disabled={isSaving}>
              {isEditing ? <Save className="mr-1 h-4 w-4" /> : <Edit3 className="mr-1 h-4 w-4" />}
              {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 space-y-2">
        {renderField("Summary", "summary", false)}
        {renderField("Detailed Explanation", "explanation")}
        {renderField("References", "references", true, true)}
        {response.calculationLogic || editedContent.calculationLogic || isEditing ? renderField("Calculation Logic", "calculationLogic") : null}
        {response.referenceTables || editedContent.referenceTables || isEditing ? renderField("Reference Tables", "referenceTables") : null}
      </CardContent>
    </Card>
  );
};

export default StructuredResponse;
