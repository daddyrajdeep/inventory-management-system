export default function ComingSoon({ text = 'This page is being built.' }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
