import { useVideoConfig } from "remotion";

/** Layout units that adapt to 4:5, 9:16, 1:1 and 16:9 frames. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080; // 1 unit = 1px on a 1080-wide portrait frame
  const landscape = width > height * 1.2;
  return {
    width,
    height,
    u,
    landscape,
    // Safe area from Remotion's layout guidance: 80px sides, 100px top/bottom at 1080 wide.
    safeX: 80 * u,
    safeY: 100 * u,
    headline: (landscape ? 76 : 84) * u,
    body: 44 * u,
    font: '"Helvetica Neue", "Segoe UI", Arial, sans-serif',
  };
};
