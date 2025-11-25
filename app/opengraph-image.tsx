import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EventLite - Gestion d'événements simplifiée";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f7f5",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(61, 139, 64, 0.15), transparent)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 32 32"
            fill="none"
          >
            <circle cx="16" cy="16" r="15" fill="#3d8b40" />
            <rect x="7" y="10" width="18" height="14" rx="2" fill="white" />
            <rect x="7" y="10" width="18" height="5" rx="2" fill="#2d6b30" />
            <rect x="7" y="13" width="18" height="2" fill="#2d6b30" />
            <rect x="11" y="7" width="2" height="5" rx="1" fill="white" />
            <rect x="19" y="7" width="2" height="5" rx="1" fill="white" />
            <circle cx="11" cy="19" r="1.5" fill="#3d8b40" />
            <circle cx="16" cy="19" r="1.5" fill="#3d8b40" />
            <circle cx="21" cy="19" r="1.5" fill="#3d8b40" />
          </svg>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#1a3d1a",
              letterSpacing: "-0.02em",
            }}
          >
            EventLite
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#4a6a4a",
            marginBottom: "60px",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Gestion d'événements simplifiée
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: "40px",
          }}
        >
          {["Inscriptions", "Liste d'attente", "Notifications"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: "white",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#3d8b40",
                  }}
                />
                <span
                  style={{
                    fontSize: 20,
                    color: "#2d4a2d",
                    fontWeight: 500,
                  }}
                >
                  {feature}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
