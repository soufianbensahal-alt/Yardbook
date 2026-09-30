import "./index.css";
import { Composition } from "remotion";
import { YardbookIntro } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Yardbook"
        component={YardbookIntro}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
