interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({
  current,
  total,
}: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-slate-600 mb-2">
        <span>
          Passo {current} de {total}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>

      <div className="w-full bg-[#F3E7DE] rounded-full h-3 overflow-hidden">
        <div
          className="bg-[#E5A88B] h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
