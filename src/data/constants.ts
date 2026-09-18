export interface DepartmentInfo {
  code: string;
  name: string;
  establishedYear: number;
  hodName: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  { code: 'CMPN', name: 'Computer Engineering', establishedYear: 1999, hodName: 'Dr. Ravindra Sangale' },
  { code: 'INFT', name: 'Information Technology', establishedYear: 1999, hodName: 'Dr. Vidya Chitre' },
  { code: 'EXTC', name: 'Electronics & Telecommunication', establishedYear: 1999, hodName: 'Dr. Girish Gidaye' },
  { code: 'EXCS', name: 'Electronics & Computer Science', establishedYear: 2004, hodName: 'Dr. Arun Chavan' },
  { code: 'BIOM', name: 'Biomedical Engineering', establishedYear: 1999, hodName: 'Dr. Gajanan Nagare' },
  { code: 'MCA', name: 'Master of Computer Applications', establishedYear: 2008, hodName: 'Dr. Vidya Chitre' },
  { code: 'MBA', name: 'Master of Management Studies (MMS)', establishedYear: 2006, hodName: 'Dr. Amit Oak' }
];
