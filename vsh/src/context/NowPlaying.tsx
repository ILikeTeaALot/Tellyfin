import { createContext } from "preact";

export type MetadataContextType = {
	title: string | null;
};

export const MetadataContext = createContext({ title: null });

MetadataContext.displayName = "Metadata Context";
export default MetadataContext;