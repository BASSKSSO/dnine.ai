'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, Key, Copy, Check, Trash2, Plus, Eye, EyeOff, ExternalLink, RefreshCw as RefreshCwIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyRecord {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'dnine_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export default function ApiKeysPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Default API Key');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchApiKeys();
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    setApiKeys(data || []);
    setLoading(false);
  };

  const createApiKey = async () => {
    if (!user) return;
    setCreating(true);

    const newKey = generateApiKey();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key: newKey,
        name: newKeyName,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' });
    } else if (data) {
      setApiKeys([data, ...apiKeys]);
      toast({ title: 'API Key Created', description: 'Your new API key has been generated.' });
    }
    setCreating(false);
  };

  const deleteApiKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    toast({ title: 'API Key Deleted' });
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const maskKey = (key: string) => {
    return key.substring(0, 10) + '••••••••••••••••••••••••••••••';
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="glass-card border-0 max-w-md w-full p-8 text-center">
          <CardContent className="p-0 space-y-4">
            <Key className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Sign In Required</h2>
            <p className="text-muted-foreground">Please sign in to manage your API keys.</p>
            <Link href="/auth/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for programmatic access to Dnine.ai.</p>
        </div>

        {/* Quick Links */}
        <div className="mb-6 flex gap-4">
          <Link href="/docs"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-2" />API Docs</Button></Link>
          <Button variant="ghost" size="sm" onClick={fetchApiKeys}><RefreshCwIcon className="h-4 w-4 mr-2" />Refresh</Button>
        </div>

        {/* Create New Key */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New API Key
            </CardTitle>
            <CardDescription>Generate a new API key for your applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Key name (optional)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createApiKey} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                Generate Key
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">API keys start with "dnine_" and provide access to the background removal API.</p>
          </CardContent>
        </Card>

        {/* Existing Keys */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your API Keys ({apiKeys.length})</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <Card className="glass-card border-0 p-8 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No API keys yet. Create one above to get started.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id} className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{key.name}</span>
                          <Badge variant={key.is_active ? 'default' : 'secondary'} className={key.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-sm bg-muted px-3 py-2 rounded-md">
                          <span className="text-muted-foreground truncate">
                            {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 shrink-0"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys.has(key.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(key.key, key.id)}
                          >
                            {copiedId === key.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                          {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Example Usage */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Example Usage</h2>
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">Use your API key with curl:</p>
              <pre className="bg-muted rounded-md p-4 overflow-x-auto text-xs font-mono">
{`curl -X POST https://your-domain.com/api/v1/remove-background \\
  -H "x-api-key: dnine_your_api_key_here" \\
  -F "image=@/path/to/your/image.png" \\
  -o result.png`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
