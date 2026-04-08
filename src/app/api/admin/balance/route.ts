import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'antigravityfinancial@gmail.com').toLowerCase();

export async function POST(request: Request) {
  const { userEmail, adminEmail, adjustmentType, amount, reason, notes } =
    await request.json();

  if (adminEmail?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!userEmail || !adminEmail || !adjustmentType || amount == null || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (amount < 0) {
    return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch current balance
  const { data: userRow, error: fetchErr } = await supabase
    .from('users')
    .select('account_balance')
    .eq('email', userEmail.toLowerCase())
    .single();

  if (fetchErr || !userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const prevBalance: number = userRow.account_balance ?? 0;

  let newBalance: number;
  if (adjustmentType === 'set_to') {
    newBalance = amount;
  } else if (adjustmentType === 'add') {
    newBalance = prevBalance + amount;
  } else if (adjustmentType === 'subtract') {
    newBalance = Math.max(0, prevBalance - amount);
  } else {
    return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 });
  }

  // Update balance
  const { error: updateErr } = await supabase
    .from('users')
    .update({ account_balance: newBalance })
    .eq('email', userEmail.toLowerCase());

  if (updateErr) {
    console.error('Balance update error:', updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Write audit record
  const changeAmount = newBalance - prevBalance;
  const { error: auditErr } = await supabase.from('balance_audit').insert({
    user_email: userEmail.toLowerCase(),
    admin_email: adminEmail.toLowerCase(),
    prev_balance: prevBalance,
    new_balance: newBalance,
    change_amount: changeAmount,
    adjustment_type: adjustmentType,
    reason,
    notes: notes?.trim() || null,
  });

  if (auditErr) {
    console.error('Audit write error:', auditErr);
    // Non-fatal — balance was already updated
  }

  // Notify user
  if (newBalance !== prevBalance) {
    const diff = newBalance - prevBalance;
    const absFormatted = Math.abs(diff).toLocaleString('en-US', {
      minimumFractionDigits: 2,
    });
    const newFormatted = newBalance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    });

    await supabase.from('user_notifications').insert({
      user_email: userEmail.toLowerCase(),
      title: diff > 0 ? 'Funds Added to Your Account' : 'Account Balance Updated',
      message:
        diff > 0
          ? `$${absFormatted} has been credited to your account. Your new balance is $${newFormatted}.`
          : `Your account balance has been updated to $${newFormatted}.`,
      type: diff > 0 ? 'success' : 'info',
    });
  }

  return NextResponse.json({ success: true, newBalance, prevBalance });
}
