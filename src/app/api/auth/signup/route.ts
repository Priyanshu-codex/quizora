import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only administrative Supabase client
function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// In-memory server mutex to prevent duplicate concurrent signups for the same email
const inFlightSignupEmails = new Set<string>();

export async function POST(req: NextRequest) {
  let email = '';
  try {
    const body = await req.json();
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const role = ['user', 'admin', 'viewer'].includes(body.role) ? body.role : 'user';

    // Input validation
    if (!name) {
      return NextResponse.json({ error: 'Full Name is required.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid Email Address is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Server-level duplicate lock: reject if an in-flight signup for this email is already running
    if (inFlightSignupEmails.has(email)) {
      return NextResponse.json(
        { error: 'An account creation request is already in progress for this email. Please sign in.' },
        { status: 409 }
      );
    }
    inFlightSignupEmails.add(email);

    try {
      const adminClient = getAdminClient();
      if (!adminClient) {
        return NextResponse.json(
          { error: 'Server authentication service is not fully configured.' },
          { status: 500 }
        );
      }

      // Create user with email_confirm: true to avoid triggering verification emails and rate limits
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      });

      if (createError) {
        const msg = createError.message.toLowerCase();
        const status = createError.status || 400;

        // Duplicate user detection (including race conditions or database unique violations)
        if (
          msg.includes('already registered') ||
          msg.includes('already in use') ||
          msg.includes('user already exists') ||
          msg.includes('database error') ||
          status === 422
        ) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Please sign in instead.' },
            { status: 409 }
          );
        }

        // Rate limit detection
        if (msg.includes('rate limit') || status === 429) {
          return NextResponse.json(
            { error: 'Registration rate limit reached. Please wait a few moments before trying again.' },
            { status: 429 }
          );
        }

        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      if (!createData?.user) {
        return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 });
      }

      // Ensure public.profiles is populated
      try {
        await adminClient.from('profiles').upsert({
          id: createData.user.id,
          name,
          email,
          role,
        });
      } catch (profileErr) {
        console.warn('Profile synchronization warning:', profileErr);
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: createData.user.id,
            name,
            email,
            role,
            createdAt: createData.user.created_at,
          },
        },
        { status: 201 }
      );
    } finally {
      inFlightSignupEmails.delete(email);
    }
  } catch (err: unknown) {
    if (email) {
      inFlightSignupEmails.delete(email);
    }
    const errorMsg = (err as Error)?.message || 'An unexpected error occurred during signup.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
