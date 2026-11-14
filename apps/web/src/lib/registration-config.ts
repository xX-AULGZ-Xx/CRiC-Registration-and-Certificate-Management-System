import { SURVEY_COLORS, ColorOption } from './survey-themes';

export type StandardFieldKey =
  | 'title_name'
  | 'full_name'
  | 'position'
  | 'organization'
  | 'phone'
  | 'email'
  | 'citizen_id';

export interface StandardFieldSetting {
  enabled: boolean;
  required: boolean;
  label?: string;
}

export type CustomFieldType = 'text' | 'textarea' | 'radio' | 'select' | 'checkbox';

export interface CustomRegistrationField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface RegistrationFormConfig {
  themeColorId: string;
  headerTitle?: string;
  instructions?: string;
  showCertificateSidebar: boolean;
  standardFields: Record<StandardFieldKey, StandardFieldSetting>;
  customFields: CustomRegistrationField[];
}

export interface StandardFieldDefinition {
  key: StandardFieldKey;
  defaultLabel: string;
  description: string;
  lockedEnabled?: boolean;
  lockedRequired?: boolean;
}

export const STANDARD_FIELD_DEFINITIONS: StandardFieldDefinition[] = [
  {
    key: 'title_name',
    defaultLabel: 'คำนำหน้า',
    description: 'นาย, นาง, นางสาว, อื่นๆ',
  },
  {
    key: 'full_name',
    defaultLabel: 'ชื่อ - นามสกุล',
    description: 'ฟิลด์หลักสำหรับระบุตัวตนและออกเกียรติบัตร (บังคับเสมอ)',
    lockedEnabled: true,
    lockedRequired: true,
  },
  {
    key: 'position',
    defaultLabel: 'ตำแหน่ง',
    description: 'ตำแหน่งงานหรือบทบาทของผู้เข้าร่วม',
  },
  {
    key: 'organization',
    defaultLabel: 'สังกัด / หน่วยงาน',
    description: 'โรงเรียน วิทยาลัย หน่วยงาน หรือองค์กร',
  },
  {
    key: 'phone',
    defaultLabel: 'เบอร์โทรศัพท์',
    description: 'ใช้สำหรับเช็คชื่อหน้างานและค้นหาบัตรลงทะเบียน',
  },
  {
    key: 'email',
    defaultLabel: 'อีเมล',
    description: 'สำหรับติดต่อหรือส่งเอกสารเพิ่มเติม',
  },
  {
    key: 'citizen_id',
    defaultLabel: 'เลขประจำตัวประชาชน',
    description: 'เลขบัตร 13 หลัก (ใช้ตรวจสอบสิทธิ์หรือเช็คชื่อ)',
  },
];

export const DEFAULT_REGISTRATION_CONFIG: RegistrationFormConfig = {
  themeColorId: 'indigo',
  headerTitle: '',
  instructions: '',
  showCertificateSidebar: true,
  standardFields: {
    title_name: { enabled: true, required: false },
    full_name: { enabled: true, required: true },
    position: { enabled: true, required: false },
    organization: { enabled: true, required: false },
    phone: { enabled: true, required: true },
    email: { enabled: true, required: false },
    citizen_id: { enabled: false, required: false },
  },
  customFields: [],
};

export function normalizeRegistrationConfig(raw: any): RegistrationFormConfig {
  const src = raw && typeof raw === 'object' ? raw : {};
  const rawStd = src.standardFields && typeof src.standardFields === 'object' ? src.standardFields : {};

  const standardFields = { ...DEFAULT_REGISTRATION_CONFIG.standardFields };
  (Object.keys(DEFAULT_REGISTRATION_CONFIG.standardFields) as StandardFieldKey[]).forEach((key) => {
    const def = DEFAULT_REGISTRATION_CONFIG.standardFields[key];
    const incoming = rawStd[key];
    if (incoming && typeof incoming === 'object') {
      standardFields[key] = {
        enabled: key === 'full_name' ? true : Boolean(incoming.enabled),
        required: key === 'full_name' ? true : Boolean(incoming.required),
        label: typeof incoming.label === 'string' && incoming.label.trim() ? incoming.label.trim() : undefined,
      };
    } else {
      standardFields[key] = { ...def };
    }
  });

  const customFields: CustomRegistrationField[] = Array.isArray(src.customFields)
    ? src.customFields
        .filter((f: any) => f && typeof f === 'object' && f.id)
        .map((f: any) => ({
          id: String(f.id),
          label: String(f.label || 'คำถามเพิ่มเติม'),
          type: (['text', 'textarea', 'radio', 'select', 'checkbox'].includes(f.type) ? f.type : 'text') as CustomFieldType,
          required: Boolean(f.required),
          placeholder: typeof f.placeholder === 'string' ? f.placeholder : '',
          options: Array.isArray(f.options) ? f.options.map((o: any) => String(o)) : [],
        }))
    : [];

  return {
    themeColorId: typeof src.themeColorId === 'string' && src.themeColorId ? src.themeColorId : DEFAULT_REGISTRATION_CONFIG.themeColorId,
    headerTitle: typeof src.headerTitle === 'string' ? src.headerTitle : '',
    instructions: typeof src.instructions === 'string' ? src.instructions : '',
    showCertificateSidebar: src.showCertificateSidebar !== false,
    standardFields,
    customFields,
  };
}

export function getRegistrationTheme(themeColorId?: string): ColorOption {
  return (themeColorId && SURVEY_COLORS[themeColorId]) || SURVEY_COLORS.indigo;
}
