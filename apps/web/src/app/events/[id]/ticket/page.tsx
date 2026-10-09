'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ArrowRight, Printer, Share2, Award, Calendar, MapPin, UserCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';

function TicketContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const attendeeId = searchParams.get('attendee_id');

  const [attendee, setAttendee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attendeeId) {
      loadAttendee();
    }
  }, [attendeeId]);

  const loadAttendee = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/certificates/attendees/${attendeeId}/data`);
      if (res.success) {
        setAttendee(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลบัตรลงทะเบียน...</p>
      </div>
    );
  }

  if (!attendee) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">ไม่พบข้อมูลบัตรลงทะเบียน</h2>
        <Link href="/" className="text-blue-600 text-sm font-semibold mt-4 inline-block">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const checkInPayload = JSON.stringify({
    type: 'EVENT_CHECKIN',
    event_id: eventId,
    attendee_id: attendee.id,
    phone: attendee.phone,
    citizen_id: attendee.citizen_id,
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      {/* Success Banner */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">ลงทะเบียนสำเร็จเรียบร้อย!</h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          กรุณาบันทึกหรือแคปหน้าจอ QR Code นี้ เพื่อใช้ในการเช็คชื่อเข้าร่วมกิจกรรมหน้างาน
        </p>
      </div>

      {/* Ticket Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:shadow-none print:border-slate-300">
        <div className="bg-gradient-to-r from-blue-800 to-indigo-800 p-6 text-white text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
            บัตรประจำตัวผู้เข้าร่วมกิจกรรม
          </span>
          <h2 className="text-lg font-bold line-clamp-2">
            {attendee.event?.title || 'กิจกรรมการอบรม'}
          </h2>
        </div>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
            <QRCodeSVG
              value={checkInPayload}
              size={200}
              level="M"
              fgColor="#1e3a8a"
              bgColor="#ffffff"
            />
            <div className="text-[11px] font-mono font-bold text-slate-500 mt-2">
              ID: {attendee.id} | {attendee.phone}
            </div>
          </div>

          {/* Attendee Details */}
          <div className="space-y-1.5 w-full border-t border-slate-100 pt-4">
            <div className="text-lg font-bold text-slate-900">
              {attendee.title_name || ''}{attendee.full_name}
            </div>
            {attendee.position && (
              <div className="text-xs text-slate-600 font-medium">
                ตำแหน่ง: {attendee.position}
              </div>
            )}
            {attendee.organization && (
              <div className="text-xs text-slate-500">
                สังกัด: {attendee.organization}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
            <UserCheck className="w-3.5 h-3.5" />
            <span>สถานะ: {attendee.status === 'checked_in' ? 'เช็คชื่อเรียบร้อยแล้ว' : 'ลงทะเบียนแล้ว (รอเช็คชื่อ)'}</span>
          </div>
        </div>

        {/* Next step prompt */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <Printer className="w-4 h-4" /> พิมพ์หรือบันทึกบัตร
          </button>

          <Link
            href={`/surveys/${eventId}?attendee_id=${attendee.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
          >
            <span>ทำแบบประเมินความพึงพอใจ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-xs">กำลังโหลดบัตรลงทะเบียน...</p>
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  );
}
