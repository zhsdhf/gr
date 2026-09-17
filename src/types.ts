export interface Student {
  id: string;
  name: string;
  seatNumber?: number;
  gender?: 'M' | 'F' | 'other';
  notes?: string;
}

export type DrawMode = 'with_replacement' | 'without_replacement';

export interface DrawHistoryRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: number;
  orderNumber: number;
}

export interface GroupItem {
  id: string;
  name: string;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    tagBg: string;
  };
  iconName: string;
  members: Student[];
}

export type GroupingStrategy = 'by_member_count' | 'by_group_count';
export type RemainderStrategy = 'distribute' | 'last_group';
