'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Award,
  Users,
  ClipboardList,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Search,
  Key,
  Star,
  ExternalLink,
  Layers,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Settings,
  Upload,
  ImageIcon,
  Palette,
  Type,
  RotateCcw,
  Check,
  Sliders,
} from 'lucide-react';
import {
  AVAILABLE_FONTS,
  COLOR_PRESETS,
  BORDER_RADIUS_OPTIONS,
  FONT_SIZE_OPTIONS,
  DEFAULT_THEME,
  applyThemeToDom,
} from '@/components/theme/ThemeProvider';
import { fetchApi } from '@/lib/api';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'certificates' | 'users' | 'surveys' | 'auth'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Upload States & Refs
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const sigInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  // --- TAB 1 & 2: System Settings State ---
  const [settings, setSettings] = useState<Record<string, string>>({
    org_name_th: '',
    org_name_en: '',
    org_address: '',
    org_phone: '',
    org_website: '',
    org_logo_url: '',
    default_cert_prefix: 'วอศ.ชร-2569',
    default_signatory_name: '',
    default_signatory_title: '',
    default_signature_img: '',
    default_font_family: 'sarabun',
    google_client_id: '',
    google_login_enabled: 'true',
    google_auto_register: 'true',
    // Theme Customization State
    theme_font_heading: 'Prompt',
    theme_font_body: 'Sarabun',
    theme_font_size: 'normal',
    theme_primary_color: '#1e3a8a',
    theme_accent_color: '#0d9488',
    theme_border_radius: 'soft',
  });

  // --- TAB 3: User Management State ---
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [syncingOrg, setSyncingOrg] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'ORGANIZER',
    position: '',
    organization: 'วิทยาลัยการอาชีพเวียงเชียงรุ้ง',
    is_active: true,
  });

  // --- TAB 4: Evaluation Templates State ---
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateFormData, setTemplateFormData] = useState<any>({
    title: '',
    description: '',
    category: 'GENERAL',
    target_responses: 50,
    is_default: false,
    is_active: true,
    theme_config: {
      primary_color: '#2563eb',
      background_pattern: 'subtle-dots',
    },
    sections: [
      {
        title: 'ตอนที่ 1 ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม',
        order_index: 0,
        questions: [
          {
            question_text: 'สถานะของผู้ตอบแบบประเมิน',
            question_type: 'RADIO',
            options: ['นักเรียน/นักศึกษา', 'ครู/อาจารย์', 'บุคลากรทางการศึกษา', 'ประชาชนทั่วไป'],
            is_required: true,
            order_index: 0,
          },
        ],
      },
      {
        title: 'ตอนที่ 2 ความพึงพอใจต่อการเข้าร่วมกิจกรรม',
        order_index: 1,
        questions: [
          {
            question_text: 'ความชัดเจนของเนื้อหาและวัตถุประสงค์ของโครงการ',
            question_type: 'RATING_5',
            is_required: true,
            order_index: 0,
          },
          {
            question_text: 'ความเหมาะสมของระยะเวลาและสถานที่ดำเนินงาน',
            question_type: 'RATING_5',
            is_required: true,
            order_index: 1,
          },
          {
            question_text: 'ประโยชน์ที่ได้รับจากการเข้าร่วมกิจกรรม',
            question_type: 'RATING_5',
            is_required: true,
            order_index: 2,
          },
          {
            question_text: 'ความพึงพอใจในภาพรวมต่อการจัดกิจกรรม',
            question_type: 'RATING_5',
            is_required: true,
            order_index: 3,
          },
        ],
      },
      {
        title: 'ตอนที่ 3 ข้อเสนอแนะเพิ่มเติม',
        order_index: 2,
        questions: [
          {
            question_text: 'ข้อเสนอแนะสำหรับการจัดกิจกรรมในครั้งต่อไป',
            question_type: 'TEXT',
            is_required: false,
            order_index: 0,
          },
        ],
      },
    ],
  });

  // Check auth and permissions
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') {
        alert('เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถเข้าถึงหน้านี้ได้');
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    loadAllAdminData();
  }, [router]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [settingsRes, usersRes, templatesRes] = await Promise.all([
        fetchApi('/api/v1/admin/settings'),
        fetchApi('/api/v1/admin/users'),
        fetchApi('/api/v1/admin/evaluation-templates'),
      ]);

      if (settingsRes.success) setSettings(settingsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'ไม่สามารถโหลดข้อมูลระบบได้');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE SYSTEM SETTINGS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchApi('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (res.success) {
        showToast('success', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('system-brand-updated', { detail: settings.org_logo_url }));
          window.dispatchEvent(
            new CustomEvent('theme-updated', {
              detail: {
                theme_font_heading: settings.theme_font_heading || 'Prompt',
                theme_font_body: settings.theme_font_body || 'Sarabun',
                theme_font_size: settings.theme_font_size || 'normal',
                theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                theme_accent_color: settings.theme_accent_color || '#0d9488',
                theme_border_radius: settings.theme_border_radius || 'soft',
              },
            })
          );
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  const handleResetThemeDefaults = () => {
    const defaultThemeObj = {
      theme_font_heading: DEFAULT_THEME.theme_font_heading,
      theme_font_body: DEFAULT_THEME.theme_font_body,
      theme_font_size: DEFAULT_THEME.theme_font_size,
      theme_primary_color: DEFAULT_THEME.theme_primary_color,
      theme_accent_color: DEFAULT_THEME.theme_accent_color,
      theme_border_radius: DEFAULT_THEME.theme_border_radius,
    };
    setSettings((prev) => ({
      ...prev,
      ...defaultThemeObj,
    }));
    applyThemeToDom({
      ...DEFAULT_THEME,
      ...defaultThemeObj,
    });
    showToast('success', 'คืนค่ารูปแบบและธีมเริ่มต้นเรียบร้อยแล้ว (กดบันทึกเพื่อนำไปใช้งานถาวร)');
  };

  // --- FILE UPLOAD HANDLERS ---
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setUploadingLogo(true);
    try {
      const res = await fetchApi('/api/v1/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.data?.file_url) {
        setSettings((prev) => ({ ...prev, org_logo_url: res.data.file_url }));
        showToast('success', 'อัปโหลดไฟล์โลโก้องค์กรสำเร็จ');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('system-brand-updated', { detail: res.data.file_url }));
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์โลโก้');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSigFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('signature', file);

    setUploadingSig(true);
    try {
      const res = await fetchApi('/api/v1/admin/upload-signature', {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.data?.file_url) {
        setSettings((prev) => ({ ...prev, default_signature_img: res.data.file_url }));
        showToast('success', 'อัปโหลดไฟล์ลายเซ็นดิจิทัลสำเร็จ');
      }
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น');
    } finally {
      setUploadingSig(false);
      if (sigInputRef.current) sigInputRef.current.value = '';
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleSyncOrgToAllUsers = async () => {
    const orgName = settings.org_name_th?.trim();
    if (!orgName) {
      showToast('error', 'กรุณาระบุชื่อองค์กร/สถาบันก่อนดำเนินการ');
      return;
    }

    if (!confirm(`ต้องการซิงค์ชื่อสังกัด '${orgName}' ให้กับผู้ใช้งานทั้งหมดในระบบหรือไม่?`)) {
      return;
    }

    setSyncingOrg(true);
    try {
      const res = await fetchApi('/api/v1/admin/sync-organization', {
        method: 'POST',
      });
      if (res.success) {
        showToast('success', res.message || 'ซิงค์ชื่อสังกัดสำเร็จ');
        refreshUsers();
      } else {
        showToast('error', res.message || 'ไม่สามารถซิงค์ชื่อสังกัดได้');
      }
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการซิงค์ชื่อสังกัด');
    } finally {
      setSyncingOrg(false);
    }
  };

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'ORGANIZER',
      position: '',
      organization: settings.org_name_th || 'วิทยาลัยการอาชีพเวียงเชียงรุ้ง',
      is_active: true,
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: '', // blank unless updating
      full_name: user.full_name,
      email: user.email || '',
      role: user.role,
      position: user.position || '',
      organization: user.organization || '',
      is_active: user.is_active,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          full_name: userFormData.full_name,
          email: userFormData.email || null,
          role: userFormData.role,
          position: userFormData.position || null,
          organization: userFormData.organization || null,
          is_active: userFormData.is_active,
        };
        if (userFormData.password.trim()) {
          payload.password = userFormData.password.trim();
        }

        const res = await fetchApi(`/api/v1/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (res.success) {
          showToast('success', 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
          setUserModalOpen(false);
          refreshUsers();
        }
      } else {
        // Create user
        const res = await fetchApi('/api/v1/admin/users', {
          method: 'POST',
          body: JSON.stringify(userFormData),
        });

        if (res.success) {
          showToast('success', 'สร้างบัญชีผู้ใช้งานใหม่เรียบร้อยแล้ว');
          setUserModalOpen(false);
          refreshUsers();
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'บันทึกข้อมูลผู้ใช้งานไม่สำเร็จ');
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    try {
      const res = await fetchApi(`/api/v1/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.success) {
        showToast('success', `เปลี่ยนสถานะเป็น ${!user.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} แล้ว`);
        refreshUsers();
      }
    } catch (err: any) {
      showToast('error', err.message || 'เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`ยืนยันการลบผู้ใช้ "${user.full_name}" (@${user.username}) หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      const res = await fetchApi(`/api/v1/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('success', 'ลบผู้ใช้งานสำเร็จ');
        refreshUsers();
      }
    } catch (err: any) {
      showToast('error', err.message || 'ไม่สามารถลบผู้ใช้งานได้');
    }
  };

  const refreshUsers = async () => {
    try {
      const res = await fetchApi('/api/v1/admin/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- TEMPLATE MANAGEMENT HANDLERS ---
  const openCreateTemplateModal = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      title: 'แบบประเมินความพึงพอใจการจัดโครงการ',
      description: 'กรุณาประเมินความพึงพอใจเพื่อนำผลไปพัฒนาการจัดกิจกรรมต่อไป',
      category: 'GENERAL',
      target_responses: 50,
      is_default: false,
      is_active: true,
      theme_config: { primary_color: '#2563eb' },
      sections: [
        {
          title: 'ตอนที่ 1 ข้อมูลทั่วไป',
          order_index: 0,
          questions: [
            {
              question_text: 'สถานะของผู้ตอบแบบประเมิน',
              question_type: 'RADIO',
              options: ['นักเรียน/นักศึกษา', 'ครู/อาจารย์', 'บุคลากรภายนอก'],
              is_required: true,
              order_index: 0,
            },
          ],
        },
        {
          title: 'ตอนที่ 2 ความพึงพอใจในกิจกรรม',
          order_index: 1,
          questions: [
            { question_text: 'ความพึงพอใจในหัวข้อและเนื้อหาการอบรม', question_type: 'RATING_5', is_required: true, order_index: 0 },
            { question_text: 'ความพร้อมของสถานที่และอุปกรณ์', question_type: 'RATING_5', is_required: true, order_index: 1 },
            { question_text: 'การนำความรู้ไปประยุกต์ใช้ประโยชน์', question_type: 'RATING_5', is_required: true, order_index: 2 },
          ],
        },
        {
          title: 'ตอนที่ 3 ข้อคิดเห็นและข้อเสนอแนะ',
          order_index: 2,
          questions: [
            { question_text: 'ข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุง', question_type: 'TEXT', is_required: false, order_index: 0 },
          ],
        },
      ],
    });
    setTemplateModalOpen(true);
  };

  const openEditTemplateModal = (tpl: any) => {
    setEditingTemplate(tpl);
    setTemplateFormData({
      title: tpl.title,
      description: tpl.description || '',
      category: tpl.category || 'GENERAL',
      target_responses: tpl.target_responses || 50,
      is_default: tpl.is_default,
      is_active: tpl.is_active,
      theme_config: tpl.theme_config || { primary_color: '#2563eb' },
      sections: Array.isArray(tpl.sections) ? tpl.sections : [],
    });
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormData.title.trim()) {
      showToast('error', 'กรุณาระบุชื่อแม่แบบ');
      return;
    }

    try {
      if (editingTemplate) {
        const res = await fetchApi(`/api/v1/admin/evaluation-templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(templateFormData),
        });
        if (res.success) {
          showToast('success', 'บันทึกการแก้ไขแม่แบบสำเร็จ');
          setTemplateModalOpen(false);
          refreshTemplates();
        }
      } else {
        const res = await fetchApi('/api/v1/admin/evaluation-templates', {
          method: 'POST',
          body: JSON.stringify(templateFormData),
        });
        if (res.success) {
          showToast('success', 'สร้างแม่แบบแบบประเมินเรียบร้อยแล้ว');
          setTemplateModalOpen(false);
          refreshTemplates();
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'บันทึกแม่แบบไม่สำเร็จ');
    }
  };

  const handleSetDefaultTemplate = async (tpl: any) => {
    try {
      const res = await fetchApi(`/api/v1/admin/evaluation-templates/${tpl.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_default: true }),
      });
      if (res.success) {
        showToast('success', `ตั้ง "${tpl.title}" เป็นแม่แบบเริ่มต้นเรียบร้อยแล้ว`);
        refreshTemplates();
      }
    } catch (err: any) {
      showToast('error', err.message || 'ไม่สามารถตั้งค่าได้');
    }
  };

  const handleDeleteTemplate = async (tpl: any) => {
    if (!confirm(`ยืนยันการลบแม่แบบ "${tpl.title}" หรือไม่?`)) return;

    try {
      const res = await fetchApi(`/api/v1/admin/evaluation-templates/${tpl.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast('success', 'ลบแม่แบบเรียบร้อยแล้ว');
        refreshTemplates();
      }
    } catch (err: any) {
      showToast('error', err.message || 'ไม่สามารถลบแม่แบบได้');
    }
  };

  const refreshTemplates = async () => {
    try {
      const res = await fetchApi('/api/v1/admin/evaluation-templates');
      if (res.success) setTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for Section Builder
  const addSection = () => {
    setTemplateFormData({
      ...templateFormData,
      sections: [
        ...templateFormData.sections,
        {
          title: `ตอนที่ ${templateFormData.sections.length + 1} หัวข้อแบบประเมิน`,
          order_index: templateFormData.sections.length,
          questions: [
            {
              question_text: 'หัวข้อประเมิน 1',
              question_type: 'RATING_5',
              is_required: true,
              order_index: 0,
            },
          ],
        },
      ],
    });
  };

  const removeSection = (sIdx: number) => {
    const updated = templateFormData.sections.filter((_: any, idx: number) => idx !== sIdx);
    setTemplateFormData({ ...templateFormData, sections: updated });
  };

  const updateSectionTitle = (sIdx: number, title: string) => {
    const updated = [...templateFormData.sections];
    updated[sIdx].title = title;
    setTemplateFormData({ ...templateFormData, sections: updated });
  };

  const addQuestion = (sIdx: number) => {
    const updated = [...templateFormData.sections];
    const qCount = updated[sIdx].questions?.length || 0;
    if (!updated[sIdx].questions) updated[sIdx].questions = [];
    updated[sIdx].questions.push({
      question_text: `คำถามข้อที่ ${qCount + 1}`,
      question_type: 'RATING_5',
      is_required: true,
      order_index: qCount,
    });
    setTemplateFormData({ ...templateFormData, sections: updated });
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    const updated = [...templateFormData.sections];
    updated[sIdx].questions = updated[sIdx].questions.filter((_: any, idx: number) => idx !== qIdx);
    setTemplateFormData({ ...templateFormData, sections: updated });
  };

  const updateQuestion = (sIdx: number, qIdx: number, field: string, val: any) => {
    const updated = [...templateFormData.sections];
    updated[sIdx].questions[qIdx][field] = val;
    setTemplateFormData({ ...templateFormData, sections: updated });
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.position?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">กำลังโหลดข้อมูลระบบผู้ดูแล...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full w-fit mb-2 border border-blue-200/60">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
            {currentUser && (
              <span className="text-slate-500 font-medium pl-1 border-l border-blue-200 inline-flex items-center gap-1.5">
                {currentUser.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name || currentUser.username}
                    className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span>ผู้ดูแล: <strong className="text-blue-900 font-bold">{currentUser.full_name || currentUser.username}</strong></span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
            <span>การตั้งค่าระบบส่วนกลาง</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            กำหนดค่ามาตรฐานของสถาบัน จัดการบัญชีผู้จัดโครงการ และคลังแม่แบบแบบประเมินกลาง
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 hover:text-slate-900 transition shadow-xs w-full sm:w-auto shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปยังแดชบอร์ด</span>
        </Link>
      </div>

      {/* Navigation Tabs (Mobile Horizontal Scrollable) */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>ข้อมูลสถาบัน/องค์กร</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span>ธีม & การแสดงผล</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>ค่าเริ่มต้นเกียรติบัตร</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>จัดการผู้ใช้งาน</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'users' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('surveys')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'surveys'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>คลังแม่แบบแบบประเมิน</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'surveys' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth')}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'auth'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4 shrink-0" />
          <span>ระบบ Google SSO</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ORGANIZATION PROFILE                             */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">ข้อมูลองค์กรและสถาบัน</h2>
                <p className="text-xs text-slate-500">
                  ข้อมูลนี้จะถูกนำไปใช้เป็นค่าตั้งต้นในระบบลงทะเบียน แบบประเมิน และหัวรายงาน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ชื่อองค์กร / สถาบัน (ภาษาไทย) *
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncOrgToAllUsers}
                    disabled={syncingOrg}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer disabled:opacity-50"
                    title="อัปเดตชื่อสังกัดของผู้ใช้งานทุกคนในระบบให้เป็นชื่อสถาบันนี้"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingOrg ? 'animate-spin' : ''}`} />
                    <span>{syncingOrg ? 'กำลังซิงค์...' : 'ซิงค์ชื่อสังกัดให้ผู้ใช้งานทั้งหมด'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={settings.org_name_th || ''}
                  onChange={(e) => setSettings({ ...settings, org_name_th: e.target.value })}
                  placeholder="เช่น วิทยาลัยการอาชีพเวียงเชียงรุ้ง"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ชื่อองค์กร / สถาบัน (English)
                </label>
                <input
                  type="text"
                  value={settings.org_name_en || ''}
                  onChange={(e) => setSettings({ ...settings, org_name_en: e.target.value })}
                  placeholder="e.g. Chiang Rai Vocational College"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ที่อยู่สถาบัน
                </label>
                <textarea
                  rows={2}
                  value={settings.org_address || ''}
                  onChange={(e) => setSettings({ ...settings, org_address: e.target.value })}
                  placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  value={settings.org_phone || ''}
                  onChange={(e) => setSettings({ ...settings, org_phone: e.target.value })}
                  placeholder="เช่น 053-711580"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  เว็บไซต์สถาบัน
                </label>
                <input
                  type="url"
                  value={settings.org_website || ''}
                  onChange={(e) => setSettings({ ...settings, org_website: e.target.value })}
                  placeholder="https://www.crvc.ac.th"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  โลโก้สถาบัน / องค์กร (Organization Logo)
                </label>

                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  {/* Preview Box */}
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden relative group shadow-xs">
                    {settings.org_logo_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={settings.org_logo_url}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, org_logo_url: '' })}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-bold transition rounded-xl cursor-pointer"
                          title="ลบโลโก้"
                        >
                          <Trash2 className="w-4 h-4 mb-1 text-rose-400" />
                          <span>ลบออก</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-7 h-7 mx-auto mb-1 stroke-1 text-slate-300" />
                        <span className="text-[10px] font-bold block">ไม่มีโลโก้</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls & URL */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์โลโก้ (PNG, JPG, WEBP, SVG)'}</span>
                      </button>

                      {settings.org_logo_url && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, org_logo_url: '' })}
                          className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        >
                          ลบรูปโลโก้
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">ที่อยู่ไฟล์ (URL):</span>
                      <input
                        type="text"
                        value={settings.org_logo_url || ''}
                        onChange={(e) => setSettings({ ...settings, org_logo_url: e.target.value })}
                        placeholder="https://... หรือ /storage/logos/..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs font-mono"
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      คำแนะนำ: ไฟล์ PNG หรือ SVG พื้นหลังโปร่งใส (Transparent) ขนาดไม่เกิน 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลองค์กร'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB: THEME & APPEARANCE (FULL CUSTOM)                    */}
      {/* ======================================================== */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section: Live Preview Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">ตัวอย่างการแสดงผลแบบ Real-time (Live Preview)</h2>
                  <p className="text-xs text-slate-500">
                    จำลองหน้าตา องค์ประกอบ แบบอักษร และสีหลักตามค่าที่ท่านกำลังปรับแต่งด้านล่าง
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetThemeDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
              </div>
            </div>

            {/* Preview Canvas Container */}
            <div
              className="p-6 sm:p-8 bg-slate-50 border border-slate-200/80 shadow-inner space-y-6 transition-all duration-200"
              style={{
                borderRadius:
                  settings.theme_border_radius === 'sharp'
                    ? '6px'
                    : settings.theme_border_radius === 'rounded'
                    ? '20px'
                    : '12px',
              }}
            >
              {/* Preview Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span
                    className="inline-block px-2.5 py-1 text-xs font-bold text-white mb-2 shadow-xs transition-all"
                    style={{
                      backgroundColor: settings.theme_primary_color || '#1e3a8a',
                      borderRadius:
                        settings.theme_border_radius === 'sharp'
                          ? '4px'
                          : settings.theme_border_radius === 'rounded'
                          ? '9999px'
                          : '8px',
                    }}
                  >
                    ตัวอย่างป้ายสถานะ
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-black text-slate-900 leading-snug transition-all"
                    style={{
                      fontFamily: (AVAILABLE_FONTS.find((f) => f.id === settings.theme_font_heading) || AVAILABLE_FONTS[0]).family,
                    }}
                  >
                    ระบบลงทะเบียน ออกเกียรติบัตร และประเมินความพึงพอใจ
                  </h3>
                  <p
                    className="text-slate-600 mt-2 max-w-2xl leading-relaxed transition-all"
                    style={{
                      fontFamily: (AVAILABLE_FONTS.find((f) => f.id === settings.theme_font_body) || AVAILABLE_FONTS[1]).family,
                      fontSize:
                        settings.theme_font_size === 'large'
                          ? '17px'
                          : settings.theme_font_size === 'extra-large'
                          ? '18px'
                          : '16px',
                    }}
                  >
                    {settings.org_name_th || 'วิทยาลัยอาชีวศึกษาเชียงราย'} มุ่งมั่นพัฒนาระบบเทคโนโลยีสารสนเทศเพื่อการบริการและการศึกษา ยกระดับการจัดกิจกรรมอบรมสัมมนาและการออกเกียรติบัตรอิเล็กทรอนิกส์ที่ได้มาตรฐานความปลอดภัย
                  </p>
                </div>

                <div
                  className="p-4 bg-white border border-slate-200/80 shadow-xs flex flex-col items-center justify-center min-w-[140px]"
                  style={{
                    borderRadius:
                      settings.theme_border_radius === 'sharp'
                        ? '6px'
                        : settings.theme_border_radius === 'rounded'
                        ? '16px'
                        : '10px',
                  }}
                >
                  <div className="text-[11px] font-bold text-slate-400">สถิติผู้เข้าร่วม</div>
                  <div
                    className="text-2xl font-black mt-0.5"
                    style={{ color: settings.theme_primary_color || '#1e3a8a' }}
                  >
                    1,250
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">รับเกียรติบัตรแล้ว</div>
                </div>
              </div>

              {/* Preview UI Elements (Buttons, Inputs, Chips) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                {/* Primary Button */}
                <button
                  type="button"
                  className="w-full py-2.5 px-4 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-default"
                  style={{
                    backgroundColor: settings.theme_primary_color || '#1e3a8a',
                    borderRadius:
                      settings.theme_border_radius === 'sharp'
                        ? '6px'
                        : settings.theme_border_radius === 'rounded'
                        ? '9999px'
                        : '10px',
                  }}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>ปุ่มหลัก (Primary Button)</span>
                </button>

                {/* Accent Button */}
                <button
                  type="button"
                  className="w-full py-2.5 px-4 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-default"
                  style={{
                    backgroundColor: settings.theme_accent_color || '#0d9488',
                    borderRadius:
                      settings.theme_border_radius === 'sharp'
                        ? '6px'
                        : settings.theme_border_radius === 'rounded'
                        ? '9999px'
                        : '10px',
                  }}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>ปุ่มรอง (Accent Button)</span>
                </button>

                {/* Outline Button */}
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-white border font-bold text-xs sm:text-sm shadow-2xs transition flex items-center justify-center gap-2 cursor-default"
                  style={{
                    borderColor: settings.theme_primary_color || '#1e3a8a',
                    color: settings.theme_primary_color || '#1e3a8a',
                    borderRadius:
                      settings.theme_border_radius === 'sharp'
                        ? '6px'
                        : settings.theme_border_radius === 'rounded'
                        ? '9999px'
                        : '10px',
                  }}
                >
                  <span>ปุ่มเส้นขอบ (Outline)</span>
                </button>

                {/* Sample Input */}
                <div
                  className="bg-white border px-3 py-2 text-xs text-slate-500 shadow-2xs flex items-center justify-between"
                  style={{
                    borderColor: settings.theme_primary_color || '#1e3a8a',
                    borderRadius:
                      settings.theme_border_radius === 'sharp'
                        ? '6px'
                        : settings.theme_border_radius === 'rounded'
                        ? '9999px'
                        : '10px',
                  }}
                >
                  <span>ช่องกรอกข้อมูลตัวอย่าง...</span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: settings.theme_primary_color || '#1e3a8a' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Typography (Font Configuration) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">1. การตั้งค่าแบบอักษร (Typography & Fonts)</h2>
                <p className="text-xs text-slate-500">
                  เลือกแบบอักษรภาษาไทยยอดนิยมสำหรับหัวข้อและเนื้อหา พร้อมปรับสเกลขนาดตัวอักษรของระบบ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heading Font */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ฟอนต์หัวเรื่อง (Heading Font) *
                </label>
                <p className="text-[11px] text-slate-400">ใช้สำหรับหัวข้อหลัก หัวข้อย่อย ป้ายชื่อ และแถบเมนูนำทาง</p>
                <select
                  value={settings.theme_font_heading || 'Prompt'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((prev) => ({ ...prev, theme_font_heading: val }));
                    applyThemeToDom({
                      theme_font_heading: val,
                      theme_font_body: settings.theme_font_body || 'Sarabun',
                      theme_font_size: (settings.theme_font_size as any) || 'normal',
                      theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                      theme_accent_color: settings.theme_accent_color || '#0d9488',
                      theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Body Font */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ฟอนต์เนื้อหาทั่วไป (Body Font) *
                </label>
                <p className="text-[11px] text-slate-400">ใช้สำหรับเนื้อหาบรรยาย คำอธิบาย ตาราง และข้อความทั่วไป</p>
                <select
                  value={settings.theme_font_body || 'Sarabun'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((prev) => ({ ...prev, theme_font_body: val }));
                    applyThemeToDom({
                      theme_font_heading: settings.theme_font_heading || 'Prompt',
                      theme_font_body: val,
                      theme_font_size: (settings.theme_font_size as any) || 'normal',
                      theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                      theme_accent_color: settings.theme_accent_color || '#0d9488',
                      theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font Size Scaling */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ขนาดตัวอักษรพื้นฐาน (Base Font Size)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      settings.theme_font_size === opt.id || (!settings.theme_font_size && opt.id === 'normal')
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme_font_size"
                      value={opt.id}
                      checked={settings.theme_font_size === opt.id || (!settings.theme_font_size && opt.id === 'normal')}
                      onChange={() => {
                        setSettings((prev) => ({ ...prev, theme_font_size: opt.id }));
                        applyThemeToDom({
                          theme_font_heading: settings.theme_font_heading || 'Prompt',
                          theme_font_body: settings.theme_font_body || 'Sarabun',
                          theme_font_size: opt.id as any,
                          theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                          theme_accent_color: settings.theme_accent_color || '#0d9488',
                          theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                        });
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold">{opt.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Color Presets & Custom Colors */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">2. ชุดสีและโทนสีของระบบ (Color Theme)</h2>
                <p className="text-xs text-slate-500">
                  เลือกชุดสีแนะนำสำเร็จรูป หรือระบุรหัสสีหลัก (Primary) และสีรอง (Accent) ได้เองตามเอกลักษณ์สถาบัน
                </p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ชุดสีแนะนำสำเร็จรูป (Color Presets)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    settings.theme_primary_color?.toLowerCase() === preset.primary.toLowerCase() &&
                    settings.theme_accent_color?.toLowerCase() === preset.accent.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          theme_primary_color: preset.primary,
                          theme_accent_color: preset.accent,
                        }));
                        applyThemeToDom({
                          theme_font_heading: settings.theme_font_heading || 'Prompt',
                          theme_font_body: settings.theme_font_body || 'Sarabun',
                          theme_font_size: (settings.theme_font_size as any) || 'normal',
                          theme_primary_color: preset.primary,
                          theme_accent_color: preset.accent,
                          theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                        });
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full shadow-xs border border-white"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span
                            className="w-5 h-5 rounded-full shadow-xs border border-white -ml-2"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            ใช้งานอยู่
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{preset.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{preset.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                กำหนดรหัสสีเองอย่างอิสระ (Custom Hex Colors)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Primary Color */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">สีหลัก (Primary Brand Color)</span>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: settings.theme_primary_color || '#1e3a8a' }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.theme_primary_color || '#1e3a8a'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings((prev) => ({ ...prev, theme_primary_color: val }));
                        applyThemeToDom({
                          theme_font_heading: settings.theme_font_heading || 'Prompt',
                          theme_font_body: settings.theme_font_body || 'Sarabun',
                          theme_font_size: (settings.theme_font_size as any) || 'normal',
                          theme_primary_color: val,
                          theme_accent_color: settings.theme_accent_color || '#0d9488',
                          theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                        });
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={settings.theme_primary_color || '#1e3a8a'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings((prev) => ({ ...prev, theme_primary_color: val }));
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          applyThemeToDom({
                            theme_font_heading: settings.theme_font_heading || 'Prompt',
                            theme_font_body: settings.theme_font_body || 'Sarabun',
                            theme_font_size: (settings.theme_font_size as any) || 'normal',
                            theme_primary_color: val,
                            theme_accent_color: settings.theme_accent_color || '#0d9488',
                            theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                          });
                        }
                      }}
                      placeholder="#1e3a8a"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">สีรอง (Accent Secondary Color)</span>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: settings.theme_accent_color || '#0d9488' }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.theme_accent_color || '#0d9488'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings((prev) => ({ ...prev, theme_accent_color: val }));
                        applyThemeToDom({
                          theme_font_heading: settings.theme_font_heading || 'Prompt',
                          theme_font_body: settings.theme_font_body || 'Sarabun',
                          theme_font_size: (settings.theme_font_size as any) || 'normal',
                          theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                          theme_accent_color: val,
                          theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                        });
                      }}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={settings.theme_accent_color || '#0d9488'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings((prev) => ({ ...prev, theme_accent_color: val }));
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          applyThemeToDom({
                            theme_font_heading: settings.theme_font_heading || 'Prompt',
                            theme_font_body: settings.theme_font_body || 'Sarabun',
                            theme_font_size: (settings.theme_font_size as any) || 'normal',
                            theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                            theme_accent_color: val,
                            theme_border_radius: (settings.theme_border_radius as any) || 'soft',
                          });
                        }
                      }}
                      placeholder="#0d9488"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Border Radius (ความโค้งมน) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">3. ความโค้งมนขององค์ประกอบ (Border Radius)</h2>
                <p className="text-xs text-slate-500">
                  กำหนดรูปแบบความโค้งมนของมุมการ์ด กล่องข้อความ และปุ่มทั่วทั้งระบบ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BORDER_RADIUS_OPTIONS.map((opt) => {
                const isSelected =
                  settings.theme_border_radius === opt.id || (!settings.theme_border_radius && opt.id === 'soft');
                return (
                  <label
                    key={opt.id}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500 text-blue-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.name}</span>
                      <input
                        type="radio"
                        name="theme_border_radius"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => {
                          setSettings((prev) => ({ ...prev, theme_border_radius: opt.id }));
                          applyThemeToDom({
                            theme_font_heading: settings.theme_font_heading || 'Prompt',
                            theme_font_body: settings.theme_font_body || 'Sarabun',
                            theme_font_size: (settings.theme_font_size as any) || 'normal',
                            theme_primary_color: settings.theme_primary_color || '#1e3a8a',
                            theme_accent_color: settings.theme_accent_color || '#0d9488',
                            theme_border_radius: opt.id as any,
                          });
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    {/* Visual representation box */}
                    <div
                      className="h-10 bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 font-mono"
                      style={{
                        borderRadius: opt.value,
                      }}
                    >
                      ขอบ {opt.value}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetThemeDefaults}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition w-full sm:w-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>คืนค่ารูปแบบเริ่มต้น</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าธีม & รูปแบบ'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CERTIFICATE DEFAULTS                             */}
      {/* ======================================================== */}
      {activeTab === 'certificates' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">ค่าเริ่มต้นการออกเกียรติบัตร</h2>
                <p className="text-xs text-slate-500">
                  ค่าเหล่านี้จะถูกนำไปใช้เป็นค่าตั้งต้นอัตโนมัติเมื่อผู้จัดสร้างกิจกรรมใหม่
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  รหัส Prefix เลขที่เกียรติบัตรเริ่มต้น *
                </label>
                <input
                  type="text"
                  required
                  value={settings.default_cert_prefix || ''}
                  onChange={(e) => setSettings({ ...settings, default_cert_prefix: e.target.value })}
                  placeholder="เช่น วอศ.ชร-2569"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  รูปแบบผลลัพธ์: {settings.default_cert_prefix || 'วอศ.ชร-2569'}/0001
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  แบบอักษรเริ่มต้น (Default Font Family)
                </label>
                <select
                  value={settings.default_font_family || 'sarabun'}
                  onChange={(e) => setSettings({ ...settings, default_font_family: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium bg-white"
                >
                  <option value="sarabun">TH Sarabun New / Sarabun (ทางการ)</option>
                  <option value="prompt">Prompt (ทันสมัย / กึ่งทางการ)</option>
                  <option value="kanit">Kanit (โมเดิร์น โดดเด่น)</option>
                  <option value="charm">Charm / Charmonman (ตัวเขียนลายมือ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ชื่อ-สกุล ผู้มีอำนาจลงนามกลาง (Signatory Name)
                </label>
                <input
                  type="text"
                  value={settings.default_signatory_name || ''}
                  onChange={(e) => setSettings({ ...settings, default_signatory_name: e.target.value })}
                  placeholder="เช่น นายอรรถการ ตฤษณารังสี"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ตำแหน่งผู้ลงนาม (Signatory Title)
                </label>
                <input
                  type="text"
                  value={settings.default_signatory_title || ''}
                  onChange={(e) => setSettings({ ...settings, default_signatory_title: e.target.value })}
                  placeholder="เช่น ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  รูปลายเซ็นดิจิทัลเริ่มต้น (Default Digital Signature)
                </label>

                <input
                  type="file"
                  ref={sigInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSigFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  {/* Signature Preview Box */}
                  <div className="w-36 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center p-2 shrink-0 overflow-hidden relative group shadow-xs">
                    {settings.default_signature_img ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={settings.default_signature_img}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, default_signature_img: '' })}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-bold transition rounded-xl cursor-pointer"
                          title="ลบลายเซ็น"
                        >
                          <Trash2 className="w-4 h-4 mb-1 text-rose-400" />
                          <span>ลบออก</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-400">
                        <Award className="w-6 h-6 mx-auto mb-1 stroke-1 text-slate-300" />
                        <span className="text-[10px] font-bold block">ไม่มีลายเซ็น</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls & URL */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => sigInputRef.current?.click()}
                        disabled={uploadingSig}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingSig ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปลายเซ็น (PNG, JPG, WEBP)'}</span>
                      </button>

                      {settings.default_signature_img && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, default_signature_img: '' })}
                          className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        >
                          ลบลายเซ็น
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">ที่อยู่ไฟล์ (URL / Base64):</span>
                      <input
                        type="text"
                        value={settings.default_signature_img || ''}
                        onChange={(e) => setSettings({ ...settings, default_signature_img: e.target.value })}
                        placeholder="https://... หรือ /storage/signatures/..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 text-xs font-mono"
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      คำแนะนำ: ไฟล์ PNG ลายเซ็นพื้นหลังโปร่งใส (Transparent) ขนาดไม่เกิน 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกค่าเริ่มต้นเกียรติบัตร'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 3: USER MANAGEMENT                                  */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล, อีเมล..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSyncOrgToAllUsers}
                disabled={syncingOrg}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0"
                title="อัปเดตชื่อสังกัดของผู้ใช้งานทุกคนให้เป็นชื่อสถาบันปัจจุบันของระบบ"
              >
                <Building2 className={`w-4 h-4 text-slate-500 ${syncingOrg ? 'animate-spin' : ''}`} />
                <span>{syncingOrg ? 'กำลังซิงค์...' : 'ซิงค์สังกัดให้ทุกคน'}</span>
              </button>

              <button
                type="button"
                onClick={openCreateUserModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มผู้ใช้งานใหม่</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">ผู้ใช้งาน</th>
                    <th className="py-3.5 px-4">อีเมล</th>
                    <th className="py-3.5 px-4">สังกัด / ตำแหน่ง</th>
                    <th className="py-3.5 px-4">สิทธิ์การใช้งาน (Role)</th>
                    <th className="py-3.5 px-4 text-center">กิจกรรม</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-6 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900">{u.full_name}</div>
                            <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-medium">
                            {u.email || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-slate-800 font-medium text-xs">
                              {u.position || 'ผู้จัดกิจกรรม'}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.organization || '-'}</div>
                          </td>
                          <td className="py-4 px-4">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                <Shield className="w-3 h-3" /> ผู้ดูแลระบบ (ADMIN)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                                <Users className="w-3 h-3" /> ผู้จัด (ORGANIZER)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-bold text-slate-700">{u._count?.events || 0}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isSelf}
                              title={isSelf ? 'ไม่สามารถปิดการใช้งานบัญชีตนเองได้' : 'คลิกเพื่อสลับสถานะ'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                                u.is_active
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {u.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                                title="แก้ไขข้อมูลผู้ใช้"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="ลบผู้ใช้งาน"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: EVALUATION TEMPLATES                             */}
      {/* ======================================================== */}
      {activeTab === 'surveys' && (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">คลังแม่แบบแบบประเมินส่วนกลาง</h2>
              <p className="text-xs text-slate-500">
                แม่แบบเหล่านี้จะปรากฏให้ผู้จัดเลือกใช้เป็น Preset ทันทีเมื่อสร้างกิจกรรมใหม่
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateTemplateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างแม่แบบใหม่</span>
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                ยังไม่มีแม่แบบแบบประเมินในระบบ กรุณากดปุ่มสร้างแม่แบบใหม่
              </div>
            ) : (
              templates.map((tpl) => {
                const sectionsList = Array.isArray(tpl.sections) ? tpl.sections : [];
                const totalQuestions = sectionsList.reduce(
                  (sum: number, s: any) => sum + (s.questions?.length || 0),
                  0
                );

                return (
                  <div
                    key={tpl.id}
                    className={`bg-white rounded-3xl border ${
                      tpl.is_default ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-slate-200/90'
                    } shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tpl.category || 'GENERAL'}
                        </span>
                        {tpl.is_default && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> แม่แบบเริ่มต้น
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">{tpl.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {tpl.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>

                      <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>{sectionsList.length} ตอน</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                          <span>{totalQuestions} ข้อคำถาม</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!tpl.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultTemplate(tpl)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                        >
                          ตั้งเป็นค่าเริ่มต้น
                        </button>
                      )}
                      {tpl.is_default && <span className="text-xs font-medium text-slate-400">ค่าเริ่มต้นปัจจุบัน</span>}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditTemplateModal(tpl)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                          title="แก้ไขแม่แบบ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="ลบแม่แบบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: GOOGLE SSO & AUTHENTICATION                      */}
      {/* ======================================================== */}
      {activeTab === 'auth' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">การตั้งค่า Google SSO (Single Sign-On)</h2>
                <p className="text-xs text-slate-500">
                  กำหนดค่าการเข้าสู่ระบบด้วยบัญชี Google เพื่อให้ผู้จัดกิจกรรมสามารถล็อกอินได้อย่างสะดวกรวดเร็ว
                </p>
              </div>
            </div>

            <div className="space-y-6 w-full">
              {/* Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enable / Disable */}
                <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="pr-4">
                    <div className="text-sm font-bold text-slate-900">เปิดใช้งานการเข้าสู่ระบบด้วย Google</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      แสดงปุ่ม &quot;เข้าสู่ระบบด้วย Google&quot; ในหน้า Login
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.google_login_enabled !== 'false'}
                      onChange={(e) =>
                        setSettings({ ...settings, google_login_enabled: e.target.checked ? 'true' : 'false' })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Auto Register */}
                <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="pr-4">
                    <div className="text-sm font-bold text-slate-900">ลงทะเบียนผู้จัดใหม่อัตโนมัติ (Auto Register)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      สร้างบัญชีผู้จัด (ORGANIZER) ให้อัตโนมัติเมื่อผู้ใช้ล็อกอินด้วย Google ครั้งแรก
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.google_auto_register !== 'false'}
                      onChange={(e) =>
                        setSettings({ ...settings, google_auto_register: e.target.checked ? 'true' : 'false' })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Client ID Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Google OAuth 2.0 Client ID (Web Application)
                </label>
                <input
                  type="text"
                  value={settings.google_client_id || ''}
                  onChange={(e) => setSettings({ ...settings, google_client_id: e.target.value.trim() })}
                  placeholder="เช่น 1234567890-abcdefg123456.apps.googleusercontent.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Client ID ที่ได้จากการสร้าง Credentials ใน Google Cloud Console
                </p>
              </div>

              {/* Instructions Box */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 space-y-2.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-blue-700" />
                  <span>คำแนะนำการสร้าง Google Client ID:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                  <li>
                    เข้าไปที่{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      Google Cloud Console - Credentials <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>คลิก <strong>+ CREATE CREDENTIALS</strong> &gt; <strong>OAuth client ID</strong></li>
                  <li>เลือก Application type เป็น <strong>Web application</strong></li>
                  <li>
                    ในส่วน <strong>Authorized JavaScript origins</strong> ให้เพิ่ม:
                    <div className="mt-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-blue-200 text-blue-800 space-y-1">
                      <div>http://localhost:3006</div>
                      <div>http://127.0.0.1:3006</div>
                    </div>
                  </li>
                  <li>กด <strong>CREATE</strong> แล้วคัดลอก <strong>Client ID</strong> มาวางในช่องด้านบน</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า Google SSO'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT USER                                */}
      {/* ======================================================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    placeholder="e.g. john_doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingUser ? 'รหัสผ่านใหม่ (เว้นว่างได้)' : 'รหัสผ่าน *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder={editingUser ? 'ปล่อยว่างถ้าไม่เปลี่ยน' : 'อย่างน้อย 6 ตัวอักษร'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  placeholder="เช่น นายสมเกียรติ ยิ่งยืน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="name@crvc.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={userFormData.position}
                    onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                    placeholder="เช่น ครูชำนาญการ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บทบาทสิทธิ์ (Role)
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="ORGANIZER">ผู้จัดโครงการ (ORGANIZER)</option>
                    <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หน่วยงาน / แผนกวิชา
                </label>
                <input
                  type="text"
                  value={userFormData.organization}
                  onChange={(e) => setUserFormData({ ...userFormData, organization: e.target.value })}
                  placeholder="เช่น แผนกวิชาคอมพิวเตอร์ธุรกิจ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user_active_checkbox"
                  checked={userFormData.is_active}
                  onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="user_active_checkbox" className="text-sm font-medium text-slate-700 cursor-pointer">
                  เปิดให้บัญชีนี้สามารถเข้าสู่ระบบได้ (Active)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT EVALUATION TEMPLATE                 */}
      {/* ======================================================== */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingTemplate ? 'แก้ไขแม่แบบแบบประเมินกลาง' : 'สร้างแม่แบบแบบประเมินกลาง'}
              </h3>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อแม่แบบแบบประเมิน *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateFormData.title}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                    placeholder="เช่น แบบประเมินความพึงพอใจการอบรมเชิงปฏิบัติการ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={templateFormData.category}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="GENERAL">ทั่วไป (GENERAL)</option>
                    <option value="WORKSHOP">อบรมเชิงปฏิบัติการ (WORKSHOP)</option>
                    <option value="ACADEMIC">การแข่งขันทักษะวิชาการ (ACADEMIC)</option>
                    <option value="CEREMONY">พิธีการ / นิทรรศการ (CEREMONY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เป้าหมายจำนวนผู้ตอบ</label>
                  <input
                    type="number"
                    value={templateFormData.target_responses}
                    onChange={(e) =>
                      setTemplateFormData({ ...templateFormData, target_responses: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">คำอธิบาย</label>
                  <textarea
                    rows={2}
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateFormData.is_default}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, is_default: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700">ตั้งเป็นแม่แบบเริ่มต้น (Default)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateFormData.is_active}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700">เปิดใช้งาน (Active)</span>
                  </label>
                </div>
              </div>

              {/* Sections & Questions Editor */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>หัวข้อและข้อคำถามในแบบประเมิน ({templateFormData.sections.length} ตอน)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addSection}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มตอนใหม่</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {templateFormData.sections.map((sec: any, sIdx: number) => (
                    <div key={sIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeSection(sIdx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                          title="ลบตอนนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 pl-3 border-l-2 border-slate-200">
                        {sec.questions?.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 w-5 text-right">
                              {qIdx + 1}.
                            </span>
                            <input
                              type="text"
                              value={q.question_text}
                              onChange={(e) => updateQuestion(sIdx, qIdx, 'question_text', e.target.value)}
                              placeholder="ระบุข้อความคำถาม"
                              className="flex-1 px-3 py-1 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                            <select
                              value={q.question_type}
                              onChange={(e) => updateQuestion(sIdx, qIdx, 'question_type', e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-medium"
                            >
                              <option value="RATING_5">คะแนน 5 ระดับ (Rating 1-5)</option>
                              <option value="TEXT">ข้อความบรรยาย (Text)</option>
                              <option value="RADIO">เลือกตอบ 1 ข้อ (Radio)</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeQuestion(sIdx, qIdx)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addQuestion(sIdx)}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> เพิ่มคำถามในตอนนี้
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md"
                >
                  บันทึกแม่แบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
