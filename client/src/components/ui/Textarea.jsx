import { inputClass } from './Input';

export default function Textarea({ className = '', rows = 3, ...rest }) {
  return <textarea rows={rows} className={`${inputClass} py-2 ${className}`} {...rest} />;
}
