'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Download, Printer, Move, Check, Type, Sparkles, QrCode, RefreshCw, FileDown, FileText, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface BlockStyle {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  fontSize?: number; // Font size in px (base 1000px width)
  color?: string; // Hex color code
  fontWeight?: 'normal' | 'semibold' | 'bold' | 'bolder' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  letterSpacing?: number; // in px
  textShadow?: 'none' | 'soft' | 'glow' | 'strong' | 'gold' | 'outline';
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  enabled?: boolean;
  showOrg?: boolean;
  // QR Code settings for cert_no_block
  showQr?: boolean;
  qrSize?: number;
  qrBg?: 'white' | 'transparent';
  showText?: boolean;
  showScanLabel?: boolean;
}

export interface CertificateConfig {
  background_image?: string | null;
  bg_image_url?: string | null;
  course_name?: string;
  certificate_no_prefix?: string;
  name_block?: BlockStyle;
  course_block?: BlockStyle;
  cert_no_block?: BlockStyle;
  title?: string;
  signatory_1_name?: string;
  signatory_1_position?: string;
  signatory_1_image?: string | null;
}

export interface CertificateAttendeeData {
  id?: string;
  full_name: string;
  title_name?: string;
  position?: string;
  organization?: string;
  certificate_no?: string;
  issue_date?: string;
  event_title?: string;
  event_id?: string;
  verification_url?: string;
}

interface CertificateRendererProps {
  attendee: CertificateAttendeeData;
  config?: CertificateConfig;
  className?: string;
  showActions?: boolean;
  isEditable?: boolean;
  selectedBlock?: 'name' | 'course' | 'cert_no' | null;
  onSelectBlock?: (blockKey: 'name' | 'course' | 'cert_no') => void;
  onBlockChange?: (blockKey: 'name' | 'course' | 'cert_no', updated: BlockStyle) => void;
}

export const FONT_FAMILIES: Record<string, { name: string; thaiName: string; css: string; category: string }> = {
  charm: { name: 'Charm', thaiName: 'ชาร์ม (อาลักษณ์ ริบบิ้นหรู)', css: "'Charm', cursive", category: 'formal' },
  srisakdi: { name: 'Srisakdi', thaiName: 'ศรีศักดิ์ (ลายไทยวิจิตร)', css: "'Srisakdi', cursive", category: 'formal' },
  charmonman: { name: 'Charmonman', thaiName: 'ชาร์มอนมาน (คัดลายมืออ่อนช้อย)', css: "'Charmonman', cursive", category: 'formal' },
  sarabun: { name: 'Sarabun', thaiName: 'สารบรรณ (ทางการมาตรฐาน)', css: "'Sarabun', 'TH Sarabun New', sans-serif", category: 'formal' },
  trirong: { name: 'Trirong', thaiName: 'ไตรโรง (Serif สง่างาม)', css: "'Trirong', serif", category: 'formal' },
  taviraj: { name: 'Taviraj', thaiName: 'ทวิราช (Serif หรูหรา)', css: "'Taviraj', serif", category: 'formal' },
  pridi: { name: 'Pridi', thaiName: 'ปรีดี (Serif พรีเมียม)', css: "'Pridi', serif", category: 'formal' },
  niramit: { name: 'Niramit', thaiName: 'นิรมิต (Serif เรียบหรู)', css: "'Niramit', serif", category: 'formal' },
  prompt: { name: 'Prompt', thaiName: 'พร้อมท์ (โมเดิร์นยอดนิยม)', css: "'Prompt', sans-serif", category: 'modern' },
  kanit: { name: 'Kanit', thaiName: 'คณิต (ทันสมัย หนักแน่น)', css: "'Kanit', sans-serif", category: 'modern' },
  mitr: { name: 'Mitr', thaiName: 'มิตร (โมเดิร์น มนสบายตา)', css: "'Mitr', sans-serif", category: 'modern' },
  krub: { name: 'Krub', thaiName: 'ครับ (มินิมอล เหลี่ยมคม)', css: "'Krub', sans-serif", category: 'modern' },
  chakra: { name: 'Chakra Petch', thaiName: 'จักรเพชร (เทคโนโลยี สปอร์ต)', css: "'Chakra Petch', sans-serif", category: 'modern' },
  sriracha: { name: 'Sriracha', thaiName: 'ศรีราชา (พู่กันธรรมชาติ)', css: "'Sriracha', cursive", category: 'artistic' },
  pattaya: { name: 'Pattaya', thaiName: 'พัทยา (ลายมือพู่กันหนา)', css: "'Pattaya', cursive", category: 'artistic' },
  mali: { name: 'Mali', thaiName: 'มะลิ (ลายมือน่ารัก)', css: "'Mali', cursive", category: 'artistic' },
  itim: { name: 'Itim', thaiName: 'ไอติม (ลายมือนุ่มนวล)', css: "'Itim', cursive", category: 'artistic' },
};

export const DEFAULT_NAME_BLOCK: BlockStyle = {
  x: 50,
  y: 47,
  fontSize: 34,
  color: '#0f172a',
  fontWeight: 'bold',
  fontStyle: 'normal',
  textDecoration: 'none',
  letterSpacing: 0,
  textShadow: 'none',
  textAlign: 'center',
  fontFamily: 'charm',
  enabled: true,
  showOrg: false,
};

export const DEFAULT_COURSE_BLOCK: BlockStyle = {
  x: 50,
  y: 62,
  fontSize: 22,
  color: '#1e293b',
  fontWeight: 'bold',
  fontStyle: 'normal',
  textDecoration: 'none',
  letterSpacing: 0,
  textShadow: 'none',
  textAlign: 'center',
  fontFamily: 'sarabun',
  enabled: true,
};

export const DEFAULT_CERT_NO_BLOCK: BlockStyle = {
  x: 90,
  y: 11,
  fontSize: 11,
  color: '#475569',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  letterSpacing: 0,
  textShadow: 'none',
  textAlign: 'center',
  fontFamily: 'sarabun',
  enabled: true,
  showQr: true,
  qrSize: 52,
  qrBg: 'white',
  showText: true,
  showScanLabel: true,
};

export default function CertificateRenderer({
  attendee,
  config = {},
  className = '',
  showActions = true,
  isEditable = false,
  selectedBlock,
  onSelectBlock,
  onBlockChange,
}: CertificateRendererProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [draggingBlock, setDraggingBlock] = useState<'name' | 'course' | 'cert_no' | null>(null);

  const bgImage = config.bg_image_url || config.background_image;
  const isCustomBg = Boolean(bgImage);

  const nameBlock: BlockStyle = { ...DEFAULT_NAME_BLOCK, ...(config.name_block || {}) };
  const courseBlock: BlockStyle = { ...DEFAULT_COURSE_BLOCK, ...(config.course_block || {}) };
  const certNoBlock: BlockStyle = { ...DEFAULT_CERT_NO_BLOCK, ...(config.cert_no_block || {}) };

  const displayName = `${attendee.title_name || ''} ${attendee.full_name || ''}`.trim() || 'ชื่อ-นามสกุล ผู้เข้าร่วมกิจกรรม';
  const displayCourse = config.course_name || attendee.event_title || 'โครงการสัมมนาเชิงปฏิบัติการ';
  const displayCertNo = attendee.certificate_no || `${config.certificate_no_prefix || 'CERT-2569'}-0001`;

  const qrVerificationUrl = (() => {
    if (attendee.verification_url) return attendee.verification_url;
    if (typeof window !== 'undefined') {
      const base = window.location.origin;
      return `${base}/certificates/verify/${encodeURIComponent(displayCertNo)}`;
    }
    return `CERTIFICATE:${displayCertNo}`;
  })();

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, blockKey: 'name' | 'course' | 'cert_no') => {
    if (!isEditable) return;
    e.stopPropagation();
    setDraggingBlock(blockKey);
    onSelectBlock?.(blockKey);
  };

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingBlock || !certRef.current || !onBlockChange) return;

    const rect = certRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = ((clientX - rect.left) / rect.width) * 100;
    const relY = ((clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.round(Math.max(2, Math.min(98, relX)) * 10) / 10;
    const clampedY = Math.round(Math.max(2, Math.min(98, relY)) * 10) / 10;

    const currentBlock =
      draggingBlock === 'name' ? nameBlock : draggingBlock === 'course' ? courseBlock : certNoBlock;

    onBlockChange(draggingBlock, {
      ...currentBlock,
      x: clampedX,
      y: clampedY,
    });
  }, [draggingBlock, onBlockChange, nameBlock, courseBlock, certNoBlock]);

  useEffect(() => {
    if (!draggingBlock) return;

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => setDraggingBlock(null);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [draggingBlock, handlePointerMove]);

  const getTextShadowValue = (shadowType?: string) => {
    switch (shadowType) {
      case 'soft': return '0 2px 5px rgba(0, 0, 0, 0.45)';
      case 'strong': return '0 4px 10px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)';
      case 'glow': return '0 0 12px rgba(255, 255, 255, 0.95), 0 0 24px rgba(255, 255, 255, 0.7)';
      case 'gold': return '0 0 14px rgba(234, 179, 8, 0.7), 0 2px 4px rgba(0, 0, 0, 0.4)';
      case 'outline': return '-1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff, 0 2px 6px rgba(0,0,0,0.3)';
      default: return 'none';
    }
  };

  const getBlockStyle = (block: BlockStyle) => {
    const textAlign = block.textAlign || 'center';
    let transform = 'translate(-50%, -50%)';
    if (textAlign === 'left') transform = 'translate(0%, -50%)';
    if (textAlign === 'right') transform = 'translate(-100%, -50%)';

    const fontInfo = FONT_FAMILIES[block.fontFamily || 'sarabun'] || FONT_FAMILIES.sarabun;
    const baseFontSize = block.fontSize || 24;

    return {
      left: `${block.x}%`,
      top: `${block.y}%`,
      transform,
      textAlign,
      fontSize: `calc(${baseFontSize / 10}cqw)`,
      color: block.color || '#0f172a',
      fontWeight: block.fontWeight || 'bold',
      fontStyle: block.fontStyle || 'normal',
      textDecoration: block.textDecoration || 'none',
      letterSpacing: block.letterSpacing ? `calc(${block.letterSpacing / 10}cqw)` : 'normal',
      textShadow: getTextShadowValue(block.textShadow),
      fontFamily: fontInfo.css,
    };
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handleDownloadPdf = async () => {
    if (!certRef.current) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: isCustomBg ? null : '#ffffff',
        logging: false,
        ignoreElements: (el) => {
          return el.classList.contains('designer-handle') || el.classList.contains('designer-outline');
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
      const safeName = displayName.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9_-]/g, '_');
      pdf.save(`เกียรติบัตร_${safeName}.pdf`);
    } catch (err) {
      console.error('Download PDF error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!certRef.current) return;
    setDownloadingPng(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: isCustomBg ? null : '#ffffff',
        logging: false,
        ignoreElements: (el) => {
          return el.classList.contains('designer-handle') || el.classList.contains('designer-outline');
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = displayName.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9_-]/g, '_');
      link.download = `เกียรติบัตร_${safeName}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Download PNG error:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handlePrint = async () => {
    if (!certRef.current) return;
    setPrinting(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: isCustomBg ? null : '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>พิมพ์เกียรติบัตร - ${displayName}</title>
            <style>
              @page { size: A4 landscape; margin: 0mm; }
              @media print {
                @page { size: A4 landscape; margin: 0mm; }
                html, body { width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 0 !important; }
                .cert-print-img { width: 297mm !important; height: 209.5mm !important; object-fit: fill !important; }
              }
              html, body { margin: 0; padding: 0; background-color: #ffffff; }
              .cert-print-img { width: 297mm; height: 209.5mm; display: block; object-fit: fill; }
            </style>
          </head>
          <body>
            <img class="cert-print-img" src="${imgData}" />
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 600); }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('Print certificate error:', err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Certificate Frame */}
      <div className="w-full max-w-[1000px] overflow-hidden rounded-2xl shadow-xl border border-slate-300 bg-white relative">
        <div
          ref={certRef}
          className={`relative w-full aspect-[297/210] select-none overflow-hidden ${
            isEditable ? 'cursor-crosshair' : ''
          }`}
          style={{
            containerType: 'inline-size',
            backgroundImage: isCustomBg ? `url(${bgImage})` : undefined,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: isCustomBg ? 'transparent' : '#ffffff',
          }}
          onClick={() => {
            if (isEditable && onSelectBlock) {
              onSelectBlock('name');
            }
          }}
        >
          {!isCustomBg && (
            <div className="absolute inset-4 border-2 border-dashed border-slate-200 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-[1.5cqw] text-slate-400 font-medium bg-white/90 px-4 py-1.5 rounded-full border border-slate-200">
                ยังไม่ได้อัปโหลดภาพพื้นหลังเกียรติบัตร
              </span>
            </div>
          )}

          {/* BLOCK 1: CERTIFICATE NO. & VERIFICATION QR CODE */}
          {certNoBlock.enabled !== false && (
            <div
              className={`absolute cursor-move transition-shadow z-20 flex flex-col items-center gap-[0.4cqw] ${
                isEditable ? 'group' : ''
              } ${isEditable && selectedBlock === 'cert_no' ? 'ring-2 ring-blue-500 rounded-lg bg-blue-50/30 p-[0.6cqw]' : 'p-[0.3cqw]'}`}
              style={getBlockStyle(certNoBlock)}
              onMouseDown={(e) => handleDragStart(e, 'cert_no')}
              onTouchStart={(e) => handleDragStart(e, 'cert_no')}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock?.('cert_no');
              }}
            >
              {isEditable && (
                <div className="designer-handle absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded shadow-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1 pointer-events-none whitespace-nowrap z-50">
                  <Move className="w-3 h-3" /> เลขที่ & QR ({certNoBlock.x}%, {certNoBlock.y}%)
                </div>
              )}

              {certNoBlock.showQr !== false && (
                <div
                  className={`p-[0.4cqw] rounded-[0.6cqw] flex items-center justify-center ${
                    certNoBlock.qrBg === 'transparent' ? 'bg-transparent' : 'bg-white shadow-xs border border-slate-200/80'
                  }`}
                  style={{
                    width: `calc(${(certNoBlock.qrSize || 52) / 10}cqw)`,
                    height: `calc(${(certNoBlock.qrSize || 52) / 10}cqw)`,
                  }}
                >
                  <QRCodeSVG
                    value={qrVerificationUrl}
                    size={256}
                    level="M"
                    fgColor={certNoBlock.color || '#0f172a'}
                    bgColor={certNoBlock.qrBg === 'transparent' ? 'transparent' : '#ffffff'}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              )}

              {certNoBlock.showText !== false && (
                <div className="leading-tight select-none text-center">
                  <div className="font-mono font-bold tracking-tight">เลขที่: {displayCertNo}</div>
                  {certNoBlock.showScanLabel !== false && certNoBlock.showQr !== false && (
                    <div
                      className="opacity-75 font-normal tracking-wide mt-[0.1cqw]"
                      style={{ fontSize: `calc(${((certNoBlock.fontSize || 11) * 0.8) / 10}cqw)` }}
                    >
                      สแกนเพื่อตรวจสอบ
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BLOCK 2: RECIPIENT NAME */}
          {nameBlock.enabled !== false && (
            <div
              className={`absolute cursor-move transition-shadow z-30 ${
                isEditable ? 'group' : ''
              } ${isEditable && selectedBlock === 'name' ? 'ring-2 ring-amber-500 rounded-lg bg-amber-50/20 p-[0.4cqw]' : 'p-[0.2cqw]'}`}
              style={getBlockStyle(nameBlock)}
              onMouseDown={(e) => handleDragStart(e, 'name')}
              onTouchStart={(e) => handleDragStart(e, 'name')}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock?.('name');
              }}
            >
              {isEditable && (
                <div className="designer-handle absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-600 text-[10px] font-bold text-white rounded shadow-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1 pointer-events-none whitespace-nowrap z-50">
                  <Move className="w-3 h-3" /> บล็อกชื่อ ({nameBlock.x}%, {nameBlock.y}%)
                </div>
              )}

              <div className="leading-tight tracking-tight select-none">{displayName}</div>

              {nameBlock.showOrg && (attendee.organization || attendee.position) && (
                <div
                  className="opacity-80 mt-[0.2cqw] font-normal"
                  style={{
                    fontSize: `calc(1.4cqw)`,
                    color: nameBlock.color || '#334155',
                  }}
                >
                  {attendee.organization} {attendee.position ? `(${attendee.position})` : ''}
                </div>
              )}
            </div>
          )}

          {/* BLOCK 3: EVENT / COURSE NAME */}
          {courseBlock.enabled !== false && (
            <div
              className={`absolute cursor-move transition-shadow z-20 ${
                isEditable ? 'group' : ''
              } ${isEditable && selectedBlock === 'course' ? 'ring-2 ring-blue-500 rounded-lg bg-blue-50/20 p-[0.4cqw]' : 'p-[0.2cqw]'}`}
              style={getBlockStyle(courseBlock)}
              onMouseDown={(e) => handleDragStart(e, 'course')}
              onTouchStart={(e) => handleDragStart(e, 'course')}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock?.('course');
              }}
            >
              {isEditable && (
                <div className="designer-handle absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded shadow-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1 pointer-events-none whitespace-nowrap z-50">
                  <Move className="w-3 h-3" /> บล็อกหัวข้อกิจกรรม ({courseBlock.x}%, {courseBlock.y}%)
                </div>
              )}

              <div className="leading-snug max-w-3xl px-2 select-none">{displayCourse}</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={downloadingPdf || downloadingPng || printing}
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {downloadingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>กำลังสร้างไฟล์ PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-amber-300" />
                <span>บันทึกเป็นเอกสาร PDF (A4 แนวนอน)</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={downloadingPdf || downloadingPng || printing}
            onClick={handleDownloadPng}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {downloadingPng ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                <span>กำลังบันทึกรูปภาพ...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-200" />
                <span>บันทึกเป็นรูปภาพ PNG</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={downloadingPdf || downloadingPng || printing}
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {printing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4 text-slate-300" />}
            <span>สั่งพิมพ์</span>
          </button>
        </div>
      )}
    </div>
  );
}
