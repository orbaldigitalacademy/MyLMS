import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { contactAPI } from '../../services/api';
import { toast } from 'sonner';
import { MessageSquare, Mail, CheckCircle } from 'lucide-react';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await contactAPI.getAll();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkRead = async (id) => {
    try {
      await contactAPI.markRead(id);
      toast.success('Marked as read');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="ml-64 p-8" data-testid="admin-messages">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-secondary">Contact Messages</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread message(s)` : 'All messages read'}
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : messages.length > 0 ? (
              <div className="divide-y divide-border">
                {messages.map(message => (
                  <div key={message.id} className={`p-4 hover:bg-muted/30 transition-colors ${!message.is_read ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-secondary">{message.name}</h3>
                          {!message.is_read && (
                            <Badge className="badge-pending text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {message.email}
                        </p>
                        <p className="font-medium mt-2">{message.subject}</p>
                        <p className="text-muted-foreground text-sm mt-1">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(message.created_at)}</p>
                      </div>
                      {!message.is_read && (
                        <button
                          onClick={() => handleMarkRead(message.id)}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-secondary mb-2">No Messages</h3>
                <p className="text-muted-foreground">Contact form submissions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminMessages;
