import "./index.css";
import { Composition } from "remotion";
import { YardbookIntro } from "./Composition";

const durationInFrames = 180;
const fps = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="YardbookLight" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1920} height={1080} defaultProps={{ theme: "light" }} />
    <Composition id="YardbookDark" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1920} height={1080} defaultProps={{ theme: "dark" }} />
    <Composition id="YardbookMobileLight" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1080} height={1920} defaultProps={{ theme: "light" }} />
    <Composition id="YardbookMobileDark" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1080} height={1920} defaultProps={{ theme: "dark" }} />
    <Composition id="YardbookMobileTallLight" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1080} height={2340} defaultProps={{ theme: "light" }} />
    <Composition id="YardbookMobileTallDark" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1080} height={2340} defaultProps={{ theme: "dark" }} />
    <Composition id="YardbookTabletPortraitLight" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1080} height={1440} defaultProps={{ theme: "light" }} />
    <Composition id="YardbookTabletPortraitDark" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1080} height={1440} defaultProps={{ theme: "dark" }} />
    <Composition id="YardbookTabletLandscapeLight" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1440} height={1080} defaultProps={{ theme: "light" }} />
    <Composition id="YardbookTabletLandscapeDark" component={YardbookIntro} durationInFrames={durationInFrames} fps={fps} width={1440} height={1080} defaultProps={{ theme: "dark" }} />
  </>
);
