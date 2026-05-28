import React, { useState, useEffect, useCallback, } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { paymentsAPI } from '../../services/api';
import { toast } from 'sonner';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Eye
} from 'lucide-react';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = useCallback(async () => {
  setLoading(true);

  try {
    const response = await paymentsAPI.getAll(
      filter === 'all' ? null : filter
    );

    setPayments(response.data);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    toast.error('Failed to load payments');
  } finally {
    setLoading(false);
  }
}, [filter]);
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  useEffect(() => {
  fetchPayments();
}, [fetchPayments]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setAdminNote(payment.admin_note || '');
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setProcessing(true);
    try {
      await paymentsAPI.approve(selectedPayment.id, adminNote || undefined);
      toast.success('Payment approved! Student now has access to the course.');
      setDialogOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    setProcessing(true);
    try {
      await paymentsAPI.reject(selectedPayment.id, adminNote || undefined);
      toast.success('Payment rejected');
      setDialogOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="ml-64 p-8" data-testid="admin-payments">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-secondary">Payment Approvals</h1>
            <p className="text-muted-foreground mt-1">
              {pendingCount > 0 ? `${pendingCount} payment(s) pending approval` : 'Verify and approve student payments'}
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40" data-testid="payment-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 p-4 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="divide-y divide-border">
                {payments.map(payment => (
                  <div key={payment.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-secondary">{payment.user_name}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.user_email}</p>
                      <p className="text-sm text-muted-foreground">{payment.course_title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary price-tag">{formatPrice(payment.course_price)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewPayment(payment)}
                      data-testid={`view-payment-${payment.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-secondary mb-2">No Payments</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No payment submissions yet' : `No ${filter} payments`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">Payment Details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium">{selectedPayment.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayment.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-xl text-primary price-tag">
                      {formatPrice(selectedPayment.course_price)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-medium">{selectedPayment.course_title}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
                  {selectedPayment.proof_url ? (
                    <div className="space-y-2">
                      {selectedPayment.proof_type === 'image' ? (
                        <img 
                          src={selectedPayment.proof_url} 
                          alt="Payment proof" 
                          className="w-full rounded-lg border"
                        />
                      ) : (
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-2">PDF Document</p>
                        </div>
                      )}
                      <a 
                        href={selectedPayment.proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Full Image
                      </a>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No proof uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p>{formatDate(selectedPayment.created_at)}</p>
                </div>

                {selectedPayment.status === 'pending' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Admin Note (optional)</p>
                      <Textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add a note for the student..."
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleApprove} 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={processing}
                        data-testid="approve-payment-btn"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Approve
                      </Button>
                      <Button 
                        onClick={handleReject} 
                        variant="destructive"
                        className="flex-1"
                        disabled={processing}
                        data-testid="reject-payment-btn"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPayments;
