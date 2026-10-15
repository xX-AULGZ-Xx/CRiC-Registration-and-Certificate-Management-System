import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma';

const router = Router();

// GET /api/v1/install/status - Check if system is installed
router.get('/status', async (req: Request, res: Response) => {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    const isInstalled = !!adminUser;

    return res.json({
      success: true,
      data: {
        is_installed: isInstalled,
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถตรวจสอบสถานะการติดตั้งระบบได้',
      error: error.message,
    });
  }
});

// POST /api/v1/install/setup - Initial system installation wizard
router.post('/setup', async (req: Request, res: Response) => {
  try {
    // 1. Check if already installed
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'ระบบได้ผ่านการติดตั้งและตั้งค่าบัญชีผู้ดูแลแล้ว ไม่สามารถติดตั้งซ้ำได้',
      });
    }

    const {
      admin_username,
      admin_password,
      admin_full_name,
      admin_email,
      admin_position,
      org_name_th,
      org_name_en,
      org_address,
      org_phone,
      org_website,
      default_cert_prefix,
      default_signatory_name,
      default_signatory_title,
    } = req.body;

    // Validate essential fields
    if (!admin_username || !admin_password || !admin_full_name) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลบัญชีผู้ดูแลระบบ (Username, Password, ชื่อ-นามสกุล) ให้ครบถ้วน',
      });
    }

    if (admin_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
      });
    }

    // 2. Create Administrator Account
    const passwordHash = await bcrypt.hash(admin_password.trim(), 10);
    const adminUser = await prisma.user.create({
      data: {
        username: admin_username.trim(),
        password_hash: passwordHash,
        full_name: admin_full_name.trim(),
        email: admin_email ? admin_email.trim() : null,
        position: admin_position ? admin_position.trim() : 'ผู้ดูแลระบบส่วนกลาง',
        organization: org_name_th ? org_name_th.trim() : 'วิทยาลัยอาชีวศึกษาเชียงราย',
        role: 'ADMIN',
        is_active: true,
      },
    });

    // 3. Save Initial Organization & Certificate System Settings
    const initialSettings: Record<string, string> = {
      org_name_th: org_name_th?.trim() || 'วิทยาลัยอาชีวศึกษาเชียงราย',
      org_name_en: org_name_en?.trim() || 'Chiang Rai Vocational College',
      org_address: org_address?.trim() || '',
      org_phone: org_phone?.trim() || '',
      org_website: org_website?.trim() || 'https://www.crvc.ac.th',
      default_cert_prefix: default_cert_prefix?.trim() || 'วอศ.ชร-2569',
      default_signatory_name: default_signatory_name?.trim() || '',
      default_signatory_title: default_signatory_title?.trim() || 'ผู้อำนวยการวิทยาลัย',
      default_font_family: 'sarabun',
      google_login_enabled: 'true',
      google_auto_register: 'true',
    };

    for (const [key, value] of Object.entries(initialSettings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: `Initial setup: ${key}` },
      });
    }

    // 4. Create Default Evaluation Template if not exists
    const templateCount = await prisma.evaluationTemplate.count();
    if (templateCount === 0) {
      await prisma.evaluationTemplate.create({
        data: {
          title: 'แบบประเมินความพึงพอใจการจัดโครงการ/การอบรมมาตรฐาน',
          description: 'แบบประเมินมาตรฐานเพื่อสำรวจความคิดเห็นและความพึงพอใจของผู้เข้าร่วมโครงการตามเกณฑ์มาตรฐานอาชีวศึกษา',
          category: 'GENERAL',
          target_responses: 50,
          is_default: true,
          theme_config: {
            font: 'prompt',
            color: 'indigo',
            bg_style: 'gradient',
            header_style: 'gradient',
            border_radius: 'rounded-2xl',
          },
          sections: [
            {
              title: 'ตอนที่ 1: ข้อมูลทั่วไปของผู้ตอบแบบประเมิน',
              order_index: 0,
              questions: [
                {
                  question_text: 'เพศสภาพ',
                  question_type: 'RADIO',
                  options: ['ชาย', 'หญิง', 'ไม่ระบุ'],
                  is_required: true,
                  order_index: 0,
                },
                {
                  question_text: 'สถานะผู้ตอบแบบประเมิน',
                  question_type: 'RADIO',
                  options: ['นักเรียน/นักศึกษา', 'ครู/อาจารย์', 'บุคลากรทางการศึกษา', 'ประชาชนทั่วไป'],
                  is_required: true,
                  order_index: 1,
                },
              ],
            },
            {
              title: 'ตอนที่ 2: ความพึงพอใจต่อการดำเนินโครงการ',
              order_index: 1,
              questions: [
                {
                  question_text: 'ความชัดเจนของวัตถุประสงค์และประโยชน์ที่ได้รับ',
                  question_type: 'RATING_5',
                  is_required: true,
                  order_index: 0,
                },
                {
                  question_text: 'ความเหมาะสมของระยะเวลาและสถานที่จัดกิจกรรม',
                  question_type: 'RATING_5',
                  is_required: true,
                  order_index: 1,
                },
                {
                  question_text: 'ความพร้อมของอุปกรณ์ โสตทัศนูปกรณ์ และสัญญาณอินเทอร์เน็ต',
                  question_type: 'RATING_5',
                  is_required: true,
                  order_index: 2,
                },
                {
                  question_text: 'ความเชี่ยวชาญและการถ่ายทอดความรู้ของวิทยากร',
                  question_type: 'RATING_5',
                  is_required: true,
                  order_index: 3,
                },
                {
                  question_text: 'ความพึงพอใจในภาพรวมต่อการจัดกิจกรรมครั้งนี้',
                  question_type: 'RATING_5',
                  is_required: true,
                  order_index: 4,
                },
              ],
            },
            {
              title: 'ตอนที่ 3: ข้อเสนอแนะเพื่อการพัฒนาและปรับปรุง',
              order_index: 2,
              questions: [
                {
                  question_text: 'ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมเพื่อนำไปพัฒนาในครั้งต่อไป',
                  question_type: 'TEXT',
                  is_required: false,
                  order_index: 0,
                },
              ],
            },
          ],
        },
      });
    }

    return res.json({
      success: true,
      message: 'ติดตั้งระบบและสร้างบัญชีผู้ดูแลระบบเสร็จสมบูรณ์',
      data: {
        admin_username: adminUser.username,
        admin_full_name: adminUser.full_name,
      },
    });
  } catch (error: any) {
    console.error('Install setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการติดตั้งระบบ',
      error: error.message,
    });
  }
});

export default router;
