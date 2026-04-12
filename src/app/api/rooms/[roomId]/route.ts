import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { updateRoomSchema } from '@/lib/validations';

type Params = { params: Promise<{ roomId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateRoomSchema.safeParse({ ...body, id: roomId });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { id, name, description, welcomeMessage, duration, color, autoOpenHour, autoCloseHour } = parsed.data;

    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        ...(name && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(welcomeMessage !== undefined && { welcome_message: welcomeMessage ?? null }),
        ...(duration && { session_duration_minutes: duration }),
        ...(color && { brand_color: color }),
        ...(autoOpenHour !== undefined && { auto_open_hour: autoOpenHour }),
        ...(autoCloseHour !== undefined && { auto_close_hour: autoCloseHour }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ room });
  } catch (err) {
    console.error('[PATCH /api/rooms]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('rooms').delete().eq('id', roomId).eq('owner_id', user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/rooms]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
