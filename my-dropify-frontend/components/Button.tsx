'use client'

type Props = {
  label: string
  onClick?: () => void
  disabled?: boolean
}

export default function Button({ label, onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full
        px-4 py-2.5
        rounded-lg
        font-medium
        transition-all duration-300
        border border-[#2d333b]
        backdrop-blur-xl
        shadow-[0_0_15px_rgba(122,162,247,0.2)]
        ${
          disabled
            ? 'bg-[#1a1d24] text-gray-500 cursor-not-allowed'
            : 'bg-[#1f2937] text-white hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(122,162,247,0.5)] hover:border-[#7aa2f7]'
        }
      `}
    >
      {label}
    </button>
  )
}
