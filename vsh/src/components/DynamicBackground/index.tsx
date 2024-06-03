import type { CSSProperties } from "preact/compat";

export const DynamicBackground = ({ style }: { style?: CSSProperties; }) => <iframe title="DynamicBackground" src="./xmb-wave.html" style={{ inset: 0, position: "fixed", width: "100vw", height: "100vh", border: "none", ...style }} />;