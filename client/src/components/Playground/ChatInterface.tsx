import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGenerate, useRAGQuery } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  processingTime?: number;
  tokenCount?: number;
}

interface ChatInterfaceProps {
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  gpuLayers: number;
  selectedIndexes: string[];
}

export function ChatInterface({ selectedModel, temperature, maxTokens, gpuLayers, selectedIndexes }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const generateMutation = useGenerate();
  const ragQueryMutation = useRAGQuery();
  const { addNotification } = useNotifications();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedModel) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: !selectedModel ? 'Please select a model' : 'Please enter a message',
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      let finalPrompt = inputMessage;
      
      // If indexes are selected, query RAG for context
      if (selectedIndexes && selectedIndexes.length > 0) {
        try {
          const ragResponse = await ragQueryMutation.mutateAsync({
            index_names: selectedIndexes,
            query: inputMessage,
            k: 5,
            mode: 'hybrid',
          });

          if (ragResponse.success && ragResponse.results.length > 0) {
            // Build context from RAG results
            const context = ragResponse.results
              .map((result, idx) => 
                `[${idx + 1}] From "${result.document_name}" (relevance: ${(result.score * 100).toFixed(1)}%):\n${result.text}`
              )
              .join('\n\n');

            // Enhance the prompt with RAG context
            finalPrompt = `You are a helpful assistant. Answer the user's question based on the following context from the documents. If the context doesn't contain relevant information, you can use your general knowledge but mention that.

Context from documents:
${context}

User's question: ${inputMessage}

Please provide a helpful answer:`;
          }
        } catch (ragError) {
          console.warn('RAG query failed, proceeding without context:', ragError);
          // Continue without RAG context if it fails
        }
      }

      const response = await generateMutation.mutateAsync({
        question: finalPrompt,
        model_name: selectedModel,
        temperature,
        n_batch: 512,
        n_gpu_layers: gpuLayers,
      });

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          processingTime: response.processing_time,
          tokenCount: response.token_count,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate response',
      });
    }
  };

  return (
    <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col h-[600px]">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Chat</span>
          {selectedIndexes && selectedIndexes.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-normal">
              <BookOpen className="h-4 w-4" />
              <span>RAG Context: {selectedIndexes.length} {selectedIndexes.length === 1 ? 'index' : 'indexes'}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
            <Bot className="mx-auto h-12 w-12 mb-4" />
            <p>Start a conversation with your model</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'bg-emerald-100 dark:bg-emerald-900/30'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-slate-100 dark:bg-slate-700'
                    : 'bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500'
                }`}>
                  <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                    {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  {message.role === 'assistant' && message.processingTime && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{message.processingTime.toFixed(1)}s</span>
                      <span>•</span>
                      <span>{message.tokenCount} tokens</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {generateMutation.isPending && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Generating response...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>
      
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            disabled={generateMutation.isPending}
          />
          <Button 
            type="submit"
            disabled={generateMutation.isPending || !selectedModel}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
