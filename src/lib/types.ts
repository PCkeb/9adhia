export interface Profile {
  id: string;
  full_name: string;
  role: 'manager' | 'employee' | 'reader';
  created_at: string;
}

export interface Person {
  id: string;
  registration_number: string;
  full_name: string;
  rank: string;
  unit: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  date: string;
  person_id: string | null;
  case_type: string;
  description: string | null;
  court: string;
  judicial_authority: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  person?: Person | null;
}

export interface Session {
  id: string;
  case_id: string;
  date: string;
  time: string;
  court: string;
  room: string | null;
  judge: string | null;
  result: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  case?: Case | null;
}

export interface Attachment {
  id: string;
  case_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  created_at: string;
}

export interface Activity {
  id: string;
  case_id: string;
  user_id: string | null;
  action: string;
  created_at: string;
  profiles?: Profile | null;
}

export interface CaseWithPerson extends Case {
  person: Person | null;
}

export interface SessionWithCase extends Session {
  case: Case | null;
}
