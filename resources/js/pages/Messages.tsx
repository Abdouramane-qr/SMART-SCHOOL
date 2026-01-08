import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import {
  Mail,
  Send,
  Inbox,
  SendHorizontal,
  Trash2,
  Reply,
  Search,
  Plus,
  MailOpen,
  Clock,
  User,
} from "lucide-react";
import { laravelMessagesApi } from "@/services/laravelSchoolApi";
import { laravelUsersApi } from "@/services/laravelUsersApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Message {
  id: string | number;
  sender_id: string | number;
  recipient_id: string | number;
  subject: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  parent_message_id: string | number | null;
  created_at: string;
  sender?: { full_name: string; email: string } | null;
  recipient?: { full_name: string; email: string } | null;
}

interface Profile {
  id: number;
  full_name: string;
  email: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [searchTerm, setSearchTerm] = useState("");

  // Compose dialog
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient_id: "",
    subject: "",
    content: "",
  });

  // Reply state
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
      const stop = subscribeToMessages();
      return () => stop?.();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [inbox, sent] = await Promise.all([
        laravelMessagesApi.getInbox(),
        laravelMessagesApi.getSent(),
      ]);
      const profilesData = await laravelUsersApi.getAll();
      const availableProfiles = profilesData
        .filter((profile) => profile.id !== user.id)
        .map((profile) => ({
          id: profile.id,
          full_name: profile.full_name || profile.name || profile.email,
          email: profile.email,
        }));

      setMessages([...inbox, ...sent]);
      setProfiles(availableProfiles);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;
    const interval = window.setInterval(fetchData, 10000);
    return () => window.clearInterval(interval);
  };

  const inboxMessages = messages.filter((m) => String(m.recipient_id) === String(user?.id));
  const sentMessages = messages.filter((m) => String(m.sender_id) === String(user?.id));
  const unreadCount = inboxMessages.filter((m) => !m.is_read).length;

  const filteredMessages =
    activeTab === "inbox"
      ? inboxMessages.filter(
          (m) =>
            m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : sentMessages.filter(
          (m) =>
            m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.recipient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);

    // Mark as read if it's in inbox and unread
    if (String(message.recipient_id) === String(user?.id) && !message.is_read) {
      try {
        await laravelMessagesApi.markRead(message.id, true);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
          )
        );
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error marking as read:", error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !composeData.recipient_id || !composeData.subject || !composeData.content) return;

    try {
      await laravelMessagesApi.create({
        recipient_id: Number(composeData.recipient_id),
        subject: composeData.subject,
        content: composeData.content,
      });

      toast.success("Message envoyé !");
      setIsComposeOpen(false);
      setComposeData({ recipient_id: "", subject: "", content: "" });
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMessage || !replyContent) return;

    try {
      await laravelMessagesApi.create({
        recipient_id: Number(selectedMessage.sender_id),
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
        parent_message_id: selectedMessage.id,
      });

      toast.success("Réponse envoyée !");
      setIsReplyOpen(false);
      setReplyContent("");
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const handleDeleteMessage = async (messageId: string | number) => {
    try {
      await laravelMessagesApi.delete(messageId);

      toast.success("Message supprimé");
      setSelectedMessage(null);
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3 h-[600px]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Messagerie"
        description="Communication interne entre enseignants, parents et administration"
        icon={Mail}
        actions={
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <ActionTooltip tooltipKey="composeMessage">
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau message
                </Button>
              </DialogTrigger>
            </ActionTooltip>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
                <DialogDescription>Composez et envoyez un nouveau message</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                  <Label>Destinataire *</Label>
                  <Select
                    value={composeData.recipient_id}
                    onValueChange={(v) => setComposeData({ ...composeData, recipient_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un destinataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={`${p.id}`}>
                          {p.full_name} ({p.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sujet *</Label>
                  <Input
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    placeholder="Objet du message"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={composeData.content}
                    onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                    placeholder="Écrivez votre message..."
                    rows={6}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !composeData.recipient_id || !composeData.subject || !composeData.content
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-3 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Message List */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inbox" | "sent")}>
              <TabsList className="w-full">
                <TabsTrigger value="inbox" className="flex-1">
                  <Inbox className="h-4 w-4 mr-2" />
                  Reçus
                  {unreadCount > 0 && (
                    <Badge className="ml-2" variant="default">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1">
                  <SendHorizontal className="h-4 w-4 mr-2" />
                  Envoyés
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredMessages.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun message</p>
                  <ActionTooltip tooltipKey="composeMessage">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsComposeOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau message
                    </Button>
                  </ActionTooltip>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMessages.map((message) => {
                    const isInbox = activeTab === "inbox";
                    const person = isInbox ? message.sender : message.recipient;
                    const isSelected = selectedMessage?.id === message.id;

                    return (
                      <div
                        key={message.id}
                        onClick={() => handleSelectMessage(message)}
                        className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          isSelected ? "bg-muted" : ""
                        } ${!message.is_read && isInbox ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {person?.full_name ? getInitials(person.full_name) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm truncate ${
                                  !message.is_read && isInbox ? "font-bold" : "font-medium"
                                }`}
                              >
                                {person?.full_name || "Inconnu"}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            </div>
                            <p
                              className={`text-sm truncate ${
                                !message.is_read && isInbox
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {message.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {message.content}
                            </p>
                          </div>
                          {!message.is_read && isInbox && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedMessage ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedMessage.sender?.full_name
                          ? getInitials(selectedMessage.sender.full_name)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>De: {selectedMessage.sender?.full_name}</span>
                        <span>•</span>
                        <span>À: {selectedMessage.recipient?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(selectedMessage.created_at), "dd MMMM yyyy à HH:mm", {
                          locale: fr,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedMessage.recipient_id === user?.id && (
                      <ActionTooltip tooltipKey="replyMessage">
                        <Button variant="outline" size="sm" onClick={() => setIsReplyOpen(true)}>
                          <Reply className="h-4 w-4 mr-1" />
                          Répondre
                        </Button>
                      </ActionTooltip>
                    )}
                    {selectedMessage.sender_id === user?.id && (
                      <ActionTooltip tooltipKey="deleteMessage">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ActionTooltip>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6">
                <ScrollArea className="h-full">
                  <div className="whitespace-pre-wrap text-foreground">
                    {selectedMessage.content}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MailOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un message pour le lire</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre</DialogTitle>
            <DialogDescription>Re: {selectedMessage?.subject}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReply} className="space-y-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Écrivez votre réponse..."
                rows={6}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReplyOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!replyContent}>
                <Send className="mr-2 h-4 w-4" />
                Envoyer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
