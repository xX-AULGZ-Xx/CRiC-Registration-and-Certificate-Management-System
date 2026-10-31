'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Settings,
  ArrowLeft,
  Search,
  Check,
  Upload,
  Move,
  RefreshCw,
  ExternalLink,
  Copy,
  BarChart2,
  QrCode,
  FileText,
  Clock,
  Sparkles,
  UserCheck,
  AlertCircle,
  Download,
  Printer,
  Sliders,
  Pencil,
  Loader2,
  X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import CertificateRenderer, {
  BlockStyle,
  CertificateConfig,
  FONT_FAMILIES,
} from '@/components/certificate/CertificateRenderer';
import EvaluationFormEditor from '@/components/evaluation/EvaluationFormEditor';
import { fetchApi } from '@/lib/api';

export default function EventManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'certificate' | 'evaluation'>('overview');
  const [portalMode, setPortalMode] = useState<'register' | 'evaluation'>('register');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);

  // Certificate Designer state
  const [certConfig, setCertConfig] = useState<CertificateConfig>({});
  const [selectedBlock, setSelectedBlock] = useState<'name' | 'course' | 'cert_no'>('name');
  const [savingCert, setSavingCert] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evaluation summary state
  const [evalSummary, setEvalSummary] = useState<any>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [evalSearch, setEvalSearch] = useState('');

  // Edit Event Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProjectRefCode, setEditProjectRefCode] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editRegStart, setEditRegStart] = useState('');
  const [editRegEnd, setEditRegEnd] = useState('');
  const [editMaxAttendees, setEditMaxAttendees] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editCertPrefix, setEditCertPrefix] = useState('');
  const [editHasRegistration, setEditHasRegistration] = useState(true);
  const [editHasEvaluation, setEditHasEvaluation] = useState(true);

  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedRows, setCsvParsedRows] = useState<any[]>([]);
  const [csvInitialStatus, setCsvInitialStatus] = useState<'registered' | 'checked_in'>('registered');
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccessResult, setCsvSuccessResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Batch Certificate Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'single_pdf' | 'zip_individual'>('single_pdf');
  const [exportScope, setExportScope] = useState<'checked_in_all' | 'issued_only'>('checked_in_all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; percent: number; name: string } | null>(null);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [currentExportAttendee, setCurrentExportAttendee] = useState<any>(null);
  const isExportCancelledRef = useRef(false);
  const hiddenCertExportRef = useRef<HTMLDivElement>(null);

  // PR / QR Code Modal State
  const [showPrModal, setShowPrModal] = useState(false);
  const [prTab, setPrTab] = useState<'registration' | 'survey' | 'certificate'>('registration');
  const [copiedPrType, setCopiedPrType] = useState<string | null>(null);
  const qrCanvasContainerRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' น.';
  };

  const openEditModal = () => {
    if (!event) return;
    setEditTitle(event.title || '');
    setEditDescription(event.description || '');
    setEditProjectRefCode(event.project_ref_code || '');
    setEditLocation(event.location || '');
    setEditStartDate(event.start_date ? event.start_date.split('T')[0] : '');
    setEditEndDate(event.end_date ? event.end_date.split('T')[0] : '');
    setEditStartTime(event.start_time || '');
    setEditEndTime(event.end_time || '');
    setEditRegStart(event.registration_start ? event.registration_start.slice(0, 16) : '');
    setEditRegEnd(event.registration_end ? event.registration_end.slice(0, 16) : '');
    setEditMaxAttendees(String(event.max_attendees || 0));
    setEditStatus(event.status || 'OPEN');
    setEditCertPrefix(certConfig.certificate_no_prefix || 'วอศ.ชร-2569');

    const regCfg = event.registration_config || {};
    const isEvalOnly = regCfg.is_evaluation_only === true || regCfg.has_registration === false;
    setEditHasRegistration(!isEvalOnly);
    const certCfg = event.certificate_config || {};
    const hasEval = certCfg.require_evaluation === true || !!event.evaluation_form || regCfg.has_evaluation === true;
    setEditHasEvaluation(hasEval);

    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    if (!editHasRegistration && !editHasEvaluation) {
      alert('กรุณาเลือกเปิดใช้งานอย่างน้อย 1 ระบบ (ระบบลงทะเบียน หรือ ระบบแบบประเมินความพึงพอใจ)');
      return;
    }

    try {
      setSavingEdit(true);
      const currentRegConfig = event.registration_config || {};
      const updatedRegConfig = {
        ...currentRegConfig,
        has_registration: editHasRegistration,
        is_evaluation_only: !editHasRegistration,
        has_evaluation: editHasEvaluation,
      };

      const updatedCertConfig = {
        ...certConfig,
        certificate_no_prefix: editCertPrefix.trim() || 'วอศ.ชร-2569',
        require_evaluation: editHasEvaluation,
      };

      const res = await fetchApi(`/api/v1/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          project_ref_code: editProjectRefCode.trim() || null,
          location: editLocation.trim() || null,
          start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
          end_date: editEndDate ? new Date(editEndDate).toISOString() : null,
          start_time: editStartTime.trim() || null,
          end_time: editEndTime.trim() || null,
          registration_start: editRegStart ? new Date(editRegStart).toISOString() : null,
          registration_end: editRegEnd ? new Date(editRegEnd).toISOString() : null,
          max_attendees: parseInt(editMaxAttendees) || 0,
          status: editStatus,
          registration_config: updatedRegConfig,
          certificate_config: updatedCertConfig,
        }),
      });

      if (res.success) {
        setEvent((prev: any) => ({
          ...prev,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          project_ref_code: editProjectRefCode.trim() || null,
          location: editLocation.trim() || null,
          start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
          end_date: editEndDate ? new Date(editEndDate).toISOString() : null,
          start_time: editStartTime.trim() || null,
          end_time: editEndTime.trim() || null,
          registration_start: editRegStart ? new Date(editRegStart).toISOString() : null,
          registration_end: editRegEnd ? new Date(editRegEnd).toISOString() : null,
          max_attendees: parseInt(editMaxAttendees) || 0,
          status: editStatus,
          registration_config: updatedRegConfig,
          certificate_config: updatedCertConfig,
        }));
        setCertConfig(updatedCertConfig);
        setShowEditModal(false);
        alert('บันทึกการแก้ไขข้อมูลและการตั้งค่าระบบสำเร็จ');
      } else {
        alert(res.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/evaluation/events/${eventId}/export-csv?token=${token || ''}`;
    window.open(url, '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      const modeParam = searchParams.get('mode');
      const savedMode = localStorage.getItem('portal_mode');
      const currentMode =
        modeParam === 'evaluation' || (!modeParam && savedMode === 'evaluation')
          ? 'evaluation'
          : 'register';

      setPortalMode(currentMode);

      if (currentMode === 'evaluation' || tabParam === 'evaluation') {
        setActiveTab('evaluation');
      }
    }

    const handleModeChange = (e: any) => {
      if (e.detail && (e.detail === 'register' || e.detail === 'evaluation')) {
        setPortalMode(e.detail);
        if (e.detail === 'evaluation') {
          setActiveTab('evaluation');
        }
      }
    };
    window.addEventListener('portal-mode-changed', handleModeChange);

    if (eventId) {
      loadEventData();
    }

    return () => window.removeEventListener('portal-mode-changed', handleModeChange);
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/events/${eventId}`);
      if (res.success) {
        setEvent(res.data);
        setCertConfig(res.data.certificate_config || {});
      }
      loadAttendees();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/attendees`);
      if (res.success) {
        setAttendees(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEvalSummary = async () => {
    try {
      setLoadingEval(true);
      const res = await fetchApi(`/api/v1/evaluation/events/${eventId}/summary`);
      if (res.success) {
        setEvalSummary(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEval(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'evaluation') {
      loadEvalSummary();
    }
  }, [activeTab]);

  // Check-in handler
  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput.trim()) return;

    try {
      const cleanInput = checkInInput.trim();
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({
          phone: cleanInput,
          citizen_id: cleanInput,
          attendee_id: isNaN(Number(cleanInput)) ? undefined : cleanInput,
        }),
      });

      if (res.success) {
        setCheckInFeedback(`เช็คชื่อสำเร็จ: ${res.data.full_name}`);
        setCheckInInput('');
        loadAttendees();
        setTimeout(() => setCheckInFeedback(null), 4000);
      }
    } catch (err: any) {
      setCheckInFeedback(err.message || 'ไม่พบข้อมูลผู้ลงทะเบียน');
      setTimeout(() => setCheckInFeedback(null), 4000);
    }
  };

  const handleCheckInSingle = async (attendeeId: string) => {
    try {
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ attendee_id: attendeeId }),
      });
      if (res.success) {
        loadAttendees();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueSingle = async (attendeeId: string) => {
    try {
      const res = await fetchApi(`/api/v1/certificates/attendees/${attendeeId}/issue`, {
        method: 'POST',
      });
      if (res.success) {
        loadAttendees();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueAll = async () => {
    if (!confirm('ยืนยันการออกเกียรติบัตรให้แก่ผู้เข้าร่วมที่เช็คชื่อแล้วทุกคน?')) return;
    try {
      const res = await fetchApi(`/api/v1/certificates/events/${eventId}/issue-all`, {
        method: 'POST',
        body: JSON.stringify({ only_checked_in: true }),
      });
      if (res.success) {
        alert(res.message);
        loadAttendees();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Certificate block style change
  const handleBlockChange = (blockKey: 'name' | 'course' | 'cert_no', updated: BlockStyle) => {
    setCertConfig((prev) => ({
      ...prev,
      [`${blockKey}_block`]: updated,
    }));
  };

  const handleSaveCertConfig = async () => {
    try {
      setSavingCert(true);
      const res = await fetchApi(`/api/v1/certificates/events/${eventId}/config`, {
        method: 'PUT',
        body: JSON.stringify({ certificate_config: certConfig }),
      });
      if (res.success) {
        alert('บันทึกรูปแบบเกียรติบัตรเรียบร้อยแล้ว');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingCert(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const headers = ['คำนำหน้า', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'หน่วยงาน/สังกัด', 'เบอร์โทรศัพท์', 'อีเมล', 'เลขบัตรประชาชน'];
    const sampleRows = [
      ['นาย', 'สมชาย ใจดี', 'ครูชำนาญการ', 'วิทยาลัยอาชีวศึกษาเชียงราย', '0812345678', 'somchai@example.com', '1234567890123'],
      ['นางสาว', 'สมหญิง รักเรียน', 'นักเรียน / นักศึกษา', 'วิทยาลัยอาชีวศึกษาเชียงราย', '0898765432', 'somying@example.com', '9876543210987'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = event?.title ? event.title.replace(/[^\w\u0E00-\u0E7F]/g, '_') : 'attendees';
    link.setAttribute('download', `แม่แบบนำเข้ารายชื่อ_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    let cleanText = text;
    if (cleanText.charCodeAt(0) === 0xfeff) {
      cleanText = cleanText.slice(1);
    }

    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if ((char === ',' || char === ';') && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((val) => val.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((val) => val.length > 0)) {
        lines.push(currentRow);
      }
    }

    if (lines.length < 2) return [];

    const rawHeaders = lines[0].map((h) => h.toLowerCase().replace(/[\s\-_/]/g, ''));

    const colIndex = {
      title_name: rawHeaders.findIndex((h) => h.includes('คำนำหน้า') || h.includes('titlename') || h === 'title'),
      full_name: rawHeaders.findIndex(
        (h) => h.includes('ชื่อนามสกุล') || h.includes('fullname') || h.includes('ชื่อ') || h === 'name'
      ),
      position: rawHeaders.findIndex((h) => h.includes('ตำแหน่ง') || h.includes('position')),
      organization: rawHeaders.findIndex(
        (h) =>
          h.includes('หน่วยงาน') ||
          h.includes('สังกัด') ||
          h.includes('โรงเรียน') ||
          h.includes('organization') ||
          h.includes('org')
      ),
      phone: rawHeaders.findIndex((h) => h.includes('โทร') || h.includes('phone') || h.includes('tel') || h.includes('mobile')),
      email: rawHeaders.findIndex((h) => h.includes('อีเมล') || h.includes('email') || h.includes('mail')),
      citizen_id: rawHeaders.findIndex(
        (h) => h.includes('บัตร') || h.includes('ประชาชน') || h.includes('citizen') || h.includes('idcard')
      ),
    };

    if (colIndex.full_name === -1) {
      colIndex.full_name = colIndex.title_name === 0 && lines[0].length > 1 ? 1 : 0;
    }

    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const full_name = colIndex.full_name >= 0 ? row[colIndex.full_name] : '';
      if (!full_name || !full_name.trim()) continue;

      parsed.push({
        title_name: colIndex.title_name >= 0 ? row[colIndex.title_name] || '' : '',
        full_name: full_name.trim(),
        position: colIndex.position >= 0 ? row[colIndex.position] || '' : '',
        organization: colIndex.organization >= 0 ? row[colIndex.organization] || '' : '',
        phone: colIndex.phone >= 0 ? row[colIndex.phone] || '' : '',
        email: colIndex.email >= 0 ? row[colIndex.email] || '' : '',
        citizen_id: colIndex.citizen_id >= 0 ? row[colIndex.citizen_id] || '' : '',
      });
    }

    return parsed;
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError(null);
    setCsvSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = (evt.target?.result as string) || '';
        const rows = parseCsvText(text);
        if (rows.length === 0) {
          setCsvError('ไม่พบข้อมูลในไฟล์ หรือไม่มีคอลัมน์ชื่อ-นามสกุลที่ถูกต้อง');
          setCsvParsedRows([]);
        } else {
          setCsvParsedRows(rows);
        }
      } catch (err: any) {
        setCsvError('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + err.message);
        setCsvParsedRows([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImportCsv = async () => {
    if (csvParsedRows.length === 0) return;

    try {
      setImportingCsv(true);
      setCsvError(null);

      const res = await fetchApi(`/api/v1/registration/events/${eventId}/import-csv`, {
        method: 'POST',
        body: JSON.stringify({
          attendees: csvParsedRows,
          initial_status: csvInitialStatus,
        }),
      });

      if (res.success && res.data) {
        setCsvSuccessResult({
          imported: res.data.imported_count,
          skipped: res.data.skipped_count,
          total: res.data.total_rows,
        });
        loadAttendees();
        loadEventData();
      } else {
        setCsvError(res.message || 'ไม่สามารถนำเข้าข้อมูลได้');
      }
    } catch (err: any) {
      setCsvError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setImportingCsv(false);
    }
  };

  const handleCancelBatchExport = () => {
    isExportCancelledRef.current = true;
    setExportStatusText('กำลังยกเลิกการส่งออกข้อมูล...');
  };

  const handleStartBatchExport = async () => {
    isExportCancelledRef.current = false;
    setIsExporting(true);
    setExportStatusText('กำลังเตรียมข้อมูลผู้เข้าร่วม...');

    try {
      let currentAttendeesList = [...attendees];

      // 1. If scope is checked_in_all, check if anyone needs a certificate issued first
      if (exportScope === 'checked_in_all') {
        const checkedInWithoutCert = currentAttendeesList.filter((a) => a.status === 'checked_in' && !a.certificate_no);
        if (checkedInWithoutCert.length > 0) {
          setExportStatusText(`กำลังออกเลขที่เกียรติบัตรให้อัตโนมัติ (${checkedInWithoutCert.length} ท่าน)...`);
          const issueRes = await fetchApi(`/api/v1/certificates/events/${eventId}/issue-all`, {
            method: 'POST',
            body: JSON.stringify({ only_checked_in: true }),
          });
          if (issueRes.success) {
            const attRes = await fetchApi(`/api/v1/registration/events/${eventId}/attendees`);
            if (attRes.success) {
              currentAttendeesList = attRes.data;
              setAttendees(attRes.data);
            }
          }
        }
      }

      // Filter target attendees based on scope
      let targets = [];
      if (exportScope === 'checked_in_all') {
        targets = currentAttendeesList.filter((a) => a.status === 'checked_in' && a.certificate_no);
      } else {
        targets = currentAttendeesList.filter((a) => !!a.certificate_no);
      }

      if (targets.length === 0) {
        alert('ไม่พบผู้เข้าร่วมที่ตรงตามเงื่อนไขที่เลือก (ยังไม่มีผู้เข้าร่วมที่มีเลขที่เกียรติบัตร)');
        setIsExporting(false);
        return;
      }

      const total = targets.length;
      let combinedPdf: any = null;
      let zip: any = null;

      if (exportFormat === 'single_pdf') {
        combinedPdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });
      } else {
        zip = new JSZip();
      }

      for (let i = 0; i < total; i++) {
        if (isExportCancelledRef.current) {
          setExportStatusText('ยกเลิกการส่งออกข้อมูลเรียบร้อยแล้ว');
          break;
        }

        const att = targets[i];
        const displayName = `${att.title_name || ''}${att.full_name}`.trim();
        const percent = Math.round(((i + 1) / total) * 100);

        setExportProgress({
          current: i + 1,
          total,
          percent,
          name: displayName,
        });
        setExportStatusText(`กำลังสร้างเกียรติบัตรคนที่ ${i + 1} จาก ${total} (${percent}%)...`);

        setCurrentExportAttendee(att);

        // Allow DOM to update and images/fonts to paint
        await new Promise((r) => setTimeout(r, 70));

        if (!hiddenCertExportRef.current) continue;

        const canvas = await html2canvas(hiddenCertExportRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          ignoreElements: (el) => el.classList.contains('designer-handle') || el.classList.contains('designer-outline'),
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (exportFormat === 'single_pdf') {
          if (i > 0) {
            combinedPdf.addPage([297, 210], 'landscape');
          }
          combinedPdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        } else {
          const individualPdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true,
          });
          individualPdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
          const pdfBlob = individualPdf.output('blob');

          const safeName = displayName.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9_-]/g, '_');
          const safeCertNo = (att.certificate_no || '').replace(/[^\u0E00-\u0E7Fa-zA-Z0-9_-]/g, '_');
          const seq = String(i + 1).padStart(3, '0');
          const fileName = `${seq}_${safeName}_${safeCertNo}.pdf`;
          zip.file(fileName, pdfBlob);
        }
      }

      if (isExportCancelledRef.current) {
        setIsExporting(false);
        setCurrentExportAttendee(null);
        return;
      }

      const safeEventTitle = (event?.title || 'event').replace(/[^\u0E00-\u0E7Fa-zA-Z0-9_-]/g, '_');

      if (exportFormat === 'single_pdf') {
        setExportStatusText('กำลังบันทึกไฟล์ PDF รวม...');
        combinedPdf.save(`เกียรติบัตรทั้งหมด_${safeEventTitle}.pdf`);
      } else {
        setExportStatusText('กำลังบีบอัดไฟล์ ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata: any) => {
          setExportStatusText(`กำลังบีบอัดไฟล์ ZIP (${metadata.percent.toFixed(0)}%)...`);
        });

        const downloadUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `เกียรติบัตรทั้งหมด_${safeEventTitle}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }

      setExportStatusText('ดาวน์โหลดเกียรติบัตรเสร็จสมบูรณ์เรียบร้อยแล้ว');
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(null);
        setCurrentExportAttendee(null);
        setShowExportModal(false);
      }, 1200);
    } catch (err: any) {
      console.error('Batch export error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์เกียรติบัตร: ' + (err.message || ''));
      setIsExporting(false);
      setExportProgress(null);
      setCurrentExportAttendee(null);
    }
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('background', file);

    try {
      setUploadingBg(true);
      const res = await fetch(`/api/v1/certificates/events/${eventId}/upload-bg`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCertConfig((prev) => ({ ...prev, bg_image_url: data.data.bg_image_url }));
        alert('อัปโหลดภาพพื้นหลังเกียรติบัตรสำเร็จ');
      } else {
        alert(data.message || 'ไม่สามารถอัปโหลดภาพได้');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setUploadingBg(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('คัดลอกลิงก์เรียบร้อยแล้ว');
  };

  const openPrModal = (initialTab?: 'registration' | 'survey' | 'certificate') => {
    if (portalMode === 'evaluation') {
      setPrTab(initialTab || 'survey');
    } else {
      setPrTab(initialTab || 'registration');
    }
    setShowPrModal(true);
    setCopiedPrType(null);
  };

  const handleDownloadQrCode = () => {
    if (!qrCanvasContainerRef.current) return;
    const canvas = qrCanvasContainerRef.current.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    const prefixMap: Record<string, string> = {
      registration: 'ลงทะเบียน',
      survey: 'แบบประเมิน',
      certificate: 'ตรวจสอบเกียรติบัตร',
    };
    const cleanTitle = (event?.title || eventId).replace(/[\\/:*?"<>|]/g, '_');
    downloadLink.download = `QRCode_${prefixMap[prTab] || 'code'}_${cleanTitle}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCopyPrLink = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPrType(type);
    setTimeout(() => {
      setCopiedPrType((prev) => (prev === type ? null : prev));
    }, 2500);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลการจัดการกิจกรรม...</p>
      </div>
    );
  }

  if (!event) return null;

  const currentBlockStyle: BlockStyle =
    selectedBlock === 'name'
      ? { x: 50, y: 47, fontSize: 34, color: '#0f172a', fontFamily: 'charm', ...(certConfig.name_block || {}) }
      : selectedBlock === 'course'
      ? { x: 50, y: 62, fontSize: 22, color: '#1e293b', fontFamily: 'sarabun', ...(certConfig.course_block || {}) }
      : { x: 90, y: 11, fontSize: 11, color: '#475569', fontFamily: 'sarabun', showQr: true, ...(certConfig.cert_no_block || {}) };

  const filteredAttendees = attendees.filter((a) => {
    if (!attendeeSearch.trim()) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      a.full_name?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.citizen_id?.includes(q) ||
      a.organization?.toLowerCase().includes(q) ||
      a.certificate_no?.toLowerCase().includes(q)
    );
  });

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicRegUrl = `${appOrigin}/events/${eventId}`;
  const publicSurveyUrl = `${appOrigin}/surveys/${eventId}`;
  const publicCertUrl = `${appOrigin}/certificates/search?q=${encodeURIComponent(event.title || '')}`;

  const currentPrUrl =
    prTab === 'registration'
      ? publicRegUrl
      : prTab === 'survey'
      ? publicSurveyUrl
      : publicCertUrl;

  const currentPrTitle =
    prTab === 'registration'
      ? 'QR Code ลงทะเบียนเข้าร่วม'
      : prTab === 'survey'
      ? 'QR Code แบบประเมินความพึงพอใจ'
      : 'QR Code ตรวจสอบเกียรติบัตร';

  const currentCopyButtonText =
    prTab === 'registration'
      ? 'คัดลอกลิงก์รับสมัคร'
      : prTab === 'survey'
      ? 'คัดลอกลิงก์แบบประเมิน'
      : 'คัดลอกลิงก์ตรวจสอบเกียรติบัตร';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back and Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={portalMode === 'evaluation' ? '/dashboard?mode=evaluation' : '/dashboard'}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-700 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่แดชบอร์ด
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full shrink-0 bg-blue-100 text-blue-800">
              {event.event_code}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate max-w-full">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Status Toggle & Public Link */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openPrModal()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>QR Code ประชาสัมพันธ์</span>
          </button>

          {portalMode !== 'evaluation' && (
            <Link
              href={`/events/${eventId}`}
              target="_blank"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>หน้าลงทะเบียน</span>
            </Link>
          )}

          <Link
            href={`/surveys/${eventId}`}
            target="_blank"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border font-semibold text-xs shadow-xs transition border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>หน้าแบบประเมิน</span>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth pb-px -mx-4 px-4 sm:mx-0 sm:px-0">
        {portalMode !== 'evaluation' && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                activeTab === 'overview'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>ภาพรวม & ลิงก์</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendees')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                activeTab === 'attendees'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>ผู้ลงทะเบียน ({attendees.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                activeTab === 'certificate'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>ออกแบบเกียรติบัตร</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
            activeTab === 'evaluation'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span>แบบประเมิน & สถิติ</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: OVERVIEW & SHARABLE LINKS
      ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Share Links Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    ลิงก์และ QR Code สำหรับประชาสัมพันธ์
                  </h2>
                  <p className="text-slate-400 text-xs">ลิงก์และรหัส QR Code สำหรับเผยแพร่ให้ผู้เข้าร่วมกิจกรรม</p>
                </div>
                <button
                  type="button"
                  onClick={() => openPrModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition cursor-pointer self-start sm:self-auto border border-emerald-200/60"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ดู QR Code และลิงก์ประชาสัมพันธ์</span>
                </button>
              </div>

              <div className="space-y-4">
                {portalMode !== 'evaluation' && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                    <div className="text-xs font-bold text-blue-900 flex flex-wrap items-center justify-between gap-2">
                      <span>ลิงก์ลงทะเบียนเข้าร่วมกิจกรรม (Public Registration)</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openPrModal('registration')}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" /> แสดง QR Code
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(publicRegUrl)}
                          className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> คัดลอก
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-blue-800 break-all select-all">
                      {publicRegUrl}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex flex-wrap items-center justify-between gap-2">
                    <span>ลิงก์แบบประเมินความพึงพอใจ (Evaluation Survey)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openPrModal('survey')}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> แสดง QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(publicSurveyUrl)}
                        className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> คัดลอก
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-blue-800 break-all select-all">
                    {publicSurveyUrl}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex flex-wrap items-center justify-between gap-2">
                    <span>ลิงก์ค้นหาและตรวจสอบเกียรติบัตร (Certificate Verification)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openPrModal('certificate')}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> แสดง QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(publicCertUrl)}
                        className="inline-flex items-center gap-1 text-amber-800 hover:underline font-semibold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> คัดลอก
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-amber-800 break-all select-all">
                    {publicCertUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Settings Details */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">รายละเอียดโครงการ & กำหนดการเวลา</h2>
                    <p className="text-slate-400 text-xs">วัน เวลาจัดกิจกรรม และช่วงเวลาเปิดรับลงทะเบียน</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูล & เวลา</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> วันจัดกิจกรรม
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {formatDate(event.start_date) || 'ไม่ได้กำหนดวันที่'}
                    {event.end_date && ` ถึง ${formatDate(event.end_date)}`}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> เวลาจัดกิจกรรม
                  </div>
                  <div className="font-bold text-blue-700 text-sm">
                    {event.start_time ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''} น.` : 'ไม่ได้ระบุเวลา'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">สถานที่จัดกิจกรรม</div>
                  <div className="font-semibold text-slate-800">{event.location || '-'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">ช่วงเปิด-ปิดรับลงทะเบียน</div>
                  <div className="font-semibold text-slate-800">
                    {event.registration_start || event.registration_end ? (
                      <span>
                        {event.registration_start ? formatDateTime(event.registration_start) : 'เปิดตลอด'}
                        {event.registration_end ? ` ถึง ${formatDateTime(event.registration_end)}` : ''}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">เปิดรับลงทะเบียนตลอดเวลา</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">รหัสโครงการอ้างอิง</div>
                  <div className="font-mono font-semibold text-slate-800">{event.project_ref_code || '-'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">จำนวนรับสูงสุด</div>
                  <div className="font-semibold text-slate-800">{event.max_attendees > 0 ? `${event.max_attendees} คน` : 'ไม่จำกัดจำนวน'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">คำนำหน้าเลขที่เกียรติบัตร</div>
                  <div className="font-mono font-semibold text-slate-800">{certConfig.certificate_no_prefix || 'วอศ.ชร-2569'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400">สถานะกิจกรรม</div>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      event.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : event.status === 'CLOSED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {event.status === 'OPEN' ? 'เปิดรับลงทะเบียน' : event.status === 'CLOSED' ? 'ปิดรับลงทะเบียน' : event.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
              <h3 className="font-bold text-sm text-blue-200">สถิติภาพรวมกิจกรรม</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">ผู้ลงทะเบียนทั้งหมด</span>
                  <span className="text-lg font-black">{attendees.length} คน</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">เช็คชื่อเข้าร่วมแล้ว</span>
                  <span className="text-lg font-black text-emerald-400">
                    {attendees.filter((a) => a.status === 'checked_in').length} คน
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">ออกเกียรติบัตรแล้ว</span>
                  <span className="text-lg font-black text-amber-300">
                    {attendees.filter((a) => a.certificate_no).length} ฉบับ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ATTENDEES & CHECK-IN
      ======================================================== */}
      {activeTab === 'attendees' && (
        <div className="space-y-6">
          {/* Quick Check-in Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>จุดเช็คชื่อผู้เข้าร่วมหน้างาน (Quick Check-in)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กรอกเบอร์โทร, เลขบัตรประชาชน, รหัส ID หรือสแกน QR บัตรผู้ลงทะเบียน
                </p>
              </div>

              {/* Action Buttons: Import CSV and Batch Issue */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCsvFile(null);
                    setCsvParsedRows([]);
                    setCsvError(null);
                    setCsvSuccessResult(null);
                    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
                    setShowCsvModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                  title="นำเข้ารายชื่อผู้ลงทะเบียนจากไฟล์ CSV"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>นำเข้ารายชื่อ CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleIssueAll}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Award className="w-4 h-4" />
                  <span>ออกเกียรติบัตรทุกคนที่เช็คชื่อแล้ว</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                value={checkInInput}
                onChange={(e) => setCheckInInput(e.target.value)}
                placeholder="กรอกเบอร์โทร / เลขบัตร 13 หลัก / ID..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer shrink-0"
              >
                เช็คชื่อทันที
              </button>
            </form>

            {checkInFeedback && (
              <div className="text-xs font-bold text-slate-800 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {checkInFeedback}
              </div>
            )}
          </div>

          {/* Attendees List & Search */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">รายชื่อผู้ลงทะเบียน</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {filteredAttendees.length} ท่าน
                </span>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, เบอร์โทร, สังกัด..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3 px-4">ตำแหน่ง / สังกัด</th>
                    <th className="py-3 px-4">สถานะเช็คชื่อ</th>
                    <th className="py-3 px-4">เลขที่เกียรติบัตร</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        ไม่พบรายชื่อผู้ลงทะเบียน
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {a.title_name || ''}{a.full_name}
                        </td>
                        <td className="py-3 px-4 font-mono">{a.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {a.organization || a.position || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {a.status === 'checked_in' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> เช็คชื่อแล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCheckInSingle(a.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer"
                            >
                              กดเช็คชื่อ
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {a.certificate_no || (
                            <span className="text-slate-400 font-normal text-[11px]">
                              ยังไม่ได้ออก
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {!a.certificate_no ? (
                            <button
                              type="button"
                              onClick={() => handleIssueSingle(a.id)}
                              className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition cursor-pointer"
                            >
                              ออกเกียรติบัตร
                            </button>
                          ) : (
                            <Link
                              href={`/certificates/${a.id}/view`}
                              target="_blank"
                              className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition inline-block"
                            >
                              ดูเกียรติบัตร
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CERTIFICATE DESIGNER
      ======================================================== */}
      {activeTab === 'certificate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Canvas Preview (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-blue-700">คำแนะนำ:</span> คลิกที่บล็อกข้อความบนเกียรติบัตรเพื่อปรับขนาด สี หรือลากเพื่อจัดตำแหน่ง (Drag & Drop)
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsExporting(false);
                    setExportProgress(null);
                    setShowExportModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                  title="Export เกียรติบัตรทั้งหมดในครั้งเดียว"
                >
                  <Download className="w-4 h-4" />
                  <span>Export เกียรติบัตรทั้งหมด</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCertConfig}
                  disabled={savingCert}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {savingCert ? 'กำลังบันทึก...' : 'บันทึกรูปแบบเกียรติบัตร'}
                </button>
              </div>
            </div>

            <CertificateRenderer
              attendee={{
                full_name: 'นายสมชาย รักเรียน',
                event_title: event.title,
                certificate_no: `${certConfig.certificate_no_prefix || 'CERT-2569'}-0001`,
              }}
              config={certConfig}
              isEditable={true}
              selectedBlock={selectedBlock}
              onSelectBlock={setSelectedBlock}
              onBlockChange={handleBlockChange}
              showActions={false}
            />
          </div>

          {/* Right Controls Panel (1 col) */}
          <div className="space-y-6">
            {/* Background Upload Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>ภาพพื้นหลังเกียรติบัตร (A4 แนวนอน)</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadBg}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingBg}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingBg ? 'กำลังอัปโหลด...' : 'เลือกไฟล์ภาพพื้นหลัง (PNG/JPG)'}</span>
              </button>
            </div>

            {/* Block Inspector */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">ปรับแต่งบล็อกที่เลือก</h3>
                <div className="flex gap-1">
                  {(['name', 'course', 'cert_no'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBlock(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedBlock === b
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {b === 'name' ? 'ชื่อ' : b === 'course' ? 'กิจกรรม' : 'เลขที่/QR'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">รูปแบบฟอนต์</label>
                <select
                  value={currentBlockStyle.fontFamily || 'sarabun'}
                  onChange={(e) =>
                    handleBlockChange(selectedBlock, { ...currentBlockStyle, fontFamily: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(FONT_FAMILIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.thaiName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">ขนาดตัวอักษร</span>
                  <span className="font-mono text-slate-500">{currentBlockStyle.fontSize || 24}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={currentBlockStyle.fontSize || 24}
                  onChange={(e) =>
                    handleBlockChange(selectedBlock, {
                      ...currentBlockStyle,
                      fontSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Font Color */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">สีตัวอักษร</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentBlockStyle.color || '#0f172a'}
                    onChange={(e) =>
                      handleBlockChange(selectedBlock, { ...currentBlockStyle, color: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={currentBlockStyle.color || '#0f172a'}
                    onChange={(e) =>
                      handleBlockChange(selectedBlock, { ...currentBlockStyle, color: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* QR Code toggles if cert_no selected */}
              {selectedBlock === 'cert_no' && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBlockStyle.showQr !== false}
                      onChange={(e) =>
                        handleBlockChange('cert_no', {
                          ...currentBlockStyle,
                          showQr: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>แสดง QR Code สำหรับสแกนตรวจสอบ</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: EVALUATION & STATISTICAL ANALYSIS
      ======================================================== */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Top Actions Bar for Evaluation */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                การประเมินความพึงพอใจและสถิติ (Evaluation & Analytics)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กำหนดคำถาม ธีมหน้าประเมิน เงื่อนไขการรับเกียรติบัตร และวิเคราะห์ผลค่าเฉลี่ย (x̄/S.D.)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowFormEditor(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>ตั้งค่าแบบประเมิน (Form Builder)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                title="ส่งออกผลการประเมินรายคนเป็นไฟล์ CSV / Excel พร้อมภาษาไทยสมบูรณ์"
              >
                <Download className="w-4 h-4 text-slate-600 shrink-0" />
                <span>ส่งออก CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                title="พิมพ์หน้ารายงานสรุปผลสถิติเป็นเอกสารสรุปโครงการ PDF"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>พิมพ์รายงานสรุปผล</span>
              </button>
            </div>
          </div>

          {/* Form Editor Modal */}
          {showFormEditor && (
            <EvaluationFormEditor
              eventId={eventId}
              onClose={() => {
                setShowFormEditor(false);
                loadEvalSummary();
              }}
              onSaved={() => {
                setShowFormEditor(false);
                loadEvalSummary();
              }}
            />
          )}

          {loadingEval ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span>กำลังประมวลผลข้อมูลสถิติแบบประเมิน...</span>
            </div>
          ) : !evalSummary || evalSummary.has_form === false ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Sliders className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">ยังไม่ได้สร้างแบบประเมินสำหรับกิจกรรมนี้</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  กิจกรรมนี้ยังไม่มีแบบสอบถามความพึงพอใจ คุณสามารถเริ่มต้นสร้างแบบประเมิน ออกแบบคำถาม หรือเลือกใช้แม่แบบมาตรฐานได้ทันที
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormEditor(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>สร้างและออกแบบแบบประเมิน</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-xs font-bold text-slate-500">จำนวนผู้ตอบแบบประเมิน</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {evalSummary.total_responses} คน
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    เป้าหมาย {evalSummary.target_responses} คน ({evalSummary.completion_rate}%)
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-xs font-bold text-slate-500">ค่าเฉลี่ยความพึงพอใจโดยรวม (x̄)</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">
                    {evalSummary.overall?.mean || 0} / 5.00
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    S.D. = {evalSummary.overall?.sd || 0}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-xs font-bold text-slate-500">ระดับผลการประเมิน</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">
                    {evalSummary.overall?.level || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    แปลผลตามเกณฑ์คะแนนเฉลี่ย Likert Scale
                  </div>
                </div>
              </div>

              {/* Question Breakdown by Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <h3 className="font-bold text-slate-900 text-lg">
                  รายงานผลการประเมินรายข้อ (Statistical Report)
                </h3>

                {evalSummary.sections?.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    ยังไม่มีข้อคำถามในแบบประเมิน
                  </div>
                ) : (
                  evalSummary.sections?.map((sec: any) => (
                    <div key={sec.id} className="space-y-4 pt-4 border-t border-slate-100 first:border-t-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm">{sec.title}</h4>
                        {sec.stats?.count > 0 && (
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                            ค่าเฉลี่ยตอน: {sec.stats.mean} (ระดับ {sec.stats.level})
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {sec.questions?.map((q: any) => (
                          <div
                            key={q.id}
                            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                          >
                            <div className="font-medium text-slate-800 flex-1">
                              {q.question_text}
                            </div>

                            {q.question_type === 'RATING_5' && q.stats && (
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-900">
                                    x̄ = {q.stats.mean}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    S.D. = {q.stats.sd}
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                                  {q.stats.level}
                                </span>
                              </div>
                            )}

                            {q.question_type === 'TEXT' && q.text_answers && (
                              <div className="text-slate-500 italic">
                                มีข้อเสนอแนะ {q.text_answers.length} รายการ
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Evaluation Responses Roster Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        รายชื่อผู้ส่งคำตอบแบบประเมิน (Respondent Roster)
                      </h3>
                      <p className="text-xs text-slate-500">
                        ผู้ตอบแบบประเมินทั้งหมด {evalSummary.responses?.length || 0} คน
                      </p>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, เบอร์โทร..."
                      value={evalSearch}
                      onChange={(e) => setEvalSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {(() => {
                  const responses = (evalSummary.responses || []).filter((r: any) => {
                    if (!evalSearch.trim()) return true;
                    const query = evalSearch.toLowerCase().trim();
                    const name = (r.attendee?.full_name || '').toLowerCase();
                    const phone = (r.attendee?.phone || '').toLowerCase();
                    const cert = (r.attendee?.certificate_no || '').toLowerCase();
                    return name.includes(query) || phone.includes(query) || cert.includes(query);
                  });

                  if (responses.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-600">
                          {evalSearch ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีผู้ส่งคำตอบแบบประเมินในขณะนี้'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          เมื่อผู้เข้าร่วมตอบแบบประเมิน รายชื่อ วันเวลาที่ส่ง และผลคะแนนจะแสดงที่นี่โดยอัตโนมัติ
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50/50">
                            <th className="py-3 px-4 rounded-l-xl">ลำดับ</th>
                            <th className="py-3 px-4">ชื่อ-นามสกุล / ผู้ตอบ</th>
                            <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                            <th className="py-3 px-4">วันที่-เวลาที่ส่ง</th>
                            <th className="py-3 px-4 text-center">คะแนนเฉลี่ย (x̄)</th>
                            <th className="py-3 px-4 text-center">เกณฑ์การประเมิน</th>
                            <th className="py-3 px-4 rounded-r-xl">เกียรติบัตร</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {responses.map((r: any, idx: number) => {
                            const dateStr = r.submitted_at
                              ? new Date(r.submitted_at).toLocaleDateString('th-TH', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-';

                            return (
                              <tr key={r.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {r.attendee?.full_name || 'ผู้ตอบทั่วไป (ไม่ระบุตัวตน)'}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 font-mono">
                                  {r.attendee?.phone || '-'}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500">{dateStr}</td>
                                <td className="py-3.5 px-4 text-center">
                                  {typeof r.mean_score === 'number' ? (
                                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                      {r.mean_score.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {r.passed_threshold ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                      ผ่านเกณฑ์
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                                      <AlertCircle className="w-3 h-3" />
                                      ไม่ผ่านเกณฑ์
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  {r.attendee?.certificate_no ? (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg">
                                      <Award className="w-3.5 h-3.5 text-blue-600" />
                                      {r.attendee.certificate_no}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Event Details & Time Settings Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลและกำหนดการเวลา</h3>
                <p className="text-xs text-slate-500">ปรับปรุงรายละเอียด วันและเวลาจัดกิจกรรม และช่วงเวลารับลงทะเบียน</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ชื่อกิจกรรม / หลักสูตรอบรม *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">คำอธิบายกิจกรรม</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">รหัสโครงการอ้างอิง</label>
                  <input
                    type="text"
                    value={editProjectRefCode}
                    onChange={(e) => setEditProjectRefCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">สถานะกิจกรรม</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="OPEN">เปิดรับลงทะเบียน (OPEN)</option>
                    <option value="CLOSED">ปิดรับลงทะเบียน (CLOSED)</option>
                    <option value="COMPLETED">เสร็จสิ้นกิจกรรม (COMPLETED)</option>
                    <option value="CANCELLED">ยกเลิกกิจกรรม (CANCELLED)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">สถานที่จัดกิจกรรม</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">จำนวนรับสูงสุด (0 = ไม่จำกัด)</label>
                  <input
                    type="number"
                    value={editMaxAttendees}
                    onChange={(e) => setEditMaxAttendees(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Event Date & Time */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>กำหนดการวันและเวลาจัดกิจกรรม</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">วันที่เริ่มกิจกรรม</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">วันที่สิ้นสุด (ถ้าจัดหลายวัน)</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">เวลาเริ่มกิจกรรม</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">เวลาสิ้นสุดกิจกรรม</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Registration Period */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>ช่วงเวลาเปิด-ปิดรับลงทะเบียน (ทางเลือก)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">เปิดรับลงทะเบียนตั้งแต่</label>
                    <input
                      type="datetime-local"
                      value={editRegStart}
                      onChange={(e) => setEditRegStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">ปิดรับลงทะเบียนเมื่อ</label>
                    <input
                      type="datetime-local"
                      value={editRegEnd}
                      onChange={(e) => setEditRegEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">คำนำหน้าเลขที่เกียรติบัตร</label>
                <input
                  type="text"
                  value={editCertPrefix}
                  onChange={(e) => setEditCertPrefix(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Module & Portal Visibility Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  โมดูลที่เปิดใช้งานและการแสดงผลในระบบ
                </div>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHasRegistration}
                      onChange={(e) => setEditHasRegistration(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        เปิดใช้งานระบบลงทะเบียนเข้าร่วมกิจกรรม
                      </div>
                      <div className="text-[11px] text-slate-500">
                        แสดงในแท็บลงทะเบียน และเปิดให้ผู้เข้าร่วมลงทะเบียนหน้าเว็บได้
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHasEvaluation}
                      onChange={(e) => setEditHasEvaluation(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        เปิดใช้งานระบบแบบประเมินความพึงพอใจ
                      </div>
                      <div className="text-[11px] text-slate-500">
                        แสดงในแท็บประเมิน และเปิดให้ผู้เข้าร่วมตอบแบบสอบถามได้
                      </div>
                    </div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                  หมายเหตุ: หากเลือกเปิดใช้งานทั้ง 2 ระบบ รายการนี้จะแสดงทั้งในแท็บลงทะเบียนและแท็บประเมินความพึงพอใจ
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>นำเข้ารายชื่อผู้ลงทะเบียนจากไฟล์ CSV</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  นำเข้ารายชื่อที่รวบรวมจากภายนอก พร้อมตรวจสอบข้อมูลตัวอย่างก่อนบันทึก
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Success Message Banner */}
            {csvSuccessResult ? (
              <div className="space-y-4 py-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">นำเข้าข้อมูลสำเร็จเรียบร้อย</h4>
                  <p className="text-xs text-slate-600">
                    นำเข้ารายชื่อสำเร็จ <span className="font-bold text-emerald-700">{csvSuccessResult.imported}</span> ท่าน
                    {csvSuccessResult.skipped > 0 && (
                      <span> (ข้ามรายการซ้ำหรือไม่สมบูรณ์ <span className="font-bold text-amber-700">{csvSuccessResult.skipped}</span> ท่าน)</span>
                    )}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Step 1: Download Template */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>ไฟล์แม่แบบสำหรับการนำเข้า (Template)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ดาวน์โหลดไฟล์ตัวอย่างที่มีคอลัมน์มาตรฐานครบถ้วนเพื่อนำไปกรอกข้อมูล
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดแม่แบบ CSV</span>
                  </button>
                </div>

                {/* Step 2: Attendance Status Setting */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800">
                    สถานะการเข้าร่วมเมื่อนำเข้า
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                        csvInitialStatus === 'registered'
                          ? 'border-blue-500 bg-blue-50/40 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="csvInitialStatus"
                        value="registered"
                        checked={csvInitialStatus === 'registered'}
                        onChange={() => setCsvInitialStatus('registered')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold">ลงทะเบียนแล้ว (รอเช็คชื่อ)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ผู้เข้าร่วมต้องมาเช็คชื่อหน้างาน หรือสแกน QR Code ก่อนรับเกียรติบัตร
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                        csvInitialStatus === 'checked_in'
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="csvInitialStatus"
                        value="checked_in"
                        checked={csvInitialStatus === 'checked_in'}
                        onChange={() => setCsvInitialStatus('checked_in')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold">เช็คชื่อแล้วทันที (พร้อมออกเกียรติบัตร)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          บันทึกสถานะว่าเข้าร่วมกิจกรรมแล้ว สามารถออกเกียรติบัตรได้ทันที
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Step 3: File Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800">
                    เลือกไฟล์ CSV สำหรับนำเข้า
                  </label>
                  <div
                    onClick={() => csvFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition"
                  >
                    <input
                      type="file"
                      ref={csvFileInputRef}
                      onChange={handleCsvFileChange}
                      accept=".csv,text/csv"
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    {csvFile ? (
                      <div>
                        <span className="text-xs font-bold text-slate-800">{csvFile.name}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ({(csvFile.size / 1024).toFixed(1)} KB) - คลิกเพื่อเปลี่ยนไฟล์
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          คลิกเพื่อเลือกไฟล์ .CSV จากเครื่องคอมพิวเตอร์ของคุณ
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          รองรับไฟล์ CSV ที่เข้ารหัส UTF-8 และ UTF-8 with BOM จาก Microsoft Excel
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {csvError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{csvError}</span>
                  </div>
                )}

                {/* Step 4: Preview Table */}
                {csvParsedRows.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800">
                        ตัวอย่างข้อมูลที่ตรวจพบ ({csvParsedRows.length} รายการ)
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        พร้อมนำเข้า {csvParsedRows.length} รายชื่อ
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2 px-3 w-10">ลำดับ</th>
                            <th className="py-2 px-3">คำนำหน้า</th>
                            <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                            <th className="py-2 px-3">ตำแหน่ง</th>
                            <th className="py-2 px-3">หน่วยงาน/สังกัด</th>
                            <th className="py-2 px-3">เบอร์โทร</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {csvParsedRows.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="py-1.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-1.5 px-3 text-slate-500">{row.title_name || '-'}</td>
                              <td className="py-1.5 px-3 font-semibold text-slate-900">{row.full_name}</td>
                              <td className="py-1.5 px-3 text-slate-600">{row.position || '-'}</td>
                              <td className="py-1.5 px-3 text-slate-600">{row.organization || '-'}</td>
                              <td className="py-1.5 px-3 font-mono text-slate-600">{row.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvParsedRows.length > 10 && (
                      <div className="text-[11px] text-slate-400 text-center">
                        แสดงตัวอย่าง 10 รายการแรก จากทั้งหมด {csvParsedRows.length} รายการ
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImportCsv}
                    disabled={importingCsv || csvParsedRows.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {importingCsv ? (
                      <span>กำลังนำเข้าข้อมูล...</span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>ยืนยันนำเข้าข้อมูล {csvParsedRows.length > 0 ? `(${csvParsedRows.length} ท่าน)` : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Certificate Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-600" />
                  <span>Export เกียรติบัตรทั้งหมดในครั้งเดียว</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  สร้างและดาวน์โหลดเกียรติบัตรของผู้เข้าร่วมกิจกรรมพร้อมกันตามรูปแบบที่กำหนด
                </p>
              </div>
              {!isExporting && (
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {isExporting ? (
              /* Export In-Progress View */
              <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">กำลังสร้างไฟล์เกียรติบัตร...</h4>
                  <p className="text-xs text-slate-600">
                    {exportStatusText}
                  </p>
                </div>

                {exportProgress && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">ความคืบหน้า</span>
                      <span className="text-amber-700">
                        {exportProgress.current} / {exportProgress.total} ใบ ({exportProgress.percent}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-150"
                        style={{ width: `${exportProgress.percent}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 text-center truncate pt-1">
                      กำลังประมวลผล: <span className="font-semibold text-slate-800">{exportProgress.name}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleCancelBatchExport}
                    className="px-5 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    ยกเลิกการส่งออก
                  </button>
                </div>
              </div>
            ) : (
              /* Settings & Configuration View */
              <div className="space-y-5">
                {/* Format selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800">
                    1. รูปแบบไฟล์ที่ต้องการส่งออก
                  </label>
                  <div className="space-y-2.5">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        exportFormat === 'single_pdf'
                          ? 'border-amber-500 bg-amber-50/40 text-amber-950 ring-1 ring-amber-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value="single_pdf"
                        checked={exportFormat === 'single_pdf'}
                        onChange={() => setExportFormat('single_pdf')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">รวมเป็นไฟล์ PDF เดียวทั้งหมด (All-in-One PDF)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          จัดเรียง 1 คนต่อ 1 หน้า A4 แนวนอน ความคมชัดสูง เหมาะสำหรับส่งโรงพิมพ์หรือสั่งพิมพ์ออกเครื่องพิมพ์รวดเดียว
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        exportFormat === 'zip_individual'
                          ? 'border-amber-500 bg-amber-50/40 text-amber-950 ring-1 ring-amber-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value="zip_individual"
                        checked={exportFormat === 'zip_individual'}
                        onChange={() => setExportFormat('zip_individual')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">บีบอัดเป็นไฟล์ ZIP แยกรายบุคคล (ZIP Archive)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          บรรจุไฟล์ PDF แยกรายบุคคล ตั้งชื่อไฟล์เป็น [ลำดับ]_[ชื่อ-นามสกุล]_[เลขที่].pdf สะดวกสำหรับการส่งต่อรายคน
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Target Scope selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800">
                    2. กลุ่มเป้าหมายผู้เข้าร่วมที่ต้องการออกเกียรติบัตร
                  </label>
                  <div className="space-y-2.5">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        exportScope === 'checked_in_all'
                          ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportScope"
                        value="checked_in_all"
                        checked={exportScope === 'checked_in_all'}
                        onChange={() => setExportScope('checked_in_all')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold">
                          ผู้เข้าร่วมที่เช็คชื่อแล้วทั้งหมด ({attendees.filter((a) => a.status === 'checked_in').length} ท่าน)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          หากใครยังไม่มีเลขที่เกียรติบัตร ระบบจะดำเนินการออกเลขที่ให้อัตโนมัติก่อนเริ่มสร้างไฟล์
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        exportScope === 'issued_only'
                          ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportScope"
                        value="issued_only"
                        checked={exportScope === 'issued_only'}
                        onChange={() => setExportScope('issued_only')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold">
                          เฉพาะผู้ที่มีเลขที่เกียรติบัตรแล้ว ({attendees.filter((a) => a.certificate_no).length} ท่าน)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ออกเฉพาะผู้ที่มีการออกเลขที่เกียรติบัตรไว้แล้วเท่านั้น
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-800">ข้อควรทราบ:</span> ระบบจะเรนเดอร์ภาพเกียรติบัตรตามรูปแบบฟอนต์ ขนาด สี และ QR Code ที่จัดไว้ใน Certificate Designer ความละเอียดสูง หากมีจำนวนผู้เข้าร่วมจำนวนมาก กรุณารอจนกว่าการดาวน์โหลดจะเสร็จสิ้น
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleStartBatchExport}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>เริ่ม Export เกียรติบัตร</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PR / QR Code Modal */}
      {showPrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 relative shadow-2xl border border-slate-100 space-y-5 my-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPrModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-100 transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Icon */}
            <div className="flex flex-col items-center text-center pt-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-xs border border-emerald-100/60">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {currentPrTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm line-clamp-2 leading-relaxed">
                {event?.title}
              </p>
            </div>

            {/* Segmented Tab Switcher (Registration / Survey / Certificate) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
              {portalMode !== 'evaluation' && (
                <button
                  type="button"
                  onClick={() => {
                    setPrTab('registration');
                    setCopiedPrType(null);
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                    prTab === 'registration'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ลงทะเบียน
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPrTab('survey');
                  setCopiedPrType(null);
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  prTab === 'survey'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แบบประเมิน
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrTab('certificate');
                  setCopiedPrType(null);
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  prTab === 'certificate'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ตรวจเกียรติบัตร
              </button>
            </div>

            {/* QR Code Container Card */}
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-center w-[230px] h-[230px] shrink-0 overflow-hidden">
                <QRCodeCanvas
                  value={currentPrUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  style={{ width: '200px', height: '200px' }}
                />
              </div>
              <div className="mt-3 text-center w-full px-2">
                <span className="font-mono text-[11px] text-slate-500 break-all select-all px-2.5 py-1 rounded-lg bg-white border border-slate-200/70 inline-block max-w-full truncate">
                  {currentPrUrl}
                </span>
              </div>
            </div>

            {/* Hidden High-Resolution Canvas for 1024x1024 PNG download */}
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
              <div ref={qrCanvasContainerRef}>
                <QRCodeCanvas
                  value={currentPrUrl}
                  size={1024}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Button 1: Download PNG */}
              <button
                type="button"
                onClick={handleDownloadQrCode}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>ดาวน์โหลดรูปภาพ QR Code (PNG)</span>
              </button>

              {/* Button 2: Copy Link for current tab */}
              <button
                type="button"
                onClick={() => handleCopyPrLink(currentPrUrl, prTab)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedPrType === prTab ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>คัดลอกลิงก์สำเร็จแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>{currentCopyButtonText}</span>
                  </>
                )}
              </button>

              {/* Button 3: Direct link to verify / preview */}
              <a
                href={currentPrUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>เปิดดูหน้าเว็บในแท็บใหม่</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hidden off-screen Certificate Renderer for batch export */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1200px',
          zIndex: -100,
          pointerEvents: 'none',
          opacity: 0.99,
        }}
      >
        {currentExportAttendee && (
          <div ref={hiddenCertExportRef} style={{ width: '1200px' }}>
            <CertificateRenderer
              attendee={{
                id: currentExportAttendee.id,
                full_name: currentExportAttendee.full_name,
                title_name: currentExportAttendee.title_name,
                position: currentExportAttendee.position,
                organization: currentExportAttendee.organization,
                certificate_no: currentExportAttendee.certificate_no,
                event_title: event?.title,
                event_id: eventId,
              }}
              config={certConfig}
              showActions={false}
              isEditable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
