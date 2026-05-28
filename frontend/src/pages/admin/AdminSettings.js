import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { settingsAPI } from '../../services/api';
import { toast } from 'sonner';
import { Building2, Save, Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    admin_email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getBankDetails();
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.updateBankDetails(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="ml-64 p-8" data-testid="admin-settings">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-secondary">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your LMS configuration</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Bank Account Details
              </CardTitle>
              <CardDescription>
                These details will be displayed to students when they make a payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-10 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      name="bank_name"
                      value={settings.bank_name}
                      onChange={handleChange}
                      placeholder="e.g., Access Bank"
                      data-testid="bank-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      name="account_number"
                      value={settings.account_number}
                      onChange={handleChange}
                      placeholder="e.g., 1234567890"
                      data-testid="account-number-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      name="account_name"
                      value={settings.account_name}
                      onChange={handleChange}
                      placeholder="e.g., Naija LMS Academy"
                      data-testid="account-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email (for notifications)</Label>
                    <Input
                      id="admin_email"
                      name="admin_email"
                      type="email"
                      value={settings.admin_email}
                      onChange={handleChange}
                      placeholder="e.g., admin@academy.com"
                      data-testid="admin-email-input"
                    />
                  </div>

                  <Button type="submit" disabled={saving} className="rounded-full" data-testid="save-settings-btn">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Preview</CardTitle>
              <CardDescription>This is how students will see your bank details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-secondary to-secondary/90 rounded-xl p-6 text-white max-w-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-medium opacity-70">BANK TRANSFER</span>
                  <Building2 className="w-6 h-6 opacity-70" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs opacity-70 mb-1">Bank Name</p>
                    <p className="font-bold text-lg">{settings.bank_name || 'Not configured'}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 mb-1">Account Number</p>
                    <p className="font-mono font-bold text-2xl tracking-wider">
                      {settings.account_number || '---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70 mb-1">Account Name</p>
                    <p className="font-bold">{settings.account_name || 'Not configured'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
