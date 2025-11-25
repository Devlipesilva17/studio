
import { getOAuth2Client } from '@/firebase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');

  if (!state) {
    return new NextResponse('State parameter is missing.', { status: 400 });
  }

  // The getOAuth2Client now creates a stable redirect URI internally
  const oauth2Client = getOAuth2Client();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necessary to get a refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    // The state is passed to the auth url and will be returned in the callback
    state: state,
    prompt: 'consent', // Ensures the user is prompted for consent and a refresh token is issued
  });

  return NextResponse.redirect(url);
}
