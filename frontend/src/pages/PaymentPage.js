import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { coursesAPI, settingsAPI, paymentsAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  CreditCard, 
  Building2, 
  Hash, 
  User,
  FileImage,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofType, setProofType] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Please login to proceed with payment');
      navigate('/login', { state: { from: `/payment/${courseId}` } });
      return;
    }

    const fetchData = async () => {
      try {
        const [courseRes, bankRes] = await Promise.all([
          coursesAPI.getOne(courseId),
          settingsAPI.getBankDetails()
        ]);
        setCourse(courseRes.data);
        setBankDetails(bankRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Course not found');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, isAuthenticated, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, GIF) or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setProofFile(file);
    setProofType(file.type.startsWith('image') ? 'image' : 'pdf');
    
    // Upload the file
    setUploading(true);
    try {
      const response = await uploadAPI.document(file);
      setProofUrl(response.data.url);
      toast.success('Proof uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file. Please try again.');
      setProofFile(null);
      setProofUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!proofUrl) {
      toast.error('Please upload your payment proof');
      return;
    }

    setSubmitting(true);
    try {
      await paymentsAPI.submit({
        course_id: courseId,
        proof_url: proofUrl,
        proof_type: proofType
      });
      toast.success('Payment submitted successfully! We will verify and notify you.');
      navigate('/dashboard/payments');
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={`/courses/${courseId}`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Bank Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Transfer the exact amount to the bank account below, then upload your payment proof.
                  </p>

                  {/* Bank Details Card */}
                  <div className="bg-gradient-to-br from-secondary to-secondary/90 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-medium opacity-70">BANK TRANSFER</span>
                      <Building2 className="w-6 h-6 opacity-70" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs opacity-70 mb-1">Bank Name</p>
                        <p className="font-bold text-lg">{bankDetails?.bank_name || 'Not configured'}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-70 mb-1">Account Number</p>
                        <p className="font-mono font-bold text-2xl tracking-wider">
                          {bankDetails?.account_number || '---'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs opacity-70 mb-1">Account Name</p>
                        <p className="font-bold">{bankDetails?.account_name || 'Not configured'}</p>
                      </div>
                    </div>
                  </div>

                  {(!bankDetails?.bank_name || !bankDetails?.account_number) && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Bank details not configured. Please contact the admin.
                      </p>
                    </div>
                  )}

                  {/* Amount to Pay */}
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                    <p className="text-3xl font-bold text-primary price-tag">
                      {formatPrice(course.price)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upload Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Payment Proof
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    After making the transfer, upload a screenshot or receipt as proof of payment.
                  </p>

                  {/* Drop Zone */}
                  <div
                    className={`drop-zone cursor-pointer ${dragActive ? 'drag-over' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('proof-input').click()}
                    data-testid="payment-dropzone"
                  >
                    {uploading ? (
                      <div className="py-8">
                        <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin mb-4" />
                        <p className="text-muted-foreground">Uploading...</p>
                      </div>
                    ) : proofFile ? (
                      <div className="py-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                          {proofType === 'image' ? (
                            <FileImage className="w-8 h-8 text-green-600" />
                          ) : (
                            <FileText className="w-8 h-8 text-green-600" />
                          )}
                        </div>
                        <p className="font-medium text-secondary">{proofFile.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium text-secondary mb-1">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports: JPG, PNG, GIF, PDF (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    id="proof-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    data-testid="payment-file-input"
                  />

                  {/* Course Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-secondary mb-2">Course</p>
                    <p className="text-muted-foreground">{course.title}</p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    className="w-full rounded-full py-6"
                    disabled={!proofUrl || submitting}
                    data-testid="submit-payment-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Payment for Verification
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Your payment will be verified within 24-48 hours. You'll receive an email once approved.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentPage;
