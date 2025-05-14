
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Cog, MessageSquare, History, FileText } from 'lucide-react'; // Added FileText
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Basel 3 SA Chatbot', icon: MessageSquare },
  { href: '/rwa-logic-engine', label: 'RWA Logic Engine', icon: Cog },
  { href: '/chat-history', label: 'Chat History', icon: History },
  { href: '/regulatory-parser', label: 'Obligations Parser', icon: FileText }, // New item
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
              <Bot className="h-7 w-7" />
              <span className="font-semibold text-lg text-foreground">Basel 3 SA Chatbot &amp; RWA Engine</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
