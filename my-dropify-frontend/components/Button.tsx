export default function Button({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-black text-white rounded"
    >
      {label}
    </button>
  )
}
