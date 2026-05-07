import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, KeyRound, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import TypewriterText from '@/components/TypewriterText';

interface StatusResp {
  configured?: boolean;
  ok?: boolean;
  message?: string;
  latency_ms?: number;
  person_count?: number | null;
}

const Settings = () => {
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [testing, setTesting] = useState(false);
  const [lastTested, setLastTested] = useState<Date | null>(null);
  const [token, setToken] = useState('');
  const [confirm, setConfirm] = useState('');
  const [validating, setValidating] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('luxand-status', { body: {} });
      if (error) throw error;
      setStatus(data);
      setLastTested(new Date());
    } catch (e: any) {
      setStatus({ ok: false, message: e?.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => { runTest(); }, []);

  const validateNewToken = async () => {
    if (!token || token !== confirm) {
      toast.error('Tokens do not match');
      return;
    }
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('luxand-validate-token', {
        body: { token },
      });
      if (error) throw error;
      if (data?.valid) {
        toast.success('Token is valid. Now save it as the LUXAND_API_TOKEN secret in Cloud → Secrets to activate it.');
      } else {
        toast.error(data?.message || 'Invalid token');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const StatusBadge = () => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (!status.configured) return <Badge className="bg-warning/15 text-warning border-warning/30">Not configured</Badge>;
    if (status.ok) return <Badge className="bg-success/15 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>;
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold"><TypewriterText text="Settings" /></h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Luxand Cloud connectivity</span>
              <StatusBadge />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {status?.message || 'Click "Test" to verify the connection.'}
              {status?.latency_ms != null && <span className="ml-2 opacity-70">({status.latency_ms} ms)</span>}
            </div>
            {lastTested && (
              <div className="text-xs text-muted-foreground">Last tested: {lastTested.toLocaleString()}</div>
            )}
            <Button onClick={runTest} disabled={testing} variant="outline">
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Test connection
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Rotate API token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The Luxand API token is stored securely as a server secret and never displayed.
              Paste a new token below — we'll validate it against Luxand first. Once valid,
              save it as <code className="px-1 rounded bg-muted/50">LUXAND_API_TOKEN</code> in
              Cloud → Secrets to activate it.
            </p>
            <div>
              <Label>New token</Label>
              <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} className="bg-muted/30 font-mono" placeholder="luxand-..." />
            </div>
            <div>
              <Label>Confirm token</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-muted/30 font-mono" />
            </div>
            <Button onClick={validateNewToken} disabled={validating || !token} className="btn-shimmer">
              {validating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Validate token
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;
