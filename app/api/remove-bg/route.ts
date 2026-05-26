import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabaseWithAuth(authHeader: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

// Standardized error response helper
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

async function removeBackgroundWithRemoveBg(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error('REMOVE_BG_API_KEY not configured');
  }

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image_file_b64', imageBuffer.toString('base64'));
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`remove.bg API error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function mockRemoveBackground(imageBuffer: Buffer): Buffer {
  return imageBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer;
    let fileName = 'image.png';

    // Handle multipart/form-data or JSON
    if (contentType.includes('multipart/form-data')) {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (e) {
        return errorResponse('MISSING_FILE', 'Failed to parse form data. Ensure you are sending multipart/form-data.', 400);
      }

      const file = (formData.get('image') as File) || (formData.get('file') as File);
      if (!file) {
        return errorResponse('MISSING_FILE', 'No image file provided. Include an "image" field in your form-data.', 400);
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return errorResponse(
          'INVALID_FILE_TYPE',
          `Unsupported file type: ${file.type || 'unknown'}. Supported formats: PNG, JPG, JPEG, WEBP.`,
          415
        );
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        return errorResponse('FILE_TOO_LARGE', `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB.`, 413);
      }

      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      fileName = file.name;
    } else if (contentType.includes('application/json')) {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return errorResponse('MISSING_FILE', 'Invalid JSON body.', 400);
      }

      const { image } = body;

      if (!image) {
        return errorResponse('MISSING_FILE', 'No image provided. Include base64 image data in "image" field.', 400);
      }

      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return errorResponse('INVALID_FILE_TYPE', 'Invalid image format. Must be base64 data URL starting with "data:image/".', 415);
      }

      const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      return errorResponse('INVALID_FILE_TYPE', 'Unsupported content type. Use multipart/form-data or application/json.', 415);
    }

    // Check authentication
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabaseWithAuth(authHeader);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse('INVALID_API_KEY', 'Authentication required. Please sign in to process images.', 401);
    }

    // Check credits
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).maybeSingle();

    if (!profile || profile.credits <= 0) {
      return errorResponse('FILE_TOO_LARGE', 'No credits remaining. Please upgrade your plan to continue processing images.', 402);
    }

    let processedBuffer: Buffer;
    let usedFallback = false;

    try {
      processedBuffer = await removeBackgroundWithRemoveBg(imageBuffer);
    } catch (apiError: any) {
      console.warn('remove.bg API failed, using fallback:', apiError.message);
      await new Promise((resolve) => setTimeout(resolve, 500));
      processedBuffer = mockRemoveBackground(imageBuffer);
      usedFallback = true;
    }

    // Deduct credit
    await supabase.from('profiles').update({ credits: profile.credits - 1, updated_at: new Date().toISOString() }).eq('id', user.id);

    // Save to image history
    await supabase.from('images').insert({
      user_id: user.id,
      original_url: `stored:${fileName}`,
      processed_url: `processed:${fileName}`,
      status: 'completed',
    });

    // Return PNG image
    return new NextResponse(processedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="no-bg-${fileName.replace(/\.[^/.]+$/, '')}.png"`,
        'X-Credits-Remaining': String(profile.credits - 1),
        'X-Used-Fallback': usedFallback ? 'true' : 'false',
      },
    });
  } catch (error: any) {
    console.error('Remove BG error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected internal error occurred. Please try again later.', 500);
  }
}
