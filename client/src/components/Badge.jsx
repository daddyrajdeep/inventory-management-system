import BaseBadge from './ui/Badge';

// Legacy tone names map onto the status system so unrestyled pages keep working.
const alias = { green: 'ok', amber: 'low', red: 'out', blue: 'info', gray: 'neutral' };

export default function Badge({ tone = 'neutral', children, ...rest }) {
  return (
    <BaseBadge tone={alias[tone] || tone} {...rest}>
      {children}
    </BaseBadge>
  );
}
