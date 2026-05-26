"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage, getChatHistory } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date | null;
}

interface OfferChatProps {
  offerId: string;
  currentUserId: string;
  otherUserId: string;
  initialMessages: Message[];
}

export default function OfferChat({ offerId, currentUserId, otherUserId, initialMessages }: OfferChatProps) {
  const [isSending, setIsSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 1. We now hold the messages in a local state so we can update them in real-time
  const [liveMessages, setLiveMessages] = useState<Message[]>(initialMessages);

  // 2. SMART POLLING: Check the database for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getChatHistory(offerId);
      if (result.success && result.data) {
        // Only update if the number of messages changed
        if (result.data.length !== liveMessages.length) {
          setLiveMessages(result.data);
        }
      }
    }, 3000); // 3000ms = 3 seconds

    return () => clearInterval(interval); // Cleanup when they close the chat
  }, [offerId, liveMessages.length]);

  // 3. Auto-scroll to the bottom when a new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveMessages]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData(e.currentTarget);
    const result = await sendMessage(formData);

    if (result.error) {
      alert(result.error);
    } else {
      formRef.current?.reset();
      // Instantly fetch the new message so it shows up without waiting 3 seconds
      const freshData = await getChatHistory(offerId);
      if (freshData.success && freshData.data) {
        setLiveMessages(freshData.data);
      }
    }
    
    setIsSending(false);
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h4 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">Negotiation Thread</h4>
      
      {/* Chat History Window */}
      <div 
        ref={scrollRef}
        className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
      >
        {liveMessages.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">No messages yet. Start the negotiation!</p>
        ) : (
          liveMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-black rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Box */}
      <form ref={formRef} onSubmit={handleSend} className="flex gap-2">
        <input type="hidden" name="offerId" value={offerId} />
        <input type="hidden" name="receiverId" value={otherUserId} />
        
        <Input 
          name="content"
          placeholder="Type a message..." 
          required 
          disabled={isSending}
          className="bg-black/50 border-white/10 focus-visible:ring-primary"
          autoComplete="off"
        />
        <Button type="submit" disabled={isSending} className="font-bold">
          {isSending ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
}