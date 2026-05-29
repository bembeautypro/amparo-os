import type {
  FileText,
  FileImage,
  Stethoscope,
  ClipboardList,
  IdCard,
  Pill,
  Syringe,
  HeartPulse,
  FileType2,
} from "lucide-react";

export type DocumentType =
  | "prescription"
  | "exam"
  | "report"
  | "medical_order"
  | "insurance_card"
  | "personal_doc"
  | "hospital_discharge"
  | "vaccine"
  | "other";

type Meta = {
  value: DocumentType;
  label: string;
  icon: typeof FileText;
  emoji: string;
};

// Lightweight metadata (icons referenced from list/form components)
export const DOC_TYPES: Array<{ value: DocumentType; label: string; emoji: string }> = [
  { value: "prescription", label: "Receita", emoji: "💊" },
  { value: "exam", label: "Exame", emoji: "🧪" },
  { value: "report", label: "Laudo", emoji: "📋" },
  { value: "medical_order", label: "Pedido médico", emoji: "📝" },
  { value: "insurance_card", label: "Carteirinha", emoji: "💳" },
  { value: "personal_doc", label: "Documento pessoal", emoji: "🪪" },
  { value: "hospital_discharge", label: "Alta hospitalar", emoji: "🏥" },
  { value: "vaccine", label: "Vacina", emoji: "💉" },
  { value: "other", label: "Outro", emoji: "📄" },
];

export const DOC_TYPE_LABEL: Record<DocumentType, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.label]),
) as Record<DocumentType, string>;

export const DOC_TYPE_EMOJI: Record<DocumentType, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.emoji]),
) as Record<DocumentType, string>;

export type Document = {
  id: string;
  patient_id: string;
  title: string;
  doc_type: DocumentType;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  document_date: string | null;
  exam_date: string | null;
  doctor_name: string | null;
  institution: string | null;
  tags: string[];
  expiry_date: string | null;
  appointment_id: string | null;
  clinical_event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DocumentFilters = {
  search?: string;
  types?: DocumentType[];
  from?: string;
  to?: string;
  doctorOrInstitution?: string;
};

export const DOCUMENTS_BUCKET = "patient-documents";
