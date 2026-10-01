import "./index.css";
import { Composition } from "remotion";
import { YardbookIntro, YardbookIntroMobile } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Yardbook"
        component={YardbookIntro}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="YardbookMobile"
        component={YardbookIntroMobile}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="YardbookMobileTall"
        component={YardbookIntroMobile}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={2340}
      />
      <Composition
        id="YardbookTabletPortrait"
        component={YardbookIntroMobile}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1440}
      />
      <Composition
        id="YardbookTabletLandscape"
        component={YardbookIntroMobile}
        durationInFrames={180}
        fps={30}
        width={1440}
        height={1080}
      />
    </>
  );
};
