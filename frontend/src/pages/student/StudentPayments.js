import React, { useState, useEffect } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { paymentsAPI } from '../../services/api';
import { CreditCard, ExternalLink, Clock } from 'lucide-react';

const StudentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await paymentsAPI.getMy();
        setPayments(response.data);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      
      <main className="ml-64 p-8" data-testid="student-payments">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-secondary">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            Track your payment submissions and approvals
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              All Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-muted rounded w-1/3" />
                      <div className="h-6 bg-muted rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map(payment => (
                  <div key={payment.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-secondary">{payment.course_title}</h4>
                        <p className="text-lg font-bold text-primary price-tag mt-1">
                          {formatPrice(payment.course_price)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(payment.created_at)}
                          </span>
                          {payment.proof_url && (
                            <a 
                              href={payment.proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Proof
                            </a>
                          )}
                        </div>
                        {payment.admin_note && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            Note: {payment.admin_note}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getStatusBadge(payment.status)}
                        {payment.status === 'pending' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Under review
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-secondary mb-2">No Payments Yet</h3>
                <p className="text-muted-foreground">
                  Your payment history will appear here once you enroll in a course.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentPayments;
