type TopbarProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "24px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "var(--text-3xl)",
            color: "var(--text-heading)",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {action}
        </div>
      )}
    </div>
  );
}
