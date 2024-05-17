import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { SWRConfig } from "swr";

function AppInner() {
	return (
			<div className="background" style={{ opacity: state == AppState.Player ? 0 : 1 }} />
	);
}

function App() {
	return (
				<SWRConfig value={{
					// revalidateOnMount: true,
					refreshInterval: 5 * 60 * 1000,
				}}>
					<AppInner />
				</SWRConfig>
	);
}

export default App;
