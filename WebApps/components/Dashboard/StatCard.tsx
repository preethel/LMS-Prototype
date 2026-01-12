export default function StatCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </h3>
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-extrabold text-gray-900">{value}</span>
      </div>
      <p className="mt-1 text-sm text-gray-400">{subtext}</p>
    </div>
  );
}
