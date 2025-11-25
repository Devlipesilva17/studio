'use server';
/**
 * @fileOverview Flow to synchronize a visit to Google Calendar.
 */

import { ai } from '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import { z } from 'zod';
import { initializeApp, getApps, App as AdminApp } from 'firebase-admin/app';

// Helper to initialize Firebase Admin SDK only once.
function getFirebaseAdminApp(): AdminApp {
  if (getApps().length) {
    return getApps()[0];
  }
  return initializeApp();
}

const calendarSyncSchema = z.object({
  userId: z.string().describe('The ID of the user who owns the event.'),
  visitId: z.string().describe('The ID of the visit to sync.'),
  summary: z.string().describe('The title or summary of the calendar event.'),
  description: z.string().describe('The detailed description of the event.'),
  startTime: z.string().datetime().describe('The start time of the event in ISO 8601 format.'),
  endTime: z.string().datetime().describe('The end time of the event in ISO 8601 format.'),
});

type CalendarSyncInput = z.infer<typeof calendarSyncSchema>;

const createOrUpdateCalendarEventTool = ai.defineTool(
  {
    name: 'createOrUpdateCalendarEvent',
    description: 'Creates or updates an event in the user\'s Google Calendar.',
    inputSchema: calendarSyncSchema,
    outputSchema: z.object({
      eventId: z.string().optional(),
      status: z.string(),
    }),
  },
  async (input) => {
    const adminApp = getFirebaseAdminApp();
    const db = getFirestore(adminApp);

    // 1. Fetch user's Google tokens from Firestore
    const userDoc = await db.collection('users').doc(input.userId).get();
    const userData = userDoc.data();

    if (!userData?.googleRefreshToken) {
      return { status: 'error', eventId: undefined, message: 'User is not connected to Google Calendar.' };
    }

    // 2. Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: userData.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 3. Fetch visit to check if it already has a Google Calendar event ID
    const visitDoc = await db.collectionGroup('schedules').where('id', '==', input.visitId).limit(1).get();
    const visitData = visitDoc.docs[0]?.data();
    const googleCalendarEventId = visitData?.googleCalendarEventId;

    const event = {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.startTime,
        timeZone: 'America/Sao_Paulo', // TODO: Make this dynamic based on user settings
      },
      end: {
        dateTime: input.endTime,
        timeZone: 'America/Sao_Paulo',
      },
    };

    try {
      if (googleCalendarEventId) {
        // 4a. Update existing event
        const updatedEvent = await calendar.events.update({
          calendarId: 'primary',
          eventId: googleCalendarEventId,
          requestBody: event,
        });
        return { status: 'updated', eventId: updatedEvent.data.id! };
      } else {
        // 4b. Create new event
        const createdEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        // 5. Store the new event ID back in the visit document
        if (createdEvent.data.id) {
          await visitDoc.docs[0].ref.update({
            googleCalendarEventId: createdEvent.data.id,
          });
          return { status: 'created', eventId: createdEvent.data.id! };
        }
        return { status: 'error', message: 'Failed to create event.' };
      }
    } catch (error: any) {
        console.error('Error syncing to Google Calendar:', error.message);
         // If token is expired or revoked, prompt for re-authentication
        if (error.code === 401 || (error.response?.data?.error === 'invalid_grant')) {
            // Clear the invalid tokens from the user's document
            await db.collection('users').doc(input.userId).update({
                googleAccessToken: null,
                googleRefreshToken: null,
                googleTokenExpiry: null,
            });
            return { status: 'reauth_required', message: 'Google token is invalid. Please reconnect your account.' };
        }
        return { status: 'error', message: error.message };
    }
  }
);

// This is the exported function that the frontend will call.
export async function syncVisitToGoogleCalendar(input: CalendarSyncInput) {
    return await calendarSyncFlow(input);
}

const calendarSyncFlow = ai.defineFlow(
  {
    name: 'calendarSyncFlow',
    inputSchema: calendarSyncSchema,
    outputSchema: z.object({
        eventId: z.string().optional(),
        status: z.string(),
    }),
  },
  async (input) => {
    // Simply call the tool. The real logic is inside the tool definition.
    const result = await createOrUpdateCalendarEventTool(input);
    return result;
  }
);
