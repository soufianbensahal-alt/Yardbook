import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const colors = {
  cream: "#F5F3EC",
  creamLight: "#FBFAF6",
  petrol: "#202623",
  petrolDark: "#202623",
  petrolSoft: "#66736C",
  orange: "#F56B2A",
  orangeDeep: "#D9571D",
  ink: "#202623",
  muted: "#66706A",
  white: "#F5F3EC",
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const eased = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const DashboardPreview = ({ progress }: { progress: number }) => {
  const translateY = interpolate(progress, [0, 1], [46, 0]);
  const scale = interpolate(progress, [0, 1], [0.985, 1]);

  return (
    <AbsoluteFill
      style={{
        opacity: progress,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: "50% 55%",
        background: colors.cream,
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 58,
          borderRadius: 30,
          overflow: "hidden",
          background: colors.white,
          boxShadow: "0 36px 90px rgba(5, 47, 57, 0.16)",
          border: "1px solid rgba(7, 63, 74, 0.09)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 270,
            background: colors.petrol,
            color: colors.white,
          }}
        >
          <div style={{ padding: "42px 34px", fontSize: 28, fontWeight: 800, letterSpacing: 0 }}>
            Yardbook
          </div>
          {["Panel", "Flota", "Reservas", "Pagos", "Vehiculos"].map((item, index) => (
            <div
              key={item}
              style={{
                margin: "10px 24px",
                padding: "17px 20px",
                borderRadius: 14,
                background: index === 0 ? "rgba(245, 138, 19, 0.22)" : "transparent",
                color: index === 0 ? colors.white : "rgba(255, 250, 240, 0.74)",
                fontSize: 21,
                fontWeight: 700,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", left: 270, right: 0, top: 0, bottom: 0 }}>
          <div
            style={{
              height: 128,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 54px",
              borderBottom: "1px solid rgba(7, 63, 74, 0.08)",
            }}
          >
            <div>
              <div style={{ color: colors.muted, fontSize: 20, fontWeight: 700 }}>Control de flota</div>
              <div style={{ color: colors.ink, fontSize: 42, fontWeight: 850, marginTop: 6 }}>Panel principal</div>
            </div>
            <div
              style={{
                width: 186,
                height: 48,
                borderRadius: 24,
                background: colors.orange,
                color: colors.petrolDark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
                fontWeight: 850,
              }}
            >
              12 activos
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 22,
              padding: "34px 54px 0",
            }}
          >
            {[
              ["Reservas hoy", "18", colors.orange],
              ["Vehiculos listos", "46", colors.petrolSoft],
              ["Pagos al dia", "92%", colors.petrol],
            ].map(([label, value, accent]) => (
              <div
                key={label}
                style={{
                  height: 142,
                  borderRadius: 20,
                  background: colors.creamLight,
                  border: "1px solid rgba(7, 63, 74, 0.08)",
                  padding: 28,
                  boxShadow: "0 14px 32px rgba(7, 63, 74, 0.06)",
                }}
              >
                <div style={{ color: colors.muted, fontSize: 19, fontWeight: 750 }}>{label}</div>
                <div style={{ color: accent, fontSize: 52, fontWeight: 900, marginTop: 12 }}>{value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              margin: "32px 54px",
              height: 520,
              borderRadius: 24,
              background: "#fffdf6",
              border: "1px solid rgba(7, 63, 74, 0.08)",
              padding: "30px 34px",
              boxShadow: "0 18px 44px rgba(7, 63, 74, 0.07)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: colors.ink, fontSize: 28, fontWeight: 850 }}>Actividad de alquiler</div>
              <div style={{ color: colors.orangeDeep, fontSize: 19, fontWeight: 850 }}>Actualizado ahora</div>
            </div>
            <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
              {[
                ["Furgoneta Ford Transit", "Entrega 10:30", "Confirmado"],
                ["Seat Ibiza", "Pago recibido", "Pagado"],
                ["Mercedes Vito", "Revision previa", "Preparando"],
                ["Fiat 500", "Reserva nueva", "Activo"],
              ].map(([vehicle, detail, status], index) => (
                <div
                  key={vehicle}
                  style={{
                    height: 78,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 170px",
                    alignItems: "center",
                    padding: "0 20px",
                    borderRadius: 16,
                    background: index % 2 === 0 ? colors.creamLight : "#ffffff",
                    color: colors.ink,
                    fontSize: 20,
                    fontWeight: 760,
                  }}
                >
                  <span>{vehicle}</span>
                  <span style={{ color: colors.muted }}>{detail}</span>
                  <span
                    style={{
                      color: index === 0 ? colors.orangeDeep : colors.petrolSoft,
                      textAlign: "right",
                    }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const YardbookIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoEnter = eased(frame, [0, 0.3 * fps], [0, 1]);
  const logoExit = interpolate(frame, [1.2 * fps, 1.7 * fps], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const appProgress = eased(frame, [1.45 * fps, 1.85 * fps], [0, 1]);
  const finalCreamFade = interpolate(frame, [1.45 * fps, 1.78 * fps], [1, 0], clamp);

  const microBounce = Math.sin((frame - 9) * 0.42) * interpolate(frame, [9, 36], [1, 0.16], clamp);
  const logoScale =
    interpolate(logoEnter, [0, 1], [0.68, 1], clamp) +
    microBounce * 0.006 -
    interpolate(logoExit, [0, 1], [0, 0.12], clamp);
  const logoY = interpolate(logoEnter, [0, 1], [28, 0], clamp) - interpolate(logoExit, [0, 1], [0, 128], clamp);
  const logoOpacity = interpolate(logoExit, [0, 1], [1, 0], clamp);
  const logoRotateX = interpolate(logoEnter, [0, 1], [8, 0], clamp);

  const glintProgress = interpolate(frame, [0.48 * fps, 1.04 * fps], [0, 1], clamp);
  const shineX = interpolate(frame, [0.12 * fps, 0.62 * fps], [-520, 520], clamp);
  const edgeGlow = interpolate(frame, [0.24 * fps, 0.72 * fps, 1.18 * fps], [0, 1, 0.55], clamp);
  const shadowScale = interpolate(logoScale, [0.68, 1], [0.7, 1.05], clamp);

  return (
    <AbsoluteFill style={{ background: colors.cream, overflow: "hidden" }}>
      <DashboardPreview progress={appProgress} />

      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${colors.creamLight} 0%, ${colors.cream} 100%)`,
          opacity: finalCreamFade,
        }}
      />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1400 }}>
        <div
          style={{
            position: "absolute",
            width: 660,
            height: 54,
            borderRadius: "50%",
            background: "rgba(3, 47, 57, 0.21)",
            filter: "blur(18px)",
            transform: `translateY(${330 + logoY * 0.34}px) scale(${shadowScale})`,
            opacity: logoOpacity * interpolate(logoEnter, [0, 1], [0, 1], clamp),
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 980,
            height: 3,
            borderRadius: 999,
            transform: `translateX(${interpolate(glintProgress, [0, 1], [-280, 280], clamp)}px) scaleX(${interpolate(
              glintProgress,
              [0, 0.42, 1],
              [0, 1, 0],
              clamp,
            )})`,
            background: `linear-gradient(90deg, transparent, ${colors.orange}, ${colors.petrolSoft}, transparent)`,
            filter: "blur(0.4px)",
            opacity: logoOpacity * 0.64,
          }}
        />

        <div
          style={{
            position: "relative",
            width: 720,
            height: 720,
            transform: `translateY(${logoY}px) rotateX(${logoRotateX}deg) scale(${logoScale})`,
            transformStyle: "preserve-3d",
            opacity: logoOpacity * interpolate(logoEnter, [0, 0.32, 1], [0, 1, 1], clamp),
          }}
        >
          <Img
            src={staticFile("yardbook-logo.svg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: `drop-shadow(0 0 ${18 * edgeGlow}px rgba(245, 138, 19, 0.34)) drop-shadow(0 0 ${
                22 * edgeGlow
              }px rgba(13, 115, 128, 0.24))`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              overflow: "hidden",
              opacity: logoOpacity * interpolate(frame, [0.1 * fps, 0.52 * fps], [0, 0.38], clamp),
              mixBlendMode: "screen",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -80,
                left: "50%",
                width: 210,
                height: 780,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 45%, rgba(255,248,222,0.92) 50%, transparent 100%)",
                filter: "blur(12px)",
                transform: `translateX(${shineX}px) rotate(18deg)`,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const YardbookIntroMobile = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const enter = eased(frame, [0, 0.55 * fps], [0, 1]);
  const brandExit = interpolate(frame, [3.7 * fps, 4.35 * fps], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const dashboardEnter = eased(frame, [3.95 * fps, 4.55 * fps], [0, 1]);
  const logoY = interpolate(brandExit, [0, 1], [0, -height * 0.15], clamp);
  const logoScale = interpolate(enter, [0, 1], [0.84, 1], clamp) * interpolate(brandExit, [0, 1], [1, 0.72], clamp);
  const glintX = interpolate(frame, [0.35 * fps, 1.3 * fps], [-width * 0.42, width * 0.42], clamp);
  const dashboardY = interpolate(dashboardEnter, [0, 1], [height * 0.12, 0], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: colors.cream, color: colors.ink, fontFamily: "Inter, Arial, sans-serif" }}>
      <AbsoluteFill style={{ padding: "8% 8% 7%", opacity: dashboardEnter, transform: `translateY(${dashboardY}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 26, fontWeight: 800 }}>
          <Img src={staticFile("yardbook-mark.svg")} style={{ width: 42, height: 42 }} />
          <span>yardbook</span>
        </div>
        <div style={{ marginTop: 44, fontSize: 22, fontWeight: 700, color: colors.muted }}>GESTIÓN DE FLOTAS</div>
        <div style={{ marginTop: 10, fontSize: 46, fontWeight: 850, letterSpacing: -2 }}>Tu flota. Bajo control.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 42 }}>
          {[["Vehículos", "12", colors.orange], ["Disponibles", "08", colors.petrol], ["Reservas hoy", "04", colors.petrol], ["Pendientes", "02", colors.orangeDeep]].map(([label, value, accent]) => (
            <div key={label} style={{ minHeight: 142, padding: 24, borderRadius: 22, background: colors.creamLight, boxShadow: "0 14px 38px rgba(32,38,35,.08)" }}>
              <div style={{ fontSize: 20, color: colors.muted, fontWeight: 650 }}>{label}</div>
              <div style={{ marginTop: 14, fontSize: 52, fontWeight: 850, color: accent }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 26, padding: 24, borderRadius: 22, background: colors.petrol, color: colors.cream }}>
          <div style={{ fontSize: 21, fontWeight: 750 }}>Todo tu equipo, en un solo lugar</div>
          <div style={{ marginTop: 10, fontSize: 18, opacity: .78 }}>Alquileres · Mantenimiento · Cobros</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "8% 8% 12%", opacity: 1 - dashboardEnter * 0.08 }}>
        <div style={{ width: "100%", maxWidth: width * 0.84, transform: `translateY(${logoY}px) scale(${logoScale})`, opacity: 1 - brandExit * 0.18 }}>
          <Img src={staticFile("yardbook-logo.svg")} style={{ display: "block", width: "100%", height: "auto", filter: `drop-shadow(0 20px 40px rgba(32,38,35,${0.12 + enter * 0.08}))` }} />
        </div>
        <div style={{ position: "absolute", top: "60%", left: 0, right: 0, textAlign: "center", transform: `translateY(${logoY * 0.42}px)`, opacity: 1 - brandExit }}>
          <div style={{ fontSize: "4.4%", letterSpacing: ".16em", fontWeight: 750, color: colors.muted }}>TU FLOTA. BAJO CONTROL.</div>
          <div style={{ width: "46%", height: 5, margin: "34px auto 0", borderRadius: 5, background: colors.orange, transform: `scaleX(${interpolate(frame, [0.2 * fps, 1.1 * fps], [0, 1], clamp)})`, transformOrigin: "left" }} />
        </div>
        <div style={{ position: "absolute", top: "43%", left: "8%", width: "84%", height: 4, overflow: "hidden", opacity: (1 - brandExit) * 0.4 }}>
          <div style={{ width: "28%", height: "100%", background: `linear-gradient(90deg, transparent, ${colors.orange}, transparent)`, transform: `translateX(${glintX}px)` }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
