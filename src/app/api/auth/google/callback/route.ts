
import { NextRequest } from 'next/server';
import { getOAuth2Client } from '@/firebase/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

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
const createPopupCloserScript = (data: { type: string; origin: string;[key: string]: any }) => `
  <script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify(data)}, "${data.origin}");
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

  // The opener origin should be the app's main auth domain, not the dynamic one.
  const openerOrigin = `https://${firebaseConfig.authDomain}`;

  if (error) {
    return new Response(
      createPopupCloserScript({ type: 'google-auth-error', message: `O acesso foi negado: ${error}`, origin: openerOrigin }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code || !state) {
    return new Response(
      createPopupCloserScript({ type: 'google-auth-error', message: 'Parâmetros de callback inválidos. Código ou estado ausente.', origin: openerOrigin }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    // The getOAuth2Client now creates a stable redirect URI internally.
    const oauth2Client = getOAuth2Client();
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
      createPopupCloserScript({ type: 'google-auth-success', origin: openerOrigin }),
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (e: any) {
    console.error("An error occurred during Google OAuth callback:", e);
    // Provide a more helpful error message
    const errorMessage = e.response?.data?.error_description || e.message || 'Falha ao obter tokens.';
    const userFriendlyMessage = `Erro: ${errorMessage}. Se o erro for 'invalid_grant', verifique se a Tela de Permissão OAuth está publicada no Google Cloud Console e se o redirect_uri está correto.`;
    
    return new Response(
      createPopupCloserScript({ type: 'google-auth-error', message: userFriendlyMessage, origin: openerOrigin }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
