import * as XLSX from 'xlsx';
import { CloudResource, UnifiedResource } from '@shared/schema';

export interface ExcelResourceData {
  provider: string;
  resourceType: string;
  resourceName: string;
  region: string;
  instanceType?: string;
  size?: number;
  unit?: string;
  quantity?: number;
  cost?: number;
  tags?: Record<string, string>;
  [key: string]: any;
}

export class ExcelParserService {
  private validateExcelData(data: any[]): ExcelResourceData[] {
    const requiredFields = ['provider', 'resourceType', 'resourceName', 'region'];
    const validData: ExcelResourceData[] = [];

    for (const row of data) {
      // Check if all required fields are present
      const hasRequiredFields = requiredFields.every(field => 
        row[field] && typeof row[field] === 'string' && row[field].trim() !== ''
      );

      if (hasRequiredFields) {
        validData.push({
          provider: row.provider?.toString().toLowerCase().trim(),
          resourceType: row.resourceType?.toString().trim(),
          resourceName: row.resourceName?.toString().trim(),
          region: row.region?.toString().trim(),
          instanceType: row.instanceType?.toString().trim(),
          size: row.size ? parseFloat(row.size.toString()) : undefined,
          unit: row.unit?.toString().trim(),
          quantity: row.quantity ? parseFloat(row.quantity.toString()) : 1,
          cost: row.cost ? parseFloat(row.cost.toString()) : undefined,
          tags: this.parseTags(row.tags),
          ...row
        });
      }
    }

    return validData;
  }

  private parseTags(tagsString?: string): Record<string, string> {
    if (!tagsString) return {};
    
    try {
      // Try to parse as JSON first
      if (tagsString.startsWith('{') && tagsString.endsWith('}')) {
        return JSON.parse(tagsString);
      }
      
      // Parse as key=value pairs separated by commas
      const tags: Record<string, string> = {};
      const pairs = tagsString.split(',').map(pair => pair.trim());
      
      for (const pair of pairs) {
        const [key, value] = pair.split('=').map(s => s.trim());
        if (key && value) {
          tags[key] = value;
        }
      }
      
      return tags;
    } catch (error) {
      console.warn('Failed to parse tags:', tagsString);
      return {};
    }
  }

  async parseExcelFile(buffer: Buffer): Promise<ExcelResourceData[]> {
    try {
      // Read the Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No worksheets found in Excel file');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      });
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }
      
      // Get headers from first row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];
      
      // Convert rows to objects
      const data = dataRows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          if (header && header.trim()) {
            obj[header.trim()] = row[index] || '';
          }
        });
        return obj;
      });
      
      // Validate and clean the data
      const validData = this.validateExcelData(data);
      
      if (validData.length === 0) {
        throw new Error('No valid data found. Please ensure your Excel file has the required columns: provider, resourceType, resourceName, region');
      }
      
      return validData;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  convertToUnifiedResources(excelData: ExcelResourceData[]): UnifiedResource[] {
    return excelData.map((item, index) => ({
      id: `excel-${index}-${Date.now()}`,
      name: item.resourceName,
      type: item.resourceType,
      provider: item.provider,
      region: item.region,
      state: 'ACTIVE',
      cost: item.cost || 0,
      metadata: {
        instanceType: item.instanceType,
        size: item.size,
        unit: item.unit,
        quantity: item.quantity || 1,
        tags: item.tags || {},
        source: 'excel-upload'
      }
    }));
  }

  generateExcelTemplate(): Buffer {
    const templateData = [
      {
        provider: 'aws',
        resourceType: 'ec2-instance',
        resourceName: 'web-server-01',
        region: 'us-east-1',
        instanceType: 't3.medium',
        size: 2,
        unit: 'vCPU',
        quantity: 1,
        cost: 30.5,
        tags: '{"Environment":"production","Team":"web"}'
      },
      {
        provider: 'aws',
        resourceType: 'rds-instance',
        resourceName: 'database-01',
        region: 'us-east-1',
        instanceType: 'db.t3.micro',
        size: 20,
        unit: 'GB',
        quantity: 1,
        cost: 15.2,
        tags: '{"Environment":"production","Team":"database"}'
      },
      {
        provider: 'oci',
        resourceType: 'compute-instance',
        resourceName: 'app-server-01',
        region: 'us-phoenix-1',
        instanceType: 'VM.Standard.E2.1.Micro',
        size: 1,
        unit: 'vCPU',
        quantity: 1,
        cost: 25.0,
        tags: '{"Environment":"staging","Team":"app"}'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cloud Resources');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  validateExcelFormat(headers: string[]): { isValid: boolean; errors: string[] } {
    const requiredFields = ['provider', 'resourceType', 'resourceName', 'region'];
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      if (!headers.some(header => header.toLowerCase().trim() === field)) {
        errors.push(`Missing required column: ${field}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
