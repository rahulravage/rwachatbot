
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

export default function ChatHistoryPage() {
  return (
    <main className="flex flex-col items-center flex-grow bg-background p-4 md:p-6 lg:p-8 space-y-6">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-primary">
            <ScrollText className="h-6 w-6" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will display your chat history for each session.
          </p>
          <p className="mt-4 text-sm">
            (Functionality to save and display chat history is not yet implemented.)
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
