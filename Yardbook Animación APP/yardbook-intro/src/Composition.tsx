import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type YardbookIntroProps = {
  theme: "light" | "dark";
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const YardbookIntro = ({ theme }: YardbookIntroProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const background = theme === "dark" ? "#0F0F0F" : "#F5F3EC";
  const logo = theme === "dark" ? "yardbook-logo-light.svg" : "yardbook-logo.svg";

  const enter = interpolate(frame, [0.15 * fps, 1.15 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exit = interpolate(frame, [4.65 * fps, 5.85 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.7, 0, 0.84, 0),
  });
  const lineProgress = interpolate(frame, [0.65 * fps, 1.55 * fps, 4.4 * fps, 5.35 * fps], [0, 1, 1, 0], clamp);
  const glint = interpolate(frame, [1.35 * fps, 2.15 * fps], [-1, 1], clamp);
  const logoWidth = portrait ? Math.min(width * 0.78, 850) : Math.min(width * 0.44, 820);

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: portrait ? "12% 8%" : "8%" }}>
        <div
          style={{
            position: "absolute",
            width: portrait ? width * 0.62 : width * 0.31,
            height: portrait ? width * 0.62 : width * 0.31,
            borderRadius: "50%",
            background: theme === "dark" ? "rgba(245,107,42,.10)" : "rgba(245,107,42,.08)",
            filter: `blur(${portrait ? 90 : 120}px)`,
            opacity: enter * (1 - exit),
            scale: interpolate(enter, [0, 1], [0.72, 1], clamp),
          }}
        />

        <div
          style={{
            position: "relative",
            width: logoWidth,
            opacity: enter * (1 - exit),
            scale: interpolate(enter, [0, 1], [0.92, 1], clamp) * interpolate(exit, [0, 1], [1, 1.035], clamp),
            translate: `0 ${interpolate(enter, [0, 1], [portrait ? 30 : 22, 0], clamp) - interpolate(exit, [0, 1], [0, portrait ? 18 : 12], clamp)}px`,
          }}
        >
          <Img src={staticFile(logo)} style={{ display: "block", width: "100%", height: "auto" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              opacity: interpolate(frame, [1.25 * fps, 1.65 * fps, 2.05 * fps, 2.35 * fps], [0, 0.24, 0.24, 0], clamp),
              mixBlendMode: "screen",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-35%",
                bottom: "-35%",
                left: "42%",
                width: "13%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent)",
                filter: "blur(10px)",
                translate: `${glint * logoWidth}px 0`,
                rotate: "16deg",
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: `calc(50% + ${portrait ? 105 : 112}px)`,
            width: portrait ? Math.min(width * 0.34, 360) : Math.min(width * 0.16, 300),
            height: portrait ? 6 : 5,
            borderRadius: 999,
            backgroundColor: "#F56B2A",
            opacity: enter * (1 - exit),
            scale: `${lineProgress} 1`,
            transformOrigin: "center",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
