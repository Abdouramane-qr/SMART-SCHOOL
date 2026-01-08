import { apiRequest, unwrapData } from "@/services/laravelApi";

export interface LaravelPaginationMeta {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface LaravelListResponse<T> {
  items: T[];
  meta?: LaravelPaginationMeta;
}

const PAGED_LIST_SIZE = 200;

const buildQuery = (params: Record<string, string | number | null | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
};

const fetchAllPages = async <T>(
  path: string,
  params: Record<string, string | number | null | undefined> = {},
): Promise<T[]> => {
  const items: T[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const query = buildQuery({
      ...params,
      per_page: PAGED_LIST_SIZE,
      page,
    });
    const payload = await apiRequest<any>(`${path}?${query}`);
    const { data, meta } = unwrapData<T[]>(payload);
    if (Array.isArray(data)) {
      items.push(...data);
    }

    if (!meta?.last_page || meta.last_page <= page) {
      break;
    }

    lastPage = meta.last_page;
    page += 1;
  } while (page <= lastPage);

  return items;
};

export interface LaravelClasse {
  id: string | number;
  name?: string;
  level?: string;
  capacity?: number;
  school_year_id?: string | number | null;
}

export interface LaravelPaiement {
  id: string | number;
  amount?: number;
  paid_amount?: number;
  payment_date?: string | null;
  due_date?: string | null;
  payment_type?: string | null;
  method?: string | null;
  status?: string | null;
  notes?: string | null;
  receipt_number?: string | null;
  eleve?: {
    id: string | number;
    student_id?: string | null;
    full_name?: string | null;
  } | null;
}

export interface LaravelEleve {
  id: string | number;
  student_id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  classe?: LaravelClasse | null;
  class?: LaravelClasse | null;
  paiements?: LaravelPaiement[];
  payments?: LaravelPaiement[];
  total_paid?: number;
  total_due?: number;
}

export interface LaravelEnrollment {
  id: string | number;
  student_id: string | number;
  class_id: string | number;
  school_year_id?: string | number | null;
  enrollment_date?: string | null;
  students?: {
    id: string | number;
    student_id?: string | null;
    full_name?: string | null;
  } | null;
  classes?: {
    id: string | number;
    name?: string | null;
    level?: string | null;
  } | null;
}

export interface LaravelSchoolYear {
  id: string | number;
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
}

export interface LaravelExpense {
  id: string | number;
  category?: string | null;
  description?: string | null;
  amount?: number;
  expense_date?: string | null;
  receipt_number?: string | null;
  notes?: string | null;
}

export interface LaravelSalary {
  id: string | number;
  teacher_id?: string | number;
  amount?: number;
  payment_date?: string | null;
  month?: string | null;
  year?: number | null;
  bonus?: number | null;
  deductions?: number | null;
  net_amount?: number | null;
  notes?: string | null;
  teachers?: {
    id: string | number;
    profiles?: {
      full_name?: string | null;
    };
  } | null;
}

export interface LaravelTeacher {
  id: string | number;
  specialization?: string | null;
  hire_date?: string | null;
  monthly_salary?: number | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export interface LaravelAsset {
  id: string | number;
  expense_id?: string | number | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  acquisition_date?: string | null;
  acquisition_value?: number | null;
  current_value?: number | null;
  location?: string | null;
  serial_number?: string | null;
  supplier?: string | null;
  warranty_end_date?: string | null;
  notes?: string | null;
}

export interface LaravelMessage {
  id: string | number;
  sender_id?: string | number;
  recipient_id?: string | number;
  subject?: string | null;
  content?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  parent_message_id?: string | number | null;
  sender?: { id: string | number; full_name?: string | null; email?: string | null } | null;
  recipient?: { id: string | number; full_name?: string | null; email?: string | null } | null;
  created_at?: string | null;
}

export interface LaravelTeacherAudit {
  id: string | number;
  teacher_id?: string | number;
  action?: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  notes?: string | null;
  changed_at?: string | null;
  profiles?: { full_name?: string | null } | null;
}

export interface LaravelStudentAudit {
  id: string | number;
  student_id?: string | number;
  action?: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  notes?: string | null;
  changed_at?: string | null;
  profiles?: { full_name?: string | null } | null;
}

export interface LaravelAbsence {
  id: string | number;
  student_id?: string | number;
  class_id?: string | number;
  school_year_id?: string | number | null;
  absence_date?: string | null;
  absence_type?: string | null;
  justified?: boolean;
  reason?: string | null;
  duration_minutes?: number;
  students?: { full_name?: string | null; student_id?: string | null } | null;
  classes?: { name?: string | null; level?: string | null } | null;
}

export interface LaravelSubject {
  id: string | number;
  name?: string | null;
  code?: string | null;
  coefficient?: number | null;
}

export interface LaravelClassroom {
  id: string | number;
  name?: string | null;
  capacity?: number | null;
  building?: string | null;
  floor?: number | null;
  equipment?: string[] | null;
}

export interface LaravelTimetableEntry {
  id: string | number;
  class_id?: string | number;
  subject_id?: string | number;
  teacher_id?: string | number | null;
  classroom_id?: string | number | null;
  day_of_week?: number;
  start_time?: string | null;
  end_time?: string | null;
  classes?: { name?: string | null } | null;
  subjects?: { name?: string | null; code?: string | null } | null;
  teachers?: { id?: string | number; profiles?: { full_name?: string | null } | null } | null;
  classrooms?: { name?: string | null } | null;
}

export interface LaravelGradeRaw {
  id: string | number;
  eleve_id?: string | number;
  matiere_id?: string | number;
  class_id?: string | number | null;
  academic_year_id?: string | number;
  value?: number | null;
  term?: string | null;
  grade_type?: string | null;
  weight?: number | null;
  description?: string | null;
  evaluation_date?: string | null;
  created_at?: string | null;
  eleve?: { full_name?: string | null; student_id?: string | null } | null;
  matiere?: { name?: string | null; coefficient?: number | null } | null;
  classes?: { name?: string | null } | null;
}

export const laravelClassesApi = {
  getAll: async (): Promise<LaravelClasse[]> => {
    const payload = await apiRequest<any>("/classes");
    const { data } = unwrapData<LaravelClasse[]>(payload);
    return data || [];
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelClasse> => {
    const response = await apiRequest<any>("/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelClasse>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelClasse> => {
    const response = await apiRequest<any>(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelClasse>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/classes/${id}`, { method: "DELETE" });
  },
};

export const laravelSubjectsApi = {
  getAll: async (): Promise<LaravelSubject[]> => {
    const payload = await apiRequest<any>("/subjects");
    const { data } = unwrapData<LaravelSubject[]>(payload);
    return data || [];
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelSubject> => {
    const response = await apiRequest<any>("/subjects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelSubject>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelSubject> => {
    const response = await apiRequest<any>(`/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelSubject>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/subjects/${id}`, { method: "DELETE" });
  },
};

export const laravelStudentsApi = {
  getAll: async (params?: {
    page?: number;
    perPage?: number;
    q?: string;
    classId?: string | number;
  }): Promise<LaravelListResponse<LaravelEleve>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) {
      searchParams.set("page", String(params.page));
    }
    if (params?.perPage) {
      searchParams.set("per_page", String(params.perPage));
    }
    if (params?.q) {
      searchParams.set("q", params.q);
    }
    if (params?.classId && params.classId !== "all") {
      searchParams.set("class_id", String(params.classId));
    }
    const query = searchParams.toString();
    const payload = await apiRequest<any>(`/eleves${query ? `?${query}` : ""}`);
    const { data, meta } = unwrapData<LaravelEleve[]>(payload);
    return { items: data || [], meta };
  },
  getByUserId: async (userId: string | number): Promise<LaravelEleve | null> => {
    const payload = await apiRequest<any>(`/eleves?user_id=${userId}&per_page=1`);
    const { data } = unwrapData<LaravelEleve[]>(payload);
    return data?.[0] || null;
  },
  getByParentEmail: async (email: string): Promise<LaravelEleve[]> => {
    return fetchAllPages<LaravelEleve>("/eleves", {
      parent_email: email,
    });
  },
  getById: async (id: string): Promise<LaravelEleve> => {
    const payload = await apiRequest<any>(`/eleves/${id}`);
    const { data } = unwrapData<LaravelEleve>(payload);
    return data;
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelEleve> => {
    const response = await apiRequest<any>("/eleves", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelEleve>(response);
    return data;
  },
  update: async (id: string, payload: Record<string, unknown>): Promise<LaravelEleve> => {
    const response = await apiRequest<any>(`/eleves/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelEleve>(response);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiRequest(`/eleves/${id}`, {
      method: "DELETE",
    });
  },
};

export const laravelPaiementsApi = {
  getAll: async (): Promise<LaravelPaiement[]> => {
    return fetchAllPages<LaravelPaiement>("/paiements");
  },
  getByStudentId: async (studentId: string | number): Promise<LaravelPaiement[]> => {
    return fetchAllPages<LaravelPaiement>("/paiements", {
      eleve_id: studentId,
    });
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelPaiement> => {
    const response = await apiRequest<any>("/paiements", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelPaiement>(response);
    return data;
  },
};

export const laravelEnrollmentsApi = {
  getByClassId: async (classId: string | number): Promise<LaravelEnrollment[]> => {
    const payload = await apiRequest<any>(`/enrollments?class_id=${classId}`);
    const { data } = unwrapData<LaravelEnrollment[]>(payload);
    return data || [];
  },
  getByStudentId: async (studentId: string | number): Promise<LaravelEnrollment[]> => {
    const payload = await apiRequest<any>(`/enrollments?student_id=${studentId}`);
    const { data } = unwrapData<LaravelEnrollment[]>(payload);
    return data || [];
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelEnrollment> => {
    const response = await apiRequest<any>("/enrollments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelEnrollment>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/enrollments/${id}`, { method: "DELETE" });
  },
};

export const laravelSchoolYearsApi = {
  getAll: async (): Promise<LaravelSchoolYear[]> => {
    const payload = await apiRequest<any>("/school-years");
    const { data } = unwrapData<LaravelSchoolYear[]>(payload);
    return data || [];
  },
  getCurrent: async (): Promise<LaravelSchoolYear | null> => {
    const payload = await apiRequest<any>("/school-years");
    const { data } = unwrapData<LaravelSchoolYear[]>(payload);
    const current = (data || []).find((year) => year.is_current);
    return current || null;
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelSchoolYear> => {
    const response = await apiRequest<any>("/school-years", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelSchoolYear>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelSchoolYear> => {
    const response = await apiRequest<any>(`/school-years/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelSchoolYear>(response);
    return data;
  },
  setCurrent: async (id: string | number): Promise<LaravelSchoolYear> => {
    const response = await apiRequest<any>(`/school-years/${id}/set-current`, {
      method: "POST",
    });
    const { data } = unwrapData<LaravelSchoolYear>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/school-years/${id}`, { method: "DELETE" });
  },
};

export const laravelExpensesApi = {
  getAll: async (): Promise<LaravelExpense[]> => {
    return fetchAllPages<LaravelExpense>("/expenses");
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelExpense> => {
    const response = await apiRequest<any>("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelExpense>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelExpense> => {
    const response = await apiRequest<any>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelExpense>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/expenses/${id}`, { method: "DELETE" });
  },
};

export const laravelSalariesApi = {
  getAll: async (): Promise<LaravelSalary[]> => {
    return fetchAllPages<LaravelSalary>("/salaries");
  },
  getByTeacherId: async (teacherId: string | number): Promise<LaravelSalary[]> => {
    return fetchAllPages<LaravelSalary>("/salaries", {
      teacher_id: teacherId,
    });
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelSalary> => {
    const response = await apiRequest<any>("/salaries", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelSalary>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelSalary> => {
    const response = await apiRequest<any>(`/salaries/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelSalary>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/salaries/${id}`, { method: "DELETE" });
  },
};

export const laravelTeachersApi = {
  getAll: async (): Promise<LaravelTeacher[]> => {
    const payload = await apiRequest<any>("/teachers");
    const { data } = unwrapData<LaravelTeacher[]>(payload);
    return data || [];
  },
  getByUserId: async (userId: string | number): Promise<LaravelTeacher | null> => {
    const payload = await apiRequest<any>(`/teachers?user_id=${userId}`);
    const { data } = unwrapData<LaravelTeacher[]>(payload);
    return data?.[0] || null;
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelTeacher> => {
    const response = await apiRequest<any>("/teachers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelTeacher>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelTeacher> => {
    const response = await apiRequest<any>(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelTeacher>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/teachers/${id}`, { method: "DELETE" });
  },
};

export const laravelAssetsApi = {
  getAll: async (): Promise<LaravelAsset[]> => {
    return fetchAllPages<LaravelAsset>("/assets");
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelAsset> => {
    const response = await apiRequest<any>("/assets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelAsset>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelAsset> => {
    const response = await apiRequest<any>(`/assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelAsset>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/assets/${id}`, { method: "DELETE" });
  },
};

export const laravelMessagesApi = {
  getInbox: async (): Promise<LaravelMessage[]> => {
    const payload = await apiRequest<any>("/messages?box=inbox");
    const { data } = unwrapData<LaravelMessage[]>(payload);
    return data || [];
  },
  getSent: async (): Promise<LaravelMessage[]> => {
    const payload = await apiRequest<any>("/messages?box=sent");
    const { data } = unwrapData<LaravelMessage[]>(payload);
    return data || [];
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelMessage> => {
    const response = await apiRequest<any>("/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelMessage>(response);
    return data;
  },
  markRead: async (id: string | number, is_read: boolean): Promise<LaravelMessage> => {
    const response = await apiRequest<any>(`/messages/${id}`, {
      method: "PUT",
      body: JSON.stringify({ is_read }),
    });
    const { data } = unwrapData<LaravelMessage>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/messages/${id}`, { method: "DELETE" });
  },
};

export const laravelAbsencesApi = {
  getAll: async (): Promise<LaravelAbsence[]> => {
    return fetchAllPages<LaravelAbsence>("/absences");
  },
  getByStudentId: async (studentId: string | number): Promise<LaravelAbsence[]> => {
    return fetchAllPages<LaravelAbsence>("/absences", {
      eleve_id: studentId,
    });
  },
  getByStudentIds: async (studentIds: Array<string | number>): Promise<LaravelAbsence[]> => {
    if (!studentIds.length) {
      return [];
    }
    const ids = studentIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) {
      return [];
    }
    return fetchAllPages<LaravelAbsence>("/absences", {
      student_ids: ids.join(","),
    });
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelAbsence> => {
    const response = await apiRequest<any>("/absences", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelAbsence>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelAbsence> => {
    const response = await apiRequest<any>(`/absences/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelAbsence>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/absences/${id}`, { method: "DELETE" });
  },
};

export const laravelClassroomsApi = {
  getAll: async (): Promise<LaravelClassroom[]> => {
    const payload = await apiRequest<any>("/classrooms");
    const { data } = unwrapData<LaravelClassroom[]>(payload);
    return data || [];
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelClassroom> => {
    const response = await apiRequest<any>("/classrooms", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelClassroom>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelClassroom> => {
    const response = await apiRequest<any>(`/classrooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelClassroom>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/classrooms/${id}`, { method: "DELETE" });
  },
};

export const laravelTimetableApi = {
  getAll: async (): Promise<LaravelTimetableEntry[]> => {
    return fetchAllPages<LaravelTimetableEntry>("/timetable");
  },
  getByClassId: async (classId: string | number): Promise<LaravelTimetableEntry[]> => {
    const payload = await apiRequest<any>(`/timetable?class_id=${classId}`);
    const { data } = unwrapData<LaravelTimetableEntry[]>(payload);
    return data || [];
  },
  getByTeacherId: async (teacherId: string | number): Promise<LaravelTimetableEntry[]> => {
    const payload = await apiRequest<any>(`/timetable?teacher_id=${teacherId}`);
    const { data } = unwrapData<LaravelTimetableEntry[]>(payload);
    return data || [];
  },
  create: async (payload: Record<string, unknown>): Promise<LaravelTimetableEntry> => {
    const response = await apiRequest<any>("/timetable", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelTimetableEntry>(response);
    return data;
  },
  update: async (id: string | number, payload: Record<string, unknown>): Promise<LaravelTimetableEntry> => {
    const response = await apiRequest<any>(`/timetable/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const { data } = unwrapData<LaravelTimetableEntry>(response);
    return data;
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/timetable/${id}`, { method: "DELETE" });
  },
};

const normalizeGrade = (note: LaravelGradeRaw) => ({
  id: String(note.id),
  student_id: note.eleve_id != null ? String(note.eleve_id) : "",
  subject_id: note.matiere_id != null ? String(note.matiere_id) : "",
  class_id: note.class_id != null ? String(note.class_id) : "",
  school_year_id: note.academic_year_id != null ? String(note.academic_year_id) : "",
  term: note.term || "",
  grade: Number(note.value ?? 0),
  grade_type: note.grade_type ?? undefined,
  weight: note.weight ?? undefined,
  description: note.description ?? undefined,
  evaluation_date: note.evaluation_date ?? undefined,
  created_at: note.created_at || "",
  students: note.eleve
    ? { full_name: note.eleve.full_name || "", student_id: note.eleve.student_id || "" }
    : null,
  subjects: note.matiere
    ? { name: note.matiere.name || "", coefficient: note.matiere.coefficient ?? null }
    : null,
  classes: note.classes ? { name: note.classes.name || "" } : null,
});

export const laravelGradesApi = {
  getAll: async (): Promise<ReturnType<typeof normalizeGrade>[]> => {
    const data = await fetchAllPages<LaravelGradeRaw>("/notes");
    return data.map(normalizeGrade);
  },
  getByStudentId: async (studentId: string | number): Promise<ReturnType<typeof normalizeGrade>[]> => {
    const data = await fetchAllPages<LaravelGradeRaw>("/notes", {
      eleve_id: studentId,
    });
    return data.map(normalizeGrade);
  },
  getByStudentIds: async (studentIds: Array<string | number>): Promise<ReturnType<typeof normalizeGrade>[]> => {
    if (!studentIds.length) {
      return [];
    }
    const ids = studentIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) {
      return [];
    }
    const data = await fetchAllPages<LaravelGradeRaw>("/notes", {
      student_ids: ids.join(","),
    });
    return data.map(normalizeGrade);
  },
  create: async (payload: {
    student_id: string | number;
    subject_id: string | number;
    class_id?: string | number;
    school_year_id: string | number;
    term: string;
    grade: number;
    grade_type?: string;
    weight?: number;
    description?: string;
    evaluation_date?: string;
  }): Promise<ReturnType<typeof normalizeGrade>> => {
    const response = await apiRequest<any>("/notes", {
      method: "POST",
      body: JSON.stringify({
        eleve_id: Number(payload.student_id),
        matiere_id: Number(payload.subject_id),
        class_id: payload.class_id ? Number(payload.class_id) : null,
        academic_year_id: Number(payload.school_year_id),
        term: payload.term,
        value: payload.grade,
        grade_type: payload.grade_type,
        weight: payload.weight,
        description: payload.description,
        evaluation_date: payload.evaluation_date,
      }),
    });
    const { data } = unwrapData<LaravelGradeRaw>(response);
    return normalizeGrade(data);
  },
  update: async (
    id: string | number,
    payload: {
      term?: string;
      grade?: number;
      grade_type?: string;
      weight?: number;
      description?: string;
      evaluation_date?: string;
    },
  ): Promise<ReturnType<typeof normalizeGrade>> => {
    const response = await apiRequest<any>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        term: payload.term,
        value: payload.grade,
        grade_type: payload.grade_type,
        weight: payload.weight,
        description: payload.description,
        evaluation_date: payload.evaluation_date,
      }),
    });
    const { data } = unwrapData<LaravelGradeRaw>(response);
    return normalizeGrade(data);
  },
  delete: async (id: string | number): Promise<void> => {
    await apiRequest(`/notes/${id}`, { method: "DELETE" });
  },
};

export const laravelTeacherAuditsApi = {
  getByTeacherId: async (teacherId: string | number): Promise<LaravelTeacherAudit[]> => {
    const payload = await apiRequest<any>(`/teacher-audits?teacher_id=${teacherId}`);
    const { data } = unwrapData<LaravelTeacherAudit[]>(payload);
    return data || [];
  },
};

export const laravelStudentAuditsApi = {
  getByStudentId: async (studentId: string | number): Promise<LaravelStudentAudit[]> => {
    const payload = await apiRequest<any>(`/student-audits?student_id=${studentId}`);
    const { data } = unwrapData<LaravelStudentAudit[]>(payload);
    return data || [];
  },
};

export interface LaravelFinanceStats {
  totalPaid: number;
  totalExpected: number;
  totalRemaining: number;
  totalExpenses: number;
  totalSalaries: number;
  netResult: number;
  studentsUpToDate: number;
  studentsNotUpToDate: number;
  monthlyData: { month: string; revenus: number; depenses: number }[];
}

export const laravelFinanceApi = {
  getStats: async (): Promise<LaravelFinanceStats> => {
    const payload = await apiRequest<any>("/finance/stats");
    const { data } = unwrapData<LaravelFinanceStats>(payload);
    return data;
  },
};

export const laravelFinanceSettingsApi = {
  getAll: async (): Promise<{ setting_key: string; setting_value: string }[]> => {
    const payload = await apiRequest<any>("/finance/settings");
    const { data } = unwrapData<{ setting_key: string; setting_value: string }[]>(payload);
    return data || [];
  },
};

export interface LaravelDashboardSummary {
  total_eleves: number;
  total_classes: number;
  total_paiements: number;
  total_absences: number;
  total_notes: number;
  total_paid: number;
}

export const laravelDashboardApi = {
  getSummary: async (): Promise<LaravelDashboardSummary> => {
    const payload = await apiRequest<any>("/dashboard/summary");
    const { data } = unwrapData<LaravelDashboardSummary>(payload);
    return data;
  },
};

export const normalizeStudentName = (student: LaravelEleve) => {
  if (student.full_name) {
    return student.full_name;
  }
  const parts = [student.first_name, student.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : "";
};

export const normalizeStudentClasse = (student: LaravelEleve) => {
  const classe = student.classe || student.class;
  if (!classe) {
    return null;
  }
  if (classe.level && classe.name) {
    return `${classe.level} ${classe.name}`;
  }
  return classe.name || classe.level || null;
};

export const normalizeStudentPayments = (student: LaravelEleve) => {
  const payments = student.paiements || student.payments || [];
  const totalDueFromPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const totalPaidFromPayments = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.paid_amount ?? payment.amount ?? 0),
    0,
  );

  return {
    totalDue: student.total_due ?? totalDueFromPayments,
    totalPaid: student.total_paid ?? totalPaidFromPayments,
    payments,
  };
};
