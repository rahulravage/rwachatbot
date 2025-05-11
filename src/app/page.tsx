import ChatInterface from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-background py-8 md:py-12">
      <ChatInterface />
    </main>
  );
}
