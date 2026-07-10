type DashboardStatsProps = {
  total: number;
  favorites: number;
  providers: number;
  currentFilter: string;
};

type StatCardProps = {
  title: string;
  value: string | number;
};

function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#2d2d2d",
        borderRadius: 12,
        padding: 20,
        minWidth: 180,
        flex: 1,
      }}
    >
      <div
        style={{
          color: "#b0b0b0",
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardStats({
  total,
  favorites,
  providers,
  currentFilter,
}: DashboardStatsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 30,
      }}
    >
      <StatCard
        title="📄 Prompts"
        value={total}
      />

      <StatCard
        title="⭐ Favorites"
        value={favorites}
      />

      <StatCard
        title="🤖 Providers"
        value={providers}
      />

      <StatCard
        title="🔍 Filter"
        value={currentFilter}
      />
    </div>
  );
}