import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const offset = (page - 1) * pageSize;

    let logs;
    let totalResult;

    if (targetType && targetId) {
      logs = await query<any>`
        SELECT al.*, e.name as employee_name
        FROM activity_logs al
        LEFT JOIN employees e ON al.user_id = e.id
        WHERE al.target_type = ${targetType} AND al.target_id = ${targetId}
        ORDER BY al.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countResult = await query<{ count: string }>`
        SELECT COUNT(*) as count FROM activity_logs 
        WHERE target_type = ${targetType} AND target_id = ${targetId}
      `;
      totalResult = countResult[0];
    } else if (targetType) {
      logs = await query<any>`
        SELECT al.*, e.name as employee_name
        FROM activity_logs al
        LEFT JOIN employees e ON al.user_id = e.id
        WHERE al.target_type = ${targetType}
        ORDER BY al.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countResult = await query<{ count: string }>`
        SELECT COUNT(*) as count FROM activity_logs WHERE target_type = ${targetType}
      `;
      totalResult = countResult[0];
    } else {
      logs = await query<any>`
        SELECT al.*, e.name as employee_name
        FROM activity_logs al
        LEFT JOIN employees e ON al.user_id = e.id
        ORDER BY al.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countResult = await query<{ count: string }>`SELECT COUNT(*) as count FROM activity_logs`;
      totalResult = countResult[0];
    }

    const total = parseInt(totalResult?.count || '0');

    return NextResponse.json({
      success: true,
      data: logs.map((l: any) => ({
        ...l,
        employees: l.employee_name ? { name: l.employee_name } : null,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Activity logs GET error:', error);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
