'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Code, FileJson, CircleAlert as AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = `curl -X POST https://dnine.ai/api/v1/remove-background \\
  -H "x-api-key: dnine_your_api_key_here" \\
  -F "image=@/path/to/your/image.png" \\
  -o result.png`;

  const fetchExample = `const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('https://dnine.ai/api/v1/remove-background', {
  method: 'POST',
  headers: {
    'x-api-key': 'dnine_your_api_key_here',
  },
  body: formData,
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error.message);
}

const blob = await response.blob();
const url = URL.createObjectURL(blob);`;

  const axiosExample = `import axios from 'axios';

const formData = new FormData();
formData.append('image', imageFile);

const response = await axios.post(
  'https://dnine.ai/api/v1/remove-background',
  formData,
  {
    headers: {
      'x-api-key': 'dnine_your_api_key_here',
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'arraybuffer',
  }
);

// Save or use the PNG buffer
const pngBuffer = Buffer.from(response.data);`;

  const pythonExample = `import requests

url = 'https://dnine.ai/api/v1/remove-background'
headers = {'x-api-key': 'dnine_your_api_key_here'}

with open('image.png', 'rb') as f:
    files = {'image': f}
    response = requests.post(url, headers=headers, files=files)

if response.status_code == 200:
    with open('result.png', 'wb') as f:
        f.write(response.content)
else:
    print('Error:', response.json())`;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">API Documentation</Badge>
          <h1 className="text-4xl font-bold mb-4">Dnine.ai API</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Programmatically remove backgrounds from images with our simple REST API.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Link href="/api-keys">
            <Button size="lg">
              Get Your API Key
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Quick Start */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with background removal in under a minute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">1</div>
              <div>
                <p className="font-medium">Get an API Key</p>
                <p className="text-sm text-muted-foreground">Generate an API key from your <Link href="/api-keys" className="text-primary hover:underline">API Keys dashboard</Link>.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">2</div>
              <div>
                <p className="font-medium">Send a POST Request</p>
                <p className="text-sm text-muted-foreground">Include your API key in the header and your image file in form-data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">3</div>
              <div>
                <p className="font-medium">Receive PNG Response</p>
                <p className="text-sm text-muted-foreground">The API returns a transparent PNG image with removed background.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint Details */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">POST</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded">/api/v1/remove-background</code>
            </div>
            <CardDescription>Remove background from an image and receive a transparent PNG.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Headers */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2"><Code className="h-4 w-4" />Headers</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-muted rounded-md p-3">
                  <Badge variant="outline" className="shrink-0">Required</Badge>
                  <code className="text-sm">x-api-key</code>
                  <span className="text-sm text-muted-foreground">Your API key (e.g., dnine_abc123...)</span>
                </div>
                <div className="flex items-center gap-3 bg-muted rounded-md p-3">
                  <Badge variant="outline" className="shrink-0">Required</Badge>
                  <code className="text-sm">Content-Type</code>
                  <span className="text-sm text-muted-foreground">multipart/form-data (auto-set by browsers)</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2"><FileJson className="h-4 w-4" />Request Body</h4>
              <div className="bg-muted rounded-md p-4">
                <p className="text-sm text-muted-foreground mb-2">Send the image as form-data with field name &quot;image&quot;:</p>
                <pre className="text-xs font-mono">{`------form-boundary
Content-Disposition: form-data; name="image"; filename="photo.png"
Content-Type: image/png

[binary image data]
------form-boundary--`}</pre>
              </div>
            </div>

            {/* Supported Formats */}
            <div>
              <h4 className="font-semibold mb-3">Supported Formats</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">PNG</Badge>
                <Badge variant="secondary">JPG</Badge>
                <Badge variant="secondary">JPEG</Badge>
                <Badge variant="secondary">WEBP</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Maximum file size: 10MB</p>
            </div>

            {/* Response */}
            <div>
              <h4 className="font-semibold mb-3">Response</h4>
              <div className="bg-muted rounded-md p-4">
                <p className="text-sm mb-2"><strong>Success (200):</strong></p>
                <p className="text-sm text-muted-foreground">Returns PNG image binary with transparent background.</p>
                <p className="text-xs text-muted-foreground mt-1">Content-Type: image/png</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
            <CardDescription>Copy and paste these examples into your project.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="axios">Axios</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>

              <TabsContent value="curl" className="space-y-3">
                <div className="relative">
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copyCode('curl', curlExample)}>
                    {copied === 'curl' ? <Check className="h-4 w-4 text-green-500" /> : 'Copy'}
                  </Button>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono">{curlExample}</pre>
                </div>
              </TabsContent>

              <TabsContent value="javascript" className="space-y-3">
                <div className="relative">
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copyCode('js', fetchExample)}>
                    {copied === 'js' ? <Check className="h-4 w-4 text-green-500" /> : 'Copy'}
                  </Button>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono">{fetchExample}</pre>
                </div>
              </TabsContent>

              <TabsContent value="axios" className="space-y-3">
                <div className="relative">
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copyCode('axios', axiosExample)}>
                    {copied === 'axios' ? <Check className="h-4 w-4 text-green-500" /> : 'Copy'}
                  </Button>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono">{axiosExample}</pre>
                </div>
              </TabsContent>

              <TabsContent value="python" className="space-y-3">
                <div className="relative">
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copyCode('python', pythonExample)}>
                    {copied === 'python' ? <Check className="h-4 w-4 text-green-500" /> : 'Copy'}
                  </Button>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono">{pythonExample}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Error Responses</CardTitle>
            <CardDescription>The API returns standardized JSON errors with the following format:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-md p-4">
              <p className="text-sm font-medium mb-2">Error Response Format</p>
              <pre className="text-sm font-mono text-muted-foreground">{`{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error description"
  }
}`}</pre>
            </div>

            <div className="space-y-3 mt-6">
              <p className="font-medium">Error Codes</p>

              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="destructive">401</Badge>
                  <code className="font-mono">INVALID_API_KEY</code>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Invalid or missing API key in the x-api-key header.</p>
              </div>

              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="destructive">400</Badge>
                  <code className="font-mono">MISSING_FILE</code>
                </div>
                <p className="text-sm text-muted-foreground mb-2">No image file provided in the request.</p>
              </div>

              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="destructive">415</Badge>
                  <code className="font-mono">INVALID_FILE_TYPE</code>
                </div>
                <p className="text-sm text-muted-foreground mb-2">File type not supported. Accepted: PNG, JPG, JPEG, WEBP.</p>
              </div>

              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="destructive">413</Badge>
                  <code className="font-mono">FILE_TOO_LARGE</code>
                </div>
                <p className="text-sm text-muted-foreground mb-2">File exceeds the 10MB size limit.</p>
              </div>

              <div className="bg-muted rounded-md p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="destructive">500</Badge>
                  <code className="font-mono">INTERNAL_ERROR</code>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Server-side error. Try again later.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">API rate limits depend on your plan:</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                <span className="font-medium">Free</span>
                <span className="text-muted-foreground">5 requests total</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                <span className="font-medium">Pro</span>
                <span className="text-muted-foreground">100 requests/month</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                <span className="font-medium">Enterprise</span>
                <span className="text-muted-foreground">1,000 requests/month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/pricing">
            <Button variant="outline">View Pricing</Button>
          </Link>
          <Link href="/api-keys">
            <Button>Get API Key <ArrowRight className="h-4 w-4 ml-2" /></Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
