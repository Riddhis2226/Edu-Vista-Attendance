import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import eduvistaLogo from '@/assets/eduvista-logo.png';

// The @supabase/supabase-js OAuth namespace is currently beta and not typed on
// the client we import. Narrow it locally to the three methods we use.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauthApi(): OAuthApi {
  const auth = supabase.auth as unknown as { oauth?: OAuthApi };
  if (!auth.oauth) {
    throw new Error('OAuth server is not enabled on this project.');
  }
  return auth.oauth;
}

const OAuthConsent: React.FC = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const { user, loading: authLoading } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authorizationId) {
      setError('Missing authorization_id in URL.');
      return;
    }
    if (!user) {
      const next = window.location.pathname + window.location.search;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    let active = true;
    (async () => {
      try {
        const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message || 'Could not load authorization details.');
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.replace(immediate);
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Failed to load authorization.');
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, user, authLoading]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const api = oauthApi();
      const { data, error } = approve
        ? await api.approveAuthorization(authorizationId)
        : await api.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message || 'The authorization server rejected this request.');
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError('No redirect returned by the authorization server.');
        setBusy(false);
        return;
      }
      window.location.replace(target);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader className="text-center">
          <img src={eduvistaLogo} alt="EduVista" className="h-10 w-auto mx-auto mb-2" />
          <CardTitle className="text-lg">
            {details?.client?.name
              ? `Connect ${details.client.name} to EduVista`
              : 'Authorize access to EduVista'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : !details ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading authorization…
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This lets <span className="text-foreground font-medium">{details.client?.name ?? 'the client'}</span>{' '}
                use the EduVista MCP tools while you are signed in as{' '}
                <span className="text-foreground font-medium">{user?.email}</span>.
              </p>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Scoped by row-level security
                </div>
                <p>
                  The client can only see the students, sessions, and attendance records your account is already
                  allowed to see. Approving does not grant admin privileges.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                  Deny
                </Button>
                <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default OAuthConsent;
