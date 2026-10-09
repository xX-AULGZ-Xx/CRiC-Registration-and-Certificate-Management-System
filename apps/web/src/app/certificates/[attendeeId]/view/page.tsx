'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, AlertCircle } from 'lucide-react';
import CertificateRenderer from '@/components/certificate/CertificateRenderer';
import { fetchApi } from '@/lib/api';

export default function CertificateViewPage() {
  const params = useParams();
  const attendeeId = params.attendeeId as string;

  const [attendee, setAttendee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (attendeeId) {
      loadCertificateData();
    }
  }, [attendeeId]);

  const loadCertificateData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/certificates/attendees/${attendeeId}/data`);
      if (res.success) {
        setAttendee(res.data);
      } else {
        setErrorMsg(res.message || 'ไม่พบข้อมูลเกียรติบัตร');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการโหลดเกียรติบัตร');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">กำลังเตรียมเกียรติบัตรของคุณ...</p>
      </div>
    );
  }

  if (!attendee || errorMsg) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">ไม่สามารถแสดงเกียรติบัตรได้</h2>
        <p className="text-slate-500 text-sm mt-1">{errorMsg}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-semibold mt-4">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  const certConfig = attendee.event?.certificate_config || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้าหลัก</span>
        </Link>

        {attendee.certificate_no && (
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            เลขที่: {attendee.certificate_no}
          </span>
        )}
      </div>

      {/* Certificate Display Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-900">เกียรติบัตรออนไลน์ของคุณ</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            สามารถคลิกปุ่มด้านล่างเพื่อบันทึกเป็นเอกสาร PDF ความคมชัดสูง หรือรูปภาพ PNG
          </p>
        </div>

        <CertificateRenderer
          attendee={{
            id: attendee.id,
            full_name: attendee.full_name,
            title_name: attendee.title_name,
            position: attendee.position,
            organization: attendee.organization,
            certificate_no: attendee.certificate_no,
            event_title: attendee.event?.title,
            event_id: attendee.event_id,
          }}
          config={certConfig}
          showActions={true}
          isEditable={false}
        />
      </div>
    </div>
  );
}
