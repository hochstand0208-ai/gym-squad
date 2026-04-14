import type { VercelRequest, VercelResponse } from '@vercel/node';

const LINE_API = 'https://api.line.me/v2/bot/message/push';

function buildMessage(body: {
  nickname: string;
  avatar: string;
  type: 'strength' | 'cardio';
  details: Record<string, unknown>;
  memo: string;
}): string {
  const { nickname, avatar, type, details, memo } = body;

  const header = `${avatar} ${nickname} が記録しました！`;

  let content = '';
  if (type === 'strength') {
    content += `🏋️ 筋トレ\n`;
    content += `種目：${details.exercise}\n`;
    content += `${details.sets}セット × ${details.reps}回`;
    if (details.weight) content += ` / ${details.weight}kg`;
  } else {
    content += `🏃 有酸素\n`;
    content += `種目：${details.exercise}\n`;
    content += `${details.duration}分`;
    if (details.distance) content += ` / ${details.distance}km`;
  }

  const footer = memo ? `\n"${memo}"\n\n─ GYM SQUAD 🔥` : `\n─ GYM SQUAD 🔥`;

  return `${header}\n\n${content}${footer}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token   = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId) {
    // 環境変数未設定の場合はスキップ（通知なしで正常終了）
    console.warn('LINE env vars not set. Skipping notification.');
    return res.status(200).json({ ok: true, skipped: true });
  }

  const text = buildMessage(req.body);

  const response = await fetch(LINE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: 'text', text }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('LINE API error:', error);
    return res.status(500).json({ error });
  }

  return res.status(200).json({ ok: true });
}
