import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CustomPromptChatProps {
  isBusinessPro: boolean;
  onCustomPrompt?: (prompt: string) => void;
  suggestions?: string[];
  context?: string;
}

export default function CustomPromptChat({ 
  isBusinessPro, 
  onCustomPrompt,
  suggestions = [],
  context = 'visualization'
}: CustomPromptChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isBusinessPro) {
    return null;
  }

  const defaultSuggestions = [
    "Add more vibrant colors to make it pop",
    "Make the style more modern and contemporary",
    "Include more natural elements like trees and flowers",
    "Create a luxurious, high-end appearance",
    "Add dramatic lighting effects",
    "Make it more family-friendly and welcoming"
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  const handleSendPrompt = async () => {
    if (!inputPrompt.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputPrompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Call the custom prompt handler
    if (onCustomPrompt) {
      await onCustomPrompt(inputPrompt);
      
      // Add assistant acknowledgment
      const assistantMessage: Message = {
        role: 'assistant',
        content: `I've applied your custom instructions: "${inputPrompt}". The visualization is being updated with your preferences.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }

    setInputPrompt('');
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputPrompt(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0 hover:from-purple-700 hover:to-purple-800"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Customize with AI Chat
          <Badge className="ml-2 bg-yellow-500 text-black">Business Pro</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            AI Customization Chat
          </DialogTitle>
          <DialogDescription>
            Describe exactly how you want your {context} to look. Our AI will apply your custom preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4 border rounded-lg bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Start a conversation to customize your visualization</p>
                <p className="text-xs mt-2">Your instructions will be applied to create unique results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {activeSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Describe your customization preferences..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendPrompt}
              disabled={!inputPrompt.trim() || isProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline chat component for visualization pages
export function InlinePromptChat({ 
  isBusinessPro, 
  customPrompt,
  onPromptChange,
  buttonClassName
}: {
  isBusinessPro: boolean;
  customPrompt: string;
  onPromptChange: (prompt: string) => void;
  buttonClassName?: string;
}) {
  const [showInline, setShowInline] = useState(false);

  if (!isBusinessPro) {
    return null;
  }

  return (
    <div className="space-y-2">
      {!showInline ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInline(true)}
          className={buttonClassName || "w-full"}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Add Custom Instructions
        </Button>
      ) : (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="py-3 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Custom Instructions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowInline(false);
                  onPromptChange('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <Textarea
              placeholder="Describe exactly how you want this to look..."
              value={customPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="resize-none text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-600 mt-1">
              Your custom instructions will be applied to the AI generation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}