'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Zap, Shield, Layers, Image as ImageIcon, ArrowRight, Sparkles, Clock, CreditCard, X, Download, CircleAlert as AlertCircle, Loader as Loader2, Check, FileImage } from 'lucide-react';
import Link from 'next/link';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

interface ProcessedImage {
  id: string;
  original: string;
  processed: string | null;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

const features = [
  { icon: Zap, title: 'Instant Results', description: 'AI-powered background removal in seconds.' },
  { icon: Shield, title: 'Privacy First', description: 'Images processed securely, never stored without consent.' },
  { icon: Layers, title: 'Bulk Processing', description: 'Upload multiple images at once.' },
  { icon: ImageIcon, title: 'HD Quality', description: 'High-resolution output with clean edges.' },
  { icon: Clock, title: 'Lightning Fast', description: 'Process images in under 5 seconds.' },
  { icon: CreditCard, title: '5 Free Credits', description: 'Start free, no credit card required.' },
];

export default function Home() {
  const { user, credits, refreshCredits } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Unsupported format. Use PNG, JPG, or WEBP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Max 10MB.`;
    }
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const newImages: ProcessedImage[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast({ title: 'Invalid file', description: error, variant: 'destructive' });
        continue;
      }
      const url = URL.createObjectURL(file);
      newImages.push({
        id: crypto.randomUUID(),
        original: url,
        processed: null,
        fileName: file.name,
        status: 'pending',
        progress: 0,
      });
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
  }, [toast]);

  // User-friendly error message helper
  const getErrorMessage = (error: any): string => {
    if (error?.code === 'INVALID_API_KEY') return 'Please sign in to continue.';
    if (error?.code === 'MISSING_FILE') return 'No image provided. Please select an image.';
    if (error?.code === 'INVALID_FILE_TYPE') return 'Unsupported format. Use PNG, JPG, or WEBP.';
    if (error?.code === 'FILE_TOO_LARGE') return 'File too large. Maximum size is 10MB.';
    if (error?.code === 'INTERNAL_ERROR') return 'Server error. Please try again later.';
    return error?.message || 'Processing failed. Please try again.';
  };

  const processImage = async (img: ProcessedImage) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to process images.', variant: 'destructive' });
      return;
    }
    if (credits <= 0) {
      toast({ title: 'No credits remaining', description: 'Upgrade your plan to continue processing images.', variant: 'destructive' });
      return;
    }

    setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, status: 'processing', progress: 10 } : i));

    try {
      const response = await fetch(img.original);
      const blob = await response.blob();
      const reader = new FileReader();

      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const base64 = await base64Promise;
      setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, progress: 30 } : i));

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || '';

      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ image: base64, fileName: img.fileName }),
      });

      setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, progress: 70 } : i));

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          throw new Error('Processing failed');
        }
        throw errorData;
      }

      // Handle PNG response
      const imageBlob = await res.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      setImages((prev) => prev.map((i) => i.id === img.id ? {
        ...i, status: 'completed', processed: imageUrl, progress: 100
      } : i));

      refreshCredits();
      toast({ title: 'Background removed!', description: 'Your image is ready to download.' });
    } catch (err: any) {
      const errorMessage = getErrorMessage(err?.error || err);
      setImages((prev) => prev.map((i) => i.id === img.id ? {
        ...i, status: 'failed', error: errorMessage, progress: 0
      } : i));
      toast({ title: 'Processing Failed', description: errorMessage, variant: 'destructive' });
    }
  };

  const processAll = async () => {
    const pending = images.filter((i) => i.status === 'pending');
    for (const img of pending) {
      if (credits <= 0) break;
      await processImage(img);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  const downloadImage = (img: ProcessedImage) => {
    if (!img.processed) return;
    const a = document.createElement('a');
    a.href = img.processed;
    a.download = `no-bg-${img.fileName}`;
    a.click();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const completedCount = images.filter((i) => i.status === 'completed').length;
  const processingCount = images.filter((i) => i.status === 'processing').length;
  const pendingCount = images.filter((i) => i.status === 'pending').length;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Powered by Advanced AI
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Remove Background
            <br />
            <span className="gradient-text">with AI in 1 Click</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">
            Instantly remove backgrounds from your images with state-of-the-art AI.
            No design skills needed. Free to start.
          </p>
        </div>
      </section>

      {/* Upload Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mx-auto max-w-4xl">
          {user && (
            <div className="mb-4 text-center">
              <Badge variant="secondary">{credits} credits remaining</Badge>
            </div>
          )}

          {!user && (
            <div className="mb-4 flex items-center gap-3 justify-center rounded-lg bg-muted/50 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                <Link href="/auth/register" className="font-medium text-primary hover:underline">Sign up</Link> for 5 free credits.
              </span>
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300
              ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {isDragging ? 'Drop images here' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse. PNG, JPG, WEBP up to 10MB.
                </p>
              </div>
              <Button variant="outline" size="sm" className="pointer-events-none">
                <FileImage className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          {/* Bulk Process */}
          {images.length > 1 && pendingCount > 0 && (
            <div className="mt-4 flex items-center justify-center">
              <Button onClick={processAll} disabled={!user || credits <= 0 || processingCount > 0}>
                <Loader2 className={`h-4 w-4 mr-2 ${processingCount > 0 ? 'animate-spin' : 'hidden'}`} />
                {processingCount > 0 ? 'Processing...' : `Process All (${pendingCount})`}
              </Button>
            </div>
          )}

          {/* Results Grid */}
          {images.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Images ({images.length})</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {completedCount > 0 && <span className="text-green-600">{completedCount} done</span>}
                  {processingCount > 0 && <span className="text-primary">{processingCount} processing</span>}
                  {pendingCount > 0 && <span>{pendingCount} pending</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img) => (
                  <Card key={img.id} className="glass-card border-0 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-square">
                        <img
                          src={img.processed || img.original}
                          alt={img.fileName}
                          className={`w-full h-full object-cover ${img.processed ? 'checkerboard' : ''}`}
                        />
                        {img.status === 'processing' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <span className="text-sm font-medium">Processing...</span>
                            <div className="mt-2 w-3/4 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${img.progress}%` }} />
                            </div>
                          </div>
                        )}
                        {img.status === 'failed' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 backdrop-blur-sm">
                            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                            <span className="text-sm text-destructive font-medium">Failed</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{img.fileName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {img.status === 'pending' && (
                              <Button size="sm" onClick={() => processImage(img)} disabled={!user || credits <= 0}>
                                Process
                              </Button>
                            )}
                            {img.status === 'completed' && (
                              <div className="flex items-center gap-1.5 text-xs text-green-600">
                                <Check className="h-3 w-3" /> Done
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {img.status === 'completed' && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => setSelectedImage(img)}>
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => downloadImage(img)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removeImage(img.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Before/After Modal */}
      {selectedImage && selectedImage.processed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="w-full max-w-4xl bg-background rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{selectedImage.fileName}</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => downloadImage(selectedImage)}>
                  <Download className="h-4 w-4 mr-2" /> Download PNG
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setSelectedImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative">
                <div className="absolute top-3 left-3 z-10 rounded-md bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur-sm">Original</div>
                <img src={selectedImage.original} alt="Original" className="w-full h-auto" />
              </div>
              <div className="relative checkerboard">
                <div className="absolute top-3 left-3 z-10 rounded-md bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur-sm">Removed BG</div>
                <img src={selectedImage.processed} alt="Processed" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Dnine.ai?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built for speed, quality, and simplicity.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="glass-card border-0 p-6 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center glass-card p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Remove Backgrounds?</h2>
          <p className="text-lg text-muted-foreground mb-8">Start with 5 free credits. No signup required for your first image.</p>
          <Link href="/auth/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5" />
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="4 2" className="opacity-60" />
                <path d="M12 2 L12 22" strokeDasharray="2 2" />
                <polygon points="12,6 16,12 12,18 8,12" fill="currentColor" stroke="none" />
              </svg>
            </div>
            Dnine.ai
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/tool" className="hover:text-foreground">Tool</Link>
          </div>
          <p>Built with AI. Fast, free, and reliable.</p>
        </div>
      </footer>
    </div>
  );
}
