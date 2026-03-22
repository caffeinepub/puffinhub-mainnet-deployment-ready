import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  isError?: boolean;
}

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = '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';
const PRESET_MODEL = '@preset/puffin-hub';
const MAX_PROMPT_LENGTH = 1000;
const RATE_LIMIT_MS = 3000; // 3 seconds between requests

// Playful Puffin sayings
const PUFFIN_SAYINGS = [
  "Puffins have small brains, please be patient…",
  "Progress is puffin — it might take a moment.",
  "Even puffins make mistakes sometimes.",
  "A little puffin wisdom: slow and steady wins the fish.",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [currentSayingIndex, setCurrentSayingIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load message history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('puffin-chat-history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    } else {
      // Add welcome message if no history exists
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your friendly Puffin companion! 🐧 Ask me anything, and I'll do my best to help you!",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }

    // Set random initial saying
    setCurrentSayingIndex(Math.floor(Math.random() * PUFFIN_SAYINGS.length));
  }, []);

  // Save message history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('puffin-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Typing animation effect
  const typeMessage = (messageId: string, fullContent: string) => {
    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullContent.length) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: fullContent.slice(0, currentIndex), isTyping: currentIndex < fullContent.length }
              : msg
          )
        );
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  };

  const callOpenRouterAPI = async (userMessage: string): Promise<string> => {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PuffinHub Chat',
      },
      body: JSON.stringify({
        model: PRESET_MODEL,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      // Handle specific HTTP error codes
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('AUTHENTICATION_FAILED');
      } else if (response.status >= 500) {
        throw new Error('SERVER_ERROR');
      } else {
        throw new Error(`API_ERROR_${response.status}`);
      }
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('EMPTY_RESPONSE');
    }

    const messageContent = data.choices[0]?.message?.content;
    
    if (!messageContent || typeof messageContent !== 'string' || messageContent.trim() === '') {
      throw new Error('EMPTY_RESPONSE');
    }
    
    return messageContent.trim();
  };

  const getPuffinErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'RATE_LIMIT':
        return "Whoa there, partner! 🐧 I'm getting a bit overwhelmed with requests. Let's take a quick breather and try again in a moment!";
      case 'AUTHENTICATION_FAILED':
        return "Oops! 🐧 Authentication failed. There seems to be an issue with the API connection. Don't worry, our team is on it!";
      case 'SERVER_ERROR':
        return "The ocean waves are a bit rough right now! 🌊 Our servers are having a moment. Please try again shortly!";
      case 'EMPTY_RESPONSE':
        return "Hmm, I seem to have lost my train of thought! 🐧 Could you try asking that again?";
      case 'NETWORK_ERROR':
        return "I'm having trouble connecting to the ocean network! 🌊 Please check your internet connection and try again.";
      case 'PROMPT_TOO_LONG':
        return "Whoa! That's a lot to process! 🐧 Could you try asking that in fewer words? (Maximum 1000 characters)";
      case 'RATE_LIMITED_CLIENT':
        return "Easy there, friend! 🐧 Let's wait a few seconds before sending another message. Take a deep breath! 🌊";
      default:
        return "Something unexpected happened in the Puffin world! 🐧 Let's try that again, shall we?";
    }
  };

  const rotateSaying = () => {
    setCurrentSayingIndex((prev) => (prev + 1) % PUFFIN_SAYINGS.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();

    // Client-side safety: Check prompt length
    if (userMessageContent.length > MAX_PROMPT_LENGTH) {
      alert(`Your message is too long! Please keep it under ${MAX_PROMPT_LENGTH} characters. Current length: ${userMessageContent.length}`);
      setError(getPuffinErrorMessage('PROMPT_TOO_LONG'));
      return;
    }

    // Client-side safety: Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
      setError(getPuffinErrorMessage('RATE_LIMITED_CLIENT'));
      alert(`Please wait ${waitTime} more second${waitTime > 1 ? 's' : ''} before sending another message.`);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setLastRequestTime(now);

    // Rotate saying after message submission
    rotateSaying();

    try {
      // Call OpenRouter API
      const responseText = await callOpenRouterAPI(userMessageContent);

      // Create assistant message with typing animation
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isTyping: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Start typing animation
      setTimeout(() => {
        typeMessage(assistantMessageId, responseText);
      }, 300);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorCode = 'UNKNOWN';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
      } else if (error.message) {
        errorCode = error.message;
      }
      
      const errorMessage = getPuffinErrorMessage(errorCode);
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChatHistory = () => {
    if (confirm('Are you sure you want to clear your chat history?')) {
      localStorage.removeItem('puffin-chat-history');
      const welcomeMessage: Message = {
        id: 'welcome-new',
        role: 'assistant',
        content: "Hello! I'm your friendly Puffin companion! 🐧 Ask me anything, and I'll do my best to help you!",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
      setError(null);
    }
  };

  const retryLastMessage = () => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
      setError(null);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated wave motion background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <img 
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
          alt="" 
          className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
          style={{ animationDuration: '6s' }}
        />
        <img 
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
          alt="" 
          className="absolute right-0 bottom-0 h-full w-full animate-pulse object-cover opacity-50"
          style={{ animationDuration: '8s', animationDelay: '2s' }}
        />
      </div>

      {/* Floating puffin mascots */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute left-[10%] top-[20%] h-24 w-24 animate-bounce"
          style={{ animationDuration: '5s' }}
        />
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute right-[15%] top-[30%] h-32 w-32 animate-bounce"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
        />
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute left-[20%] bottom-[25%] h-28 w-28 animate-bounce"
          style={{ animationDuration: '7s', animationDelay: '2s' }}
        />
      </div>

      {/* Soft gradient orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute left-[5%] top-[15%] h-64 w-64 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
        <div className="absolute right-[10%] top-[40%] h-80 w-80 animate-pulse rounded-full bg-[oklch(0.70_0.12_180)] blur-3xl" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute left-[15%] bottom-[20%] h-72 w-72 animate-pulse rounded-full bg-primary/20 blur-3xl" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Floating feathers */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <img 
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
          alt="" 
          className="absolute left-[15%] top-[20%] h-6 w-6 animate-bounce"
          style={{ animationDuration: '4s' }}
        />
        <img 
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
          alt="" 
          className="absolute right-[20%] top-[40%] h-5 w-5 animate-bounce"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        <img 
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
          alt="" 
          className="absolute left-[25%] bottom-[30%] h-6 w-6 animate-bounce"
          style={{ animationDuration: '6s', animationDelay: '2s' }}
        />
        <img 
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
          alt="" 
          className="absolute right-[30%] bottom-[20%] h-5 w-5 animate-bounce"
          style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}
        />
      </div>

      <div className="container relative z-10 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/30"></div>
                <img 
                  src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                  alt="Puffin Mascot" 
                  className="relative h-32 w-32 drop-shadow-2xl animate-bounce"
                  style={{ animationDuration: '3s' }}
                />
              </div>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Chat with Puffin
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Have a conversation with our friendly Puffin mascot! Ask questions, get help, or just chat about anything. 🐧
            </p>
          </div>

          {/* Playful Puffin Wisdom Header */}
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/20 via-background to-primary/10 px-6 py-4 shadow-lg">
              {/* Floating feathers decoration */}
              <div className="absolute left-2 top-2 opacity-10 pointer-events-none">
                <img 
                  src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
                  alt="" 
                  className="h-6 w-6 animate-bounce"
                  style={{ animationDuration: '3s' }}
                />
              </div>
              <div className="absolute right-2 bottom-2 opacity-10 pointer-events-none">
                <img 
                  src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
                  alt="" 
                  className="h-6 w-6 animate-bounce"
                  style={{ animationDuration: '4s', animationDelay: '1s' }}
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <img 
                  src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                  alt="" 
                  className="h-10 w-10 flex-shrink-0"
                />
                <p className="text-center text-sm font-medium text-muted-foreground italic md:text-base">
                  {PUFFIN_SAYINGS[currentSayingIndex]}
                </p>
              </div>

              {/* Subtle wave decoration */}
              <div className="absolute bottom-0 left-0 right-0 h-4 opacity-10 pointer-events-none">
                <img 
                  src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                  alt="" 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Native Chat Interface Card */}
          <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/20 via-background to-primary/5 shadow-2xl">
            {/* Floating feathers decoration */}
            <div className="absolute right-4 top-4 opacity-20 pointer-events-none z-10">
              <img 
                src="/assets/generated/floating-feathers-collection-transparent.dim_200x100.png" 
                alt="" 
                className="h-16 w-auto animate-bounce"
                style={{ animationDuration: '4s' }}
              />
            </div>

            {/* Chat Header with Clear Button */}
            <div className="border-b border-primary/20 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/10 to-background/95 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                  alt="Puffin" 
                  className="h-8 w-8"
                />
                <span className="font-semibold text-primary">Puffin Assistant</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                className="border-primary/30 hover:bg-primary/10"
              >
                Clear Chat
              </Button>
            </div>

            {/* Chat Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="h-[500px] md:h-[600px] p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg'
                          : message.isError
                          ? 'bg-gradient-to-br from-destructive/20 to-destructive/10 border-2 border-destructive/30 shadow-md'
                          : 'bg-gradient-to-br from-[oklch(0.75_0.15_200)]/30 via-[oklch(0.70_0.12_180)]/20 to-background border-2 border-primary/20 shadow-md'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="mb-2 flex items-center gap-2">
                          {message.isError ? (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <img 
                              src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                              alt="Puffin" 
                              className="h-6 w-6"
                            />
                          )}
                          <span className={`text-xs font-semibold ${message.isError ? 'text-destructive' : 'text-primary'}`}>
                            {message.isError ? 'Puffin (Error)' : 'Puffin'}
                          </span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                        {message.isTyping && (
                          <span className="inline-block ml-1 animate-pulse">▋</span>
                        )}
                      </p>
                      <div className="mt-1 text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/30 via-[oklch(0.70_0.12_180)]/20 to-background border-2 border-primary/20 shadow-md">
                      <div className="flex items-center gap-2">
                        <img 
                          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                          alt="Puffin" 
                          className="h-6 w-6 animate-bounce"
                        />
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Puffin is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Error Display with Retry */}
            {error && (
              <div className="border-t border-destructive/20 bg-destructive/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryLastMessage}
                    className="border-destructive/30 hover:bg-destructive/10 flex-shrink-0"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-primary/20 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/10 to-background/95 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  {/* Subtle wave overlay */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none rounded-lg overflow-hidden">
                    <img 
                      src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                      alt="" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                    className="relative min-h-[60px] resize-none border-2 border-primary/30 bg-background/95 focus:border-primary focus:ring-primary"
                    maxLength={MAX_PROMPT_LENGTH}
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {input.length}/{MAX_PROMPT_LENGTH}
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!input.trim() || isLoading}
                  className="h-[60px] bg-gradient-to-br from-primary to-primary/80 px-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>

            {/* Subtle wave decoration at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none">
              <img 
                src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                alt="" 
                className="h-full w-full object-cover"
              />
            </div>
          </Card>

          {/* Info Section */}
          <div className="mt-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-3 backdrop-blur-sm">
              <img 
                src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                alt="" 
                className="h-8 w-8"
              />
              <p className="text-sm font-medium">
                🌊 Powered by OpenRouter AI & Internet Computer 🐧
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your chat history is saved locally in your browser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
