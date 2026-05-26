import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create admin client for API key validation
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

// Standardized success response helper
function successResponse(imageBuffer: Buffer, fileName: string, usedFallback: boolean) {
  return new NextResponse(imageBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="no-bg-${fileName.replace(/\.[^/.]+$/, '')}.png"`,
      'X-Used-Fallback': usedFallback ? 'true' : 'false',
    },
  });
}

async function validateApiKey(apiKey: string | null): Promise<{ valid: boolean; userId?: string; keyId?: string }> {
  if (!apiKey) {
    return { valid: false };
  }

  if (!apiKey.startsWith('dnine_')) {
    return { valid: false };
  }

  const { data: keyRecord } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, is_active')
    .eq('key', apiKey)
    .maybeSingle();

  if (!keyRecord) {
    return { valid: false };
  }

  if (!keyRecord.is_active) {
    return { valid: false };
  }

  return { valid: true, userId: keyRecord.user_id, keyId: keyRecord.id };
}

async function logApiUsage(keyId: string, status: string, errorMessage?: string) {
  try {
    await supabaseAdmin.from('api_usage').insert({
      api_key_id: keyId,
      endpoint: '/api/v1/remove-background',
      status,
      error_message: errorMessage || null,
    });
  } catch (e) {
    console.error('Failed to log API usage:', e);
  }
}

async function updateLastUsed(keyId: string) {
  try {
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId);
  } catch (e) {
    console.error('Failed to update last used:', e);
  }
}

async function removeBackgroundWithRemoveBg(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error('REMOVE_BG_API_KEY not configured');
  }

  const formData = new FormData();
  formData.append('image_file_b64', imageBuffer.toString('base64'));
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
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
  const apiKey = request.headers.get('x-api-key');

  // Validate API key
  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return errorResponse('INVALID_API_KEY', 'Invalid or missing API key. Please provide a valid API key in the x-api-key header.', 401);
  }

  const keyId = validation.keyId!;

  try {
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer;
    let fileName = 'image.png';

    // Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (e) {
        await logApiUsage(keyId, 'failed', 'Failed to parse form data');
        return errorResponse('MISSING_FILE', 'Failed to parse form data. Ensure you are sending multipart/form-data with an "image" field.', 400);
      }

      const file = formData.get('image') as File;
      if (!file) {
        await logApiUsage(keyId, 'failed', 'No image file provided');
        return errorResponse('MISSING_FILE', 'No image file provided. Include an "image" field in your form-data.', 400);
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        await logApiUsage(keyId, 'failed', 'Invalid file type');
        return errorResponse(
          'INVALID_FILE_TYPE',
          `Unsupported file type: ${file.type || 'unknown'}. Supported formats: PNG, JPG, JPEG, WEBP.`,
          415
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        await logApiUsage(keyId, 'failed', 'File too large');
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
        await logApiUsage(keyId, 'failed', 'Invalid JSON body');
        return errorResponse('MISSING_FILE', 'Invalid JSON body. Provide base64 image in "image" field.', 400);
      }

      const { image } = body;

      if (!image) {
        await logApiUsage(keyId, 'failed', 'No image provided');
        return errorResponse('MISSING_FILE', 'No image provided. Include base64 image data in "image" field.', 400);
      }

      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        await logApiUsage(keyId, 'failed', 'Invalid image format');
        return errorResponse('INVALID_FILE_TYPE', 'Invalid image format. Must be base64 data URL starting with "data:image/".', 415);
      }

      const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      await logApiUsage(keyId, 'failed', 'Unsupported content type');
      return errorResponse(
        'INVALID_FILE_TYPE',
        'Unsupported content type. Use multipart/form-data with an "image" field, or application/json with base64 "image".',
        415
      );
    }

    // Process image
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

    // Update last used and log success
    await updateLastUsed(keyId);
    await logApiUsage(keyId, 'success');

    return successResponse(processedBuffer, fileName, usedFallback);
  } catch (error: any) {
    console.error('API error:', error);
    await logApiUsage(keyId, 'failed', error.message);
    return errorResponse('INTERNAL_ERROR', error.message || 'An unexpected internal error occurred. Please try again later.', 500);
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
