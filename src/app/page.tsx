type HealthResponse = {
  status: string;
  timestamp: string;
};

export default async function Home() {
  const res = await fetch("http://localhost:3000/api/health", {
    cache: "no-store",
  });

  const data = (await res.json()) as HealthResponse;

  return (
    <main>
      <p>Nuave</p>
      <p>API status: {data.status}</p>
      <p>Timestamp: {data.timestamp}</p>
    </main>
  );
}
