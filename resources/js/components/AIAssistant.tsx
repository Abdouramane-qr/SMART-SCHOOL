import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Trash2,
  Minimize2,
  Maximize2,
  Loader2
} from "lucide-react";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiRequest, unwrapData } from "@/services/laravelApi";
import { useAuthContext } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin AI",
  comptable: "Manager AI",
  enseignant: "Teacher AI",
  eleve: "Student AI",
  parent: "Parent AI",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-500",
  comptable: "bg-blue-500",
  enseignant: "bg-green-500",
  eleve: "bg-yellow-500",
  parent: "bg-purple-500",
};

const QUICK_PROMPTS: Record<AppRole, string[]> = {
  admin: [
    "Résumé des statistiques de l'école",
    "Élèves avec paiements en retard",
    "Analyse des performances globales",
  ],
  comptable: [
    "État des paiements du mois",
    "Élèves en retard de paiement",
    "Prévisions de trésorerie",
  ],
  enseignant: [
    "Élèves en difficulté dans mes classes",
    "Analyse des notes récentes",
    "Suggestions de remédiation",
  ],
  eleve: [
    "Explique mes dernières notes",
    "Comment améliorer ma moyenne?",
    "Aide-moi à organiser mes révisions",
  ],
  parent: [
    "Résumé scolaire de mes enfants",
    "Y a-t-il des paiements en attente?",
    "Comment aider mon enfant à progresser?",
  ],
};

export function AIAssistant() {
  const { roles } = useUserRole();
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get primary role for the assistant
  const primaryRole: AppRole = roles[0] || "eleve";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);

    let assistantContent = "";

    try {
      const payload = await apiRequest<any>("/ai-assistant", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userRole: primaryRole,
        }),
      });
      const { data } = unwrapData<{ content: string }>(payload);
      const content = data?.content || "Assistant local indisponible.";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const chunks = content.split(/(\s+)/);
      for (const chunk of chunks) {
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    } catch (error) {
      console.error("AI Assistant error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur de l'assistant");
      
      // Remove empty assistant message on error
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    streamChat(input.trim());
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    streamChat(prompt);
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
            "flex items-center justify-center transition-all hover:scale-110",
            "bg-gradient-to-br from-primary to-accent text-primary-foreground",
            "animate-in fade-in slide-in-from-bottom-4"
          )}
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card
          className={cn(
            "fixed z-50 shadow-2xl border-2 transition-all duration-300",
            "animate-in slide-in-from-bottom-4 fade-in",
            isMinimized
              ? "bottom-6 right-6 w-80 h-14"
              : "bottom-6 right-6 w-96 h-[600px] max-h-[80vh]"
          )}
        >
          {/* Header */}
          <CardHeader className="p-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", ROLE_COLORS[primaryRole])}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {ROLE_LABELS[primaryRole]}
                  </CardTitle>
                  {!isMinimized && (
                    <p className="text-xs text-muted-foreground">Assistant intelligent</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isMinimized && messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={clearChat}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Minimize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Bonjour! Je suis votre assistant {ROLE_LABELS[primaryRole]}.
                        <br />
                        Comment puis-je vous aider?
                      </p>
                    </div>
                    
                    {/* Quick Prompts */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">
                        Suggestions rapides:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {QUICK_PROMPTS[primaryRole]?.map((prompt, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                            onClick={() => handleQuickPrompt(prompt)}
                          >
                            {prompt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content || "..."}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.content === "" && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
}
