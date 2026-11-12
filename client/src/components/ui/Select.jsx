import { inputClass } from './Input';

export default function Select({ className = '', children, ...rest }) {
  return (
    <select className={`${inputClass} h-[38px] cursor-pointer ${className}`} {...rest}>
      {children}
    </select>
  );
}
