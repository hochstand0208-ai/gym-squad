/**
 * 絵文字アバターと写真URLの両方に対応した共通アバター表示コンポーネント
 */
interface Props {
  avatar: string;
  size?: number;
  className?: string;
}

export function AvatarImg({ avatar, size = 40, className }: Props) {
  const isPhoto = avatar.startsWith('http') || avatar.startsWith('blob:') || avatar.startsWith('data:');

  const wrapStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-elevated)',
    overflow: 'hidden',
    border: '1.5px solid var(--border)',
  };

  return (
    <div style={wrapStyle} className={className}>
      {isPhoto ? (
        <img
          src={avatar}
          alt="avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{avatar}</span>
      )}
    </div>
  );
}
