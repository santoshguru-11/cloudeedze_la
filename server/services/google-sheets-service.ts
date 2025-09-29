import { google } from 'googleapis';
import { sheets_v4 } from 'googleapis';
import { drive_v3 } from 'googleapis';

export interface GoogleSheetsConfig {
  clientEmail: string;
  privateKey: string;
  spreadsheetId?: string;
}

export interface UploadResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private auth: any;

  constructor(config: GoogleSheetsConfig) {
    // Initialize Google Auth with service account
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Upload Excel file data to Google Sheets
   */
  async uploadExcelData(
    fileName: string,
    data: any[][],
    headers: string[]
  ): Promise<UploadResult> {
    try {
      // Create a new spreadsheet
      const spreadsheet = await this.createSpreadsheet(fileName);
      
      if (!spreadsheet.spreadsheetId) {
        throw new Error('Failed to create spreadsheet');
      }

      // Prepare the data with headers
      const sheetData = [
        headers, // Header row
        ...data     // Data rows
      ];

      // Write data to the first sheet
      await this.writeToSheet(spreadsheet.spreadsheetId, 'Sheet1', sheetData);

      // Make the spreadsheet publicly viewable (optional)
      await this.makePublic(spreadsheet.spreadsheetId);

      return {
        success: true,
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`
      };
    } catch (error) {
      console.error('Google Sheets upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new Google Spreadsheet
   */
  private async createSpreadsheet(title: string): Promise<{ spreadsheetId: string }> {
    const request: sheets_v4.Schema$Spreadsheet = {
      properties: {
        title: `${title} - Cloudedze Analysis`,
      },
    };

    const response = await this.sheets.spreadsheets.create({
      requestBody: request,
    });

    return {
      spreadsheetId: response.data.spreadsheetId || ''
    };
  }

  /**
   * Write data to a specific sheet
   */
  private async writeToSheet(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
  }

  /**
   * Make spreadsheet publicly viewable
   */
  private async makePublic(spreadsheetId: string): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (error) {
      console.warn('Failed to make spreadsheet public:', error);
      // Don't fail the entire operation if this fails
    }
  }

  /**
   * Get spreadsheet URL by ID
   */
  getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  /**
   * Share spreadsheet with specific email
   */
  async shareWithEmail(
    spreadsheetId: string,
    email: string,
    role: 'reader' | 'writer' | 'owner' = 'reader'
  ): Promise<void> {
    await this.drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role,
        type: 'user',
        emailAddress: email,
      },
    });
  }
}
