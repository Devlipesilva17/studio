
import { NextRequest } from 'next/server';
import { getOAuth2Client } from '@/firebase/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }
  return initializeApp();
}

/**
 * A utility function to create the HTML script that communicates with the parent window.
 * This script sends a message and then closes the popup.
 */
const createPopupCloserScript = (data: { type: string; [key: string]: any }) => `
  <script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify(data)}, "${new URL(data.origin).origin}");
    }
    window.close();
  </script>
`;

/**
 * This is the callback route that Google redirects to after user consent.
 * It exchanges the authorization code for tokens and saves them.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The user's UID
  const error = searchParams.get('error');

  const origin = req.headers.get('host') || req.nextUrl.origin;


  if (error) {
    return new Response(
      createPopupCloserScript({ type: 'google-auth-error', message: `O acesso foi negado: ${error}`, origin }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code || !state) {
    return new Response(
      createPopupCloserScript({ type: 'google-auth-error', message: 'Parâmetros de callback inválidos. Código ou estado ausente.', origin }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const oauth2Client = getOAuth2Client(req.headers.get('host') || '');
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
        throw new Error('Falha ao obter o token de acesso do Google.');
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    const userRef = db.collection('users').doc(state);
    
    // Securely save the tokens to the user's document in Firestore
    await userRef.set({
      googleAccessToken: tokens.access_token,
      // Only store the refresh token if it's provided
      ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
      googleTokenExpiry: tokens.expiry_date,
    }, { merge: true });

    // Return a success message and close the popup
    return new Response(
      createPopupCloserScript({ type: 'google-auth-success', origin }),
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (e: any) {
    console.error("An error occurred during Google OAuth callback:", e);
    // Provide a more helpful error message
    const errorMessage = e.response?.data?.error_description || e.message || 'Falha ao obter tokens.';
    const userFriendlyMessage = `Erro: ${errorMessage}. Se o erro for 'invalid_grant', verifique se a Tela de Permissão OAuth está publicada no Google Cloud Console.`;
    
    return new Response(
      createPopupCloserScript({ type: 'google-auth-error', message: userFriendlyMessage, origin }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
