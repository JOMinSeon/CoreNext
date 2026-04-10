import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, name, email, password, departmentId, position } = body;

    if (!employeeId || !name || !email || !password) {
      return NextResponse.json({ success: false, error: '필수 항목이 누락되었습니다' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: '비밀번호는 6자 이상이어야 합니다' }, { status: 400 });
    }

    const existingEmployee = await queryOne<any>`
      SELECT id FROM employees WHERE employee_id = ${employeeId}
    `;

    if (existingEmployee) {
      return NextResponse.json({ success: false, error: '이미 존재하는 사원아이디입니다' }, { status: 400 });
    }

    const existingEmail = await queryOne<any>`
      SELECT id FROM employees WHERE email = ${email}
    `;

    if (existingEmail) {
      return NextResponse.json({ success: false, error: '이미 존재하는 이메일입니다' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const employee = await queryOne<any>`
      INSERT INTO employees (id, employee_id, name, email, password, department_id, position, role, status)
      VALUES (${id}, ${employeeId}, ${name}, ${email}, ${hashedPassword}, ${departmentId || null}, ${position || null}, 'staff', 'active')
      RETURNING id, employee_id, name, email, role, status, created_at
    `;

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
