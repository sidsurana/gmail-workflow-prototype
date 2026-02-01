/**
 * Gmail OAuth2 authentication helper
 */

import { google } from 'googleapis';
import * as fs from 'fs/promises';
import * as path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
];

export class AuthHelper {
  /**
   * Authenticate and return OAuth2 client
   */
  static async authenticate(): Promise<any> {
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    const tokenPath = path.join(process.cwd(), 'token.json');

    // Load credentials
    let credentials;
    try {
      const content = await fs.readFile(credentialsPath, 'utf-8');
      credentials = JSON.parse(content);
    } catch (error) {
      throw new Error(
        'Error loading credentials. Please download credentials.json from Google Cloud Console.'
      );
    }

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token
    try {
      const token = await fs.readFile(tokenPath, 'utf-8');
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client;
    } catch (error) {
      // No token found, need to get new token
      return this.getNewToken(oAuth2Client, tokenPath);
    }
  }

  /**
   * Get and store new token after prompting for user authorization
   */
  private static async getNewToken(oAuth2Client: any, tokenPath: string): Promise<any> {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);
    console.log('Enter the code from that page here: ');

    // In a real implementation, you'd use a proper input method
    // For now, this is a placeholder
    throw new Error(
      'Please visit the auth URL and complete OAuth flow. Token will be saved automatically.'
    );
  }

  /**
   * Save token to file
   */
  static async saveToken(token: any, tokenPath: string): Promise<void> {
    await fs.writeFile(tokenPath, JSON.stringify(token));
    console.log('Token stored to', tokenPath);
  }
}
