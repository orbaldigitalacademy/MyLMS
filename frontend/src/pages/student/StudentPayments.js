import React, { useState, useEffect } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { paymentsAPI } from '../../services/api';
import { CreditCard, ExternalLink, Clock, Menu, X } from 'lucide-react';

const StudentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          data-testid="mobile-menu-open-btn"
          className="p-2 rounded-md hover:bg-muted"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-serif font-bold text-lg text-secondary">Payments</span>
        <div className="w-10" />
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
          data-testid="mobile-sidebar-backdrop"
        />
        <div className="absolute left-0 top-0 h-full w-64 bg-background shadow-xl">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            data-testid="mobile-menu-close-btn"
            className="absolute top-3 right-3 p-2 rounded-md hover:bg-white/10 text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <StudentSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      <main
        className="lg:ml-64 p-4 sm:p-6 lg:p-8"
        data-testid="student-payments"
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-secondary">
            Payment History
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Track your payment submissions and approvals
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="w-5 h-5 text-primary shrink-0" />
              All Payments
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-muted/50 animate-pulse"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="h-5 bg-muted rounded w-2/3 sm:w-1/3" />
                      <div className="h-6 bg-muted rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {payments.map(payment => (
                  <div
                    key={payment.id}
                    className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    data-testid={`payment-row-${payment.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left side */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 sm:block">
                          <h4 className="font-medium text-secondary text-sm sm:text-base break-words">
                            {payment.course_title}
                          </h4>
                          {/* Status badge inline on mobile only */}
                          <div className="sm:hidden shrink-0">
                            {getStatusBadge(payment.status)}
                          </div>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-primary price-tag mt-1">
                          {formatPrice(payment.course_price)}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span className="truncate">{formatDate(payment.created_at)}</span>
                          </span>
                          {payment.proof_url && (
                            <a
                              href={payment.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`view-proof-${payment.id}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0" />
                              View Proof
                            </a>
                          )}
                        </div>

                        {payment.admin_note && (
                          <p className="mt-2 text-xs sm:text-sm text-muted-foreground italic break-words">
                            Note: {payment.admin_note}
                          </p>
                        )}
                      </div>

                      {/* Right side (desktop badge) */}
                      <div className="hidden sm:block text-right shrink-0">
                        {getStatusBadge(payment.status)}
                        {payment.status === 'pending' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Under review
                          </p>
                        )}
                      </div>

                      {/* Under review note - mobile */}
                      {payment.status === 'pending' && (
                        <p className="sm:hidden text-xs text-muted-foreground">
                          Under review
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 sm:py-12 px-4">
                <CreditCard className="w-14 h-14 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-secondary mb-2">
                  No Payments Yet
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
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
