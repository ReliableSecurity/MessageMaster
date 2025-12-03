export interface ParsedContact {
  email: string;
  firstName?: string;
  lastName?: string;
}

function stripBOM(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1);
  }
  return text;
}

export function parseCSV(text: string): ParsedContact[] {
  const cleanText = stripBOM(text.trim());
  if (!cleanText) return [];
  
  const delimiter = cleanText.includes(';') && !cleanText.split('\n')[0].includes(',') ? ';' : ',';
  
  const lines = cleanText.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(delimiter).map(h => 
    h.trim().replace(/^["']|["']$/g, '').toLowerCase()
  );
  
  const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail' || h === 'почта');
  const firstNameIndex = headers.findIndex(h => 
    h === 'firstname' || h === 'first_name' || h === 'имя' || h === 'first name'
  );
  const lastNameIndex = headers.findIndex(h => 
    h === 'lastname' || h === 'last_name' || h === 'фамилия' || h === 'last name'
  );
  
  if (emailIndex === -1) return [];
  
  const data: ParsedContact[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line, delimiter);
    const email = values[emailIndex]?.trim();
    
    if (email && isValidEmail(email)) {
      data.push({
        email,
        firstName: firstNameIndex !== -1 ? values[firstNameIndex]?.trim() || undefined : undefined,
        lastName: lastNameIndex !== -1 ? values[lastNameIndex]?.trim() || undefined : undefined,
      });
    }
  }
  
  return data;
}

function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateCSVTemplate(): string {
  return 'email,firstName,lastName\nexample@company.com,Иван,Иванов';
}
