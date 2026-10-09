import { PrismaClient, QuestionType, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Default Admin User
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: adminPassword,
      email: 'admin@crvc.ac.th',
      full_name: 'ผู้ดูแลระบบ (Admin)',
      role: 'ADMIN',
      position: 'นักวิชาการคอมพิวเตอร์',
      organization: 'วิทยาลัยอาชีวศึกษาเชียงราย',
    },
  });

  // 2. Create Default Organizer User
  const orgPassword = await bcrypt.hash('password1234', 10);
  const organizer = await prisma.user.upsert({
    where: { username: 'organizer' },
    update: {},
    create: {
      username: 'organizer',
      password_hash: orgPassword,
      email: 'teacher@crvc.ac.th',
      full_name: 'ครูผู้จัดกิจกรรม (Organizer)',
      role: 'ORGANIZER',
      position: 'ครูชำนาญการ',
      organization: 'วิทยาลัยอาชีวศึกษาเชียงราย',
    },
  });

  // 3. Create Default Evaluation Templates
  const defaultTemplate = await prisma.evaluationTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: {
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
          description: 'กรุณาเลือกข้อมูลตามความเป็นจริง',
          order_index: 1,
          questions: [
            {
              question_text: 'เพศ',
              question_type: QuestionType.RADIO,
              options: ['ชาย', 'หญิง', 'เพศทางเลือก / อื่นๆ'],
              order_index: 1,
              is_required: true,
            },
            {
              question_text: 'สถานะ / ตำแหน่งของผู้ตอบแบบประเมิน',
              question_type: QuestionType.RADIO,
              options: ['นักเรียน / นักศึกษา', 'ครู / อาจารย์', 'บุคลากรทางการศึกษา', 'บุคคลทั่วไป'],
              order_index: 2,
              is_required: true,
            },
          ],
        },
        {
          title: 'ตอนที่ 2: ระดับความพึงพอใจต่อการดำเนินงานโครงการ',
          description: 'ระดับคะแนน: 5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด',
          order_index: 2,
          questions: [
            {
              question_text: '1. การประชาสัมพันธ์โครงการและการแจ้งข้อมูลข่าวสาร',
              question_type: QuestionType.RATING_5,
              order_index: 1,
              is_required: true,
            },
            {
              question_text: '2. ความเหมาะสมของขั้นตอนและรูปแบบการจัดกิจกรรม',
              question_type: QuestionType.RATING_5,
              order_index: 2,
              is_required: true,
            },
            {
              question_text: '3. ความพร้อมของสถานที่ อุปกรณ์ และสื่อการเรียนรู้',
              question_type: QuestionType.RATING_5,
              order_index: 3,
              is_required: true,
            },
            {
              question_text: '4. ความรู้ความสามารถและการถ่ายทอดของวิทยากร',
              question_type: QuestionType.RATING_5,
              order_index: 4,
              is_required: true,
            },
            {
              question_text: '5. ประโยชน์และความรู้ที่ได้รับสามารถนำไปประยุกต์ใช้ได้จริง',
              question_type: QuestionType.RATING_5,
              order_index: 5,
              is_required: true,
            },
            {
              question_text: '6. ความพึงพอใจโดยรวมต่อการจัดกิจกรรมในครั้งนี้',
              question_type: QuestionType.RATING_5,
              order_index: 6,
              is_required: true,
            },
          ],
        },
        {
          title: 'ตอนที่ 3: ข้อเสนอแนะและความคิดเห็นเพิ่มเติม',
          description: 'ข้อเสนอแนะเพื่อการปรับปรุงและพัฒนาโครงการในครั้งต่อไป',
          order_index: 3,
          questions: [
            {
              question_text: 'ข้อเสนอแนะหรือสิ่งที่ต้องการให้ปรับปรุง',
              question_type: QuestionType.TEXT,
              order_index: 1,
              is_required: false,
            },
          ],
        },
      ],
    },
  });

  // 4. Create Demo Event
  const demoEvent = await prisma.event.upsert({
    where: { event_code: 'EVT-2569-0001' },
    update: {},
    create: {
      event_code: 'EVT-2569-0001',
      project_ref_code: 'PRJ-69-001',
      title: 'โครงการอบรมเชิงปฏิบัติการการใช้เทคโนโลยีปัญญาประดิษฐ์ (AI) ในการจัดการเรียนรู้',
      description: 'โครงการพัฒนาศักยภาพครูและบุคลากรทางการศึกษาในการนำเทคโนโลยี AI ยุคใหม่มาประยุกต์ใช้ในการสร้างสื่อนวัตกรรมการสอน',
      organizer_id: organizer.id,
      location: 'ห้องประชุมชงโค อาคารวิทยบริการ วิทยาลัยอาชีวศึกษาเชียงราย',
      start_date: new Date('2026-10-15T09:00:00Z'),
      end_date: new Date('2026-10-15T16:30:00Z'),
      registration_start: new Date('2026-10-01T00:00:00Z'),
      registration_end: new Date('2026-10-14T23:59:59Z'),
      max_attendees: 100,
      status: EventStatus.OPEN,
      registration_config: {
        fields: ['title_name', 'full_name', 'position', 'organization', 'phone', 'email'],
        require_check_in_for_certificate: true,
      },
      certificate_config: {
        certificate_no_prefix: 'วอศ.ชร-อบรม-2569',
        require_evaluation: true,
        require_check_in: true,
        bg_image_url: '',
        title_text: 'เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า',
        signatory_name: 'ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย',
        signatory_position: 'ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย',
      },
    },
  });

  // 5. Create Evaluation Form for Demo Event
  const evalForm = await prisma.evaluationForm.upsert({
    where: { event_id: demoEvent.id },
    update: {},
    create: {
      event_id: demoEvent.id,
      title: 'แบบประเมินความพึงพอใจ - ' + demoEvent.title,
      description: 'แบบประเมินนี้จัดทำขึ้นเพื่อสำรวจความคิดเห็นและความพึงพอใจของผู้เข้าร่วมโครงการ กรุณาทำแบบประเมินเพื่อรับเกียรติบัตร',
      target_responses: 50,
      is_active: true,
      sections: {
        create: [
          {
            title: 'ตอนที่ 1: ข้อมูลทั่วไป',
            order_index: 1,
            questions: {
              create: [
                {
                  question_text: 'เพศ',
                  question_type: QuestionType.RADIO,
                  options: ['ชาย', 'หญิง', 'อื่นๆ'],
                  order_index: 1,
                  is_required: true,
                },
                {
                  question_text: 'สถานะผู้เข้าร่วม',
                  question_type: QuestionType.RADIO,
                  options: ['ครูผู้สอน', 'บุคลากรทางการศึกษา', 'วิทยากร', 'บุคคลภายนอก'],
                  order_index: 2,
                  is_required: true,
                },
              ],
            },
          },
          {
            title: 'ตอนที่ 2: ระดับความพึงพอใจ',
            order_index: 2,
            questions: {
              create: [
                {
                  question_text: '1. ความชัดเจนของเนื้อหาและหัวข้อการอบรม',
                  question_type: QuestionType.RATING_5,
                  order_index: 1,
                  is_required: true,
                },
                {
                  question_text: '2. เทคนิคการถ่ายทอดและความเชี่ยวชาญของวิทยากร',
                  question_type: QuestionType.RATING_5,
                  order_index: 2,
                  is_required: true,
                },
                {
                  question_text: '3. ความสะดวกของสถานที่และโสตทัศนูปกรณ์',
                  question_type: QuestionType.RATING_5,
                  order_index: 3,
                  is_required: true,
                },
                {
                  question_text: '4. การนำความรู้และทักษะไปประยุกต์ใช้ในการทำงานจริง',
                  question_type: QuestionType.RATING_5,
                  order_index: 4,
                  is_required: true,
                },
                {
                  question_text: '5. ความพึงพอใจในภาพรวมของโครงการ',
                  question_type: QuestionType.RATING_5,
                  order_index: 5,
                  is_required: true,
                },
              ],
            },
          },
          {
            title: 'ตอนที่ 3: ความคิดเห็นและข้อเสนอแนะเพิ่มเติม',
            order_index: 3,
            questions: {
              create: [
                {
                  question_text: 'ข้อเสนอแนะหรือสิ่งที่ต้องการให้จัดเพิ่มเติมในครั้งต่อไป',
                  question_type: QuestionType.TEXT,
                  order_index: 1,
                  is_required: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 6. Create Demo Attendee
  await prisma.attendee.create({
    data: {
      event_id: demoEvent.id,
      title_name: 'นาย',
      full_name: 'สมชาย รักเรียน',
      position: 'ครูผู้ช่วย',
      organization: 'วิทยาลัยอาชีวศึกษาเชียงราย',
      phone: '0812345678',
      email: 'somchai@example.com',
      citizen_id: '1579900123456',
      status: 'checked_in',
      checked_in_at: new Date(),
      certificate_no: 'วอศ.ชร-อบรม-2569-0001',
      is_certificate_eligible: true,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
