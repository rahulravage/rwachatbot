import ChatInterface from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="flex flex-col items-center flex-grow bg-background">
      <ChatInterface />
    </main>
  );
}