'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Image as ImageIcon, CreditCard, Calendar, ArrowRight, Trash2, Loader as Loader2 } from 'lucide-react';

interface ImageRecord {
  id: string;
  original_url: string;
  processed_url: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, credits, loading: authLoading } = useAuth();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchImages();
  }, [user]);

  const fetchImages = async () => {
    if (!user) return;
    setLoadingImages(true);
    const { data } = await supabase.from('images').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setImages(data || []);
    setLoadingImages(false);
  };

  const deleteImage = async (id: string) => {
    await supabase.from('images').delete().eq('id', id);
    setImages((prev) => prev.filter((i) => i.id !== id));
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
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Sign In Required</h2>
            <p className="text-muted-foreground">Please sign in to access your dashboard.</p>
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Your image processing history and account overview.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Left</p>
                <p className="text-2xl font-bold">{credits}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Images Processed</p>
                <p className="text-2xl font-bold">{images.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-lg font-semibold">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {credits <= 2 && (
          <div className="mb-8 rounded-xl bg-primary/5 border border-primary/20 p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold">Running low on credits</p>
              <p className="text-sm text-muted-foreground">You have {credits} credit{credits !== 1 ? 's' : ''} remaining.</p>
            </div>
            <Link href="/pricing">
              <Button>Get More Credits <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </Link>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">Processing History</h2>
          {loadingImages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <Card className="glass-card border-0 p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No images processed yet.</p>
              <Link href="/tool"><Button>Start Processing</Button></Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {images.map((img) => (
                <Card key={img.id} className="glass-card border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">Image processed</p>
                        <p className="text-xs text-muted-foreground">{new Date(img.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={img.status === 'completed' ? 'default' : 'secondary'} className={img.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                        {img.status}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => deleteImage(img.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
