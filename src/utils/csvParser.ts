import { Student } from '../types';

export interface SimulatedPreset {
  id: string;
  title: string;
  description: string;
  count: number;
  students: Student[];
}

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'sample-1', seatNumber: 1, name: '陳子豪' },
  { id: 'sample-2', seatNumber: 2, name: '林若曦' },
  { id: 'sample-3', seatNumber: 3, name: '張宇廷' },
  { id: 'sample-4', seatNumber: 4, name: '李佳蓉' },
  { id: 'sample-5', seatNumber: 5, name: '王俊傑' },
  { id: 'sample-6', seatNumber: 6, name: '黃詩涵' },
  { id: 'sample-7', seatNumber: 7, name: '吳冠宇' },
  { id: 'sample-8', seatNumber: 8, name: '劉雅婷' },
  { id: 'sample-9', seatNumber: 9, name: '楊承翰' },
  { id: 'sample-10', seatNumber: 10, name: '蔡孟璇' },
  { id: 'sample-11', seatNumber: 11, name: '許家維' },
  { id: 'sample-12', seatNumber: 12, name: '鄭安琪' },
  { id: 'sample-13', seatNumber: 13, name: '謝政廷' },
  { id: 'sample-14', seatNumber: 14, name: '洪詠晴' },
  { id: 'sample-15', seatNumber: 15, name: '郭品妤' },
  { id: 'sample-16', seatNumber: 16, name: '邱柏宇' },
  { id: 'sample-17', seatNumber: 17, name: '曾韋翔' },
  { id: 'sample-18', seatNumber: 18, name: '廖欣儀' },
  { id: 'sample-19', seatNumber: 19, name: '賴柏霖' },
  { id: 'sample-20', seatNumber: 20, name: '徐羽涵' },
  { id: 'sample-21', seatNumber: 21, name: '周宗翰' },
  { id: 'sample-22', seatNumber: 22, name: '葉芷琪' },
  { id: 'sample-23', seatNumber: 23, name: '蘇育賢' },
  { id: 'sample-24', seatNumber: 24, name: '莊凱婷' },
  { id: 'sample-25', seatNumber: 25, name: '江奕廷' },
  { id: 'sample-26', seatNumber: 26, name: '何雨軒' },
  { id: 'sample-27', seatNumber: 27, name: '蕭佩萱' },
  { id: 'sample-28', seatNumber: 28, name: '彭郁婷' },
];

export const SIMULATED_ROSTER_PRESETS: SimulatedPreset[] = [
  {
    id: 'standard-class',
    title: '標準中小學班級',
    description: '28 位完整座號與姓名，適合完整體驗抽籤與多組別自動分組。',
    count: 28,
    students: SAMPLE_STUDENTS,
  },
  {
    id: 'seminar-group',
    title: '精緻研討小班',
    description: '12 位學生名單，適合快速測試 3~4 人一組或快速點名。',
    count: 12,
    students: [
      { id: 'sem-1', seatNumber: 1, name: '陳子豪' },
      { id: 'sem-2', seatNumber: 2, name: '林若曦' },
      { id: 'sem-3', seatNumber: 3, name: '張宇廷' },
      { id: 'sem-4', seatNumber: 4, name: '李佳蓉' },
      { id: 'sem-5', seatNumber: 5, name: '王俊傑' },
      { id: 'sem-6', seatNumber: 6, name: '黃詩涵' },
      { id: 'sem-7', seatNumber: 7, name: '吳冠宇' },
      { id: 'sem-8', seatNumber: 8, name: '劉雅婷' },
      { id: 'sem-9', seatNumber: 9, name: '楊承翰' },
      { id: 'sem-10', seatNumber: 10, name: '蔡孟璇' },
      { id: 'sem-11', seatNumber: 11, name: '許家維' },
      { id: 'sem-12', seatNumber: 12, name: '鄭安琪' },
    ],
  },
  {
    id: 'duplicate-test',
    title: '含重複姓名測試名單',
    description: '共 16 筆，內含 4 處重複姓名（如陳子豪、黃詩涵），供測試重複標記與一鍵去重。',
    count: 16,
    students: [
      { id: 'dup-1', seatNumber: 1, name: '陳子豪' },
      { id: 'dup-2', seatNumber: 2, name: '林若曦' },
      { id: 'dup-3', seatNumber: 3, name: '陳子豪' }, // Duplicate
      { id: 'dup-4', seatNumber: 4, name: '李佳蓉' },
      { id: 'dup-5', seatNumber: 5, name: '黃詩涵' },
      { id: 'dup-6', seatNumber: 6, name: '王俊傑' },
      { id: 'dup-7', seatNumber: 7, name: '黃詩涵' }, // Duplicate
      { id: 'dup-8', seatNumber: 8, name: '吳冠宇' },
      { id: 'dup-9', seatNumber: 9, name: '張宇廷' },
      { id: 'dup-10', seatNumber: 10, name: '張宇廷' }, // Duplicate
      { id: 'dup-11', seatNumber: 11, name: '劉雅婷' },
      { id: 'dup-12', seatNumber: 12, name: '楊承翰' },
      { id: 'dup-13', seatNumber: 13, name: '蔡孟璇' },
      { id: 'dup-14', seatNumber: 14, name: '蔡孟璇' }, // Duplicate
      { id: 'dup-15', seatNumber: 15, name: '許家維' },
      { id: 'dup-16', seatNumber: 16, name: '鄭安琪' },
    ],
  },
  {
    id: 'large-class',
    title: '高中/大學大班級',
    description: '40 位完整學生名單，適合測試大班級隨機點名與 6~8 人大規模自動分組。',
    count: 40,
    students: [
      ...SAMPLE_STUDENTS,
      { id: 'large-29', seatNumber: 29, name: '潘建宏' },
      { id: 'large-30', seatNumber: 30, name: '施雅筑' },
      { id: 'large-31', seatNumber: 31, name: '方偉倫' },
      { id: 'large-32', seatNumber: 32, name: '柯佳穎' },
      { id: 'large-33', seatNumber: 33, name: '翁嘉佑' },
      { id: 'large-34', seatNumber: 34, name: '羅子翔' },
      { id: 'large-35', seatNumber: 35, name: '簡詩庭' },
      { id: 'large-36', seatNumber: 36, name: '薛博仁' },
      { id: 'large-37', seatNumber: 37, name: '杜宜蓁' },
      { id: 'large-38', seatNumber: 38, name: '顏浩軒' },
      { id: 'large-39', seatNumber: 39, name: '童郁芬' },
      { id: 'large-40', seatNumber: 40, name: '梁祐嘉' },
    ],
  },
];

export const SAMPLE_DUPLICATE_PASTE_TEXT = `01. 陳子豪
02. 林若曦
03. 陳子豪
04. 李佳蓉
05. 黃詩涵
06. 王俊傑
07. 黃詩涵
08. 吳冠宇
09. 張宇廷
10. 張宇廷
11. 劉雅婷
12. 楊承翰`;

export const SAMPLE_CSV_DUPLICATE_CONTENT = `座號,學生姓名,備註
1,陳子豪,普通
2,林若曦,普通
3,陳子豪,重複資料
4,李佳蓉,普通
5,黃詩涵,普通
6,王俊傑,普通
7,黃詩涵,重複資料
8,吳冠宇,普通
9,張宇廷,普通
10,張宇廷,重複資料
11,劉雅婷,普通
12,蔡孟璇,普通`;

export function downloadSampleCSVFile(withDuplicates: boolean = false) {
  const content = withDuplicates 
    ? SAMPLE_CSV_DUPLICATE_CONTENT 
    : '座號,學生姓名\n' + SAMPLE_STUDENTS.map(s => `${s.seatNumber},"${s.name}"`).join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = withDuplicates ? '測試名單_含重複姓名.csv' : '示範學生名單_標準28人.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Identify duplicate names in an array of names.
 * Returns a Set containing names that appear more than once.
 */
export function getDuplicateNamesSet(names: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) {
      duplicates.add(trimmed);
    } else {
      seen.add(trimmed);
    }
  }

  return duplicates;
}

/**
 * Remove duplicate students while preserving the first appearance.
 */
export function removeDuplicatesFromStudents(students: Student[]): {
  unique: Student[];
  removedCount: number;
  removedNames: string[];
} {
  const seen = new Set<string>();
  const unique: Student[] = [];
  const removedNames: string[] = [];

  for (const student of students) {
    const trimmed = student.name.trim();
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      unique.push(student);
    } else {
      removedNames.push(trimmed);
    }
  }

  return {
    unique,
    removedCount: removedNames.length,
    removedNames,
  };
}

/**
 * Remove duplicate rows in CSV based on the name column
 */
export function removeDuplicatesFromCSVRows(
  rows: string[][],
  nameColIdx: number
): {
  uniqueRows: string[][];
  removedCount: number;
} {
  const seen = new Set<string>();
  const uniqueRows: string[][] = [];
  let removedCount = 0;

  for (const row of rows) {
    const name = row[nameColIdx]?.trim();
    if (!name) continue;

    if (!seen.has(name)) {
      seen.add(name);
      uniqueRows.push(row);
    } else {
      removedCount++;
    }
  }

  return { uniqueRows, removedCount };
}

/**
 * Parses raw text input into a student list.
 * Can handle newlines, commas, tabs, spaces.
 */
export function parseRawTextToStudents(text: string): Student[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/[\r\n,;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const students: Student[] = [];
  let seat = 1;

  for (const line of lines) {
    const match = line.match(/^(\d+)[\s.、_-]+(.+)$/);
    if (match) {
      const parsedSeat = parseInt(match[1], 10);
      const name = match[2].trim();
      if (name) {
        students.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          seatNumber: isNaN(parsedSeat) ? seat++ : parsedSeat,
          name,
        });
        continue;
      }
    }

    students.push({
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      seatNumber: seat++,
      name: line,
    });
  }

  return students;
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  suggestedNameColumnIndex: number;
  suggestedSeatColumnIndex: number;
}

/**
 * Parses CSV text into rows & columns
 */
export function parseCSV(content: string): CSVParseResult {
  const firstLine = content.split(/\r\n|\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuote = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      currentVal = '';
      if (currentRow.some(val => val.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(val => val.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], suggestedNameColumnIndex: -1, suggestedSeatColumnIndex: -1 };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  let nameIndex = headers.findIndex(h =>
    /姓名|名字|學生|name|student/i.test(h.replace(/\s+/g, ''))
  );
  if (nameIndex === -1) {
    nameIndex = 0;
  }

  const seatIndex = headers.findIndex(h =>
    /座號|號碼|學號|編號|seat|no|number|id/i.test(h.replace(/\s+/g, ''))
  );

  return {
    headers,
    rows: dataRows.length > 0 ? dataRows : [headers],
    suggestedNameColumnIndex: nameIndex,
    suggestedSeatColumnIndex: seatIndex,
  };
}

export function convertCSVToStudents(
  rows: string[][],
  nameColIdx: number,
  seatColIdx: number = -1
): Student[] {
  const students: Student[] = [];
  let autoSeat = 1;

  rows.forEach((row) => {
    const rawName = row[nameColIdx]?.trim();
    if (!rawName) return;

    let seatNumber = autoSeat++;
    if (seatColIdx >= 0 && row[seatColIdx]) {
      const parsedSeat = parseInt(row[seatColIdx].trim(), 10);
      if (!isNaN(parsedSeat)) {
        seatNumber = parsedSeat;
      }
    }

    students.push({
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      seatNumber,
      name: rawName,
    });
  });

  return students;
}
