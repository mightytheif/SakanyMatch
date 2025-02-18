import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Message, Conversation, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<(Conversation & { otherUser: User }) | null>(null);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery<(Conversation & { otherUser: User })[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedConversation?.id}`],
    enabled: !!selectedConversation,
  });

  // Mark messages as read when conversation is selected
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation) return;
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: selectedConversation.otherUser.id }),
      });
    },
  });

  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate();
    }
  }, [selectedConversation, messages]);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedConversation?.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !selectedConversation || !message.trim()) return;

    socket.send(JSON.stringify({
      type: "message",
      receiverId: selectedConversation.otherUser.id,
      content: message,
    }));

    setMessage("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {conversations?.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-accent rounded-lg mb-2 ${
                    selectedConversation?.id === conversation.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        {conversation.otherUser.name[0]}
                      </div>
                    </Avatar>
                    <div>
                      <div className="font-medium">{conversation.otherUser.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(conversation.lastMessageAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? selectedConversation.otherUser.name : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] mb-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent"
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="text-xs mt-1 opacity-70">
                        {format(new Date(message.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={!selectedConversation}
              />
              <Button onClick={sendMessage} disabled={!selectedConversation}>
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
