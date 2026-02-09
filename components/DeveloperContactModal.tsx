import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  ShieldCheck, 
  Code, 
  Terminal, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { fetchDeveloperMessages, sendDeveloperMessage } from '../services/db';
import { DevMessage } from '../types';
import { toast } from '../services/toast';

interface DeveloperContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string; // Name of the user opening the chat
}

export const DeveloperContactModal: React.FC<DeveloperContactModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<DevMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const devName = "A. Kavindu Madushan";
  const devRoles = ["Software Engineer", "Cyber Security Expert"];
  const whatsappNumber = "+94772411839";

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // Simple poll every 5 seconds to keep chat semi-live
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await fetchDeveloperMessages();
      setMessages(data);
    } catch (e) {
      // Silent error for poll
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage(''); // Optimistic clear
    
    try {
      await sendDeveloperMessage(msg, null, currentUser);
      loadMessages();
    } catch (e) {
      toast.error("Failed to send message");
      setNewMessage(msg); // Restore
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 safety
      toast.error("Image too large. Max 2MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await sendDeveloperMessage("Sent an image attachment", base64String, currentUser);
        loadMessages();
        toast.success("Image sent");
      } catch (err) {
        toast.error("Failed to send image");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Profile Side (Left) */}
        <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 flex flex-col relative overflow-hidden">
           {/* Decor */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

           <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1 mb-6 shadow-xl shadow-blue-900/50">
                 <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold">
                    AK
                 </div>
              </div>
              
              <h2 className="text-2xl font-black mb-1">{devName}</h2>
              <div className="flex flex-col gap-1 mb-6">
                 {devRoles.map(role => (
                    <span key={role} className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-blue-200 border border-white/10">
                       {role}
                    </span>
                 ))}
              </div>

              <div className="space-y-3 w-full">
                 <a 
                   href={`https://wa.me/${whatsappNumber.replace('+', '')}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-3 w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-900/30"
                 >
                    <MessageCircle size={20} /> WhatsApp Me
                 </a>
                 <div className="text-[10px] text-slate-400">
                    Direct Contact: {whatsappNumber}
                 </div>
              </div>
           </div>

           <div className="mt-8 text-center relative z-10">
              <div className="flex justify-center items-center gap-2 text-xs text-slate-500 font-mono mb-2">
                 <Terminal size={12} /> System Architect
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                 Specializing in secure, high-performance web applications and logistics systems.
              </p>
           </div>
        </div>

        {/* Chat Side (Right) */}
        <div className="flex-1 bg-slate-50 flex flex-col relative">
           {/* Header */}
           <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <ShieldCheck size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 text-sm">System Support</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       Developer Connection Active
                    </p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                 <X size={24} />
              </button>
           </div>

           {/* Messages Area */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              <div className="text-center py-6">
                 <div className="inline-block px-4 py-2 rounded-full bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Start of secure encrypted channel
                 </div>
                 <p className="text-xs text-slate-400 mt-2">
                    Report bugs, request features, or discuss security issues directly with the developer.
                 </p>
              </div>

              {messages.map((msg) => {
                 const isMe = msg.sender_name === currentUser;
                 return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                          <div className="flex justify-between items-baseline gap-4 mb-1">
                             <span className={`text-[10px] font-bold uppercase ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                {msg.sender_name}
                             </span>
                             <span className={`text-[10px] ${isMe ? 'text-blue-300' : 'text-slate-300'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                          </div>
                          
                          {msg.image_data && (
                             <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                <img src={msg.image_data} alt="Attachment" className="max-w-full h-auto" />
                             </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                       </div>
                    </div>
                 )
              })}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                 <label className={`p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                 </label>
                 
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                 </div>

                 <button 
                   type="submit"
                   className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                 >
                    <Send size={20} />
                 </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
};