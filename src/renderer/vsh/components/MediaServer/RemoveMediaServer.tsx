import { useCallback, useState } from "preact/hooks";
import { useInput } from "../../hooks";
import { useNavActive, useNavigationFunctions } from "../../hooks/routing";
import useSWR from "swr";
import { Loading } from "../Loading";
import { Dialog, DialogType } from "../Dialog";
import { Button } from "../Button";
import { refreshHome } from "../../functions/refresh-home-categories";

export function RemoveMediaServer() {
	const { back } = useNavigationFunctions();
	const navActive = useNavActive();
	const { data: mediaServers } = useSWR("media-servers", window.mediaServerAPI.getMediaServers);
	const [exitConfirmActive, setExitConfirmActive] = useState(false);
	const onCancelDialog = useCallback(() => setExitConfirmActive(false), []);
	const onSubmitDialog = useCallback((confirmed: boolean) => {
		setExitConfirmActive(false);
		if (confirmed) {
			back(true);
		}
	}, [back]);
	const [lockout, setLockoutState] = useState(false);
	const active = !exitConfirmActive && !lockout && navActive;
	const [currentScreen, setCurrentScreen] = useState(0);
	const [log, updateLog] = useState("");
	const screen0Active = active && currentScreen == 0;
	const screen1Active = active && currentScreen == 1;
	const confirmScreenActive = active && currentScreen == 2;
	useInput(active && screen0Active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				if (mediaServers) setSelectedMediaServer(current => Math.max(current - 1, 0));
				return;
			case "PadDown":
			case "ArrowDown":
				if (mediaServers) setSelectedMediaServer(current => Math.min(current + 1, mediaServers.length - 1));
				return;
			case "Enter":
			case "PadRight":
			case "ArrowRight":
				if (mediaServers) setCurrentScreen(1);
				return;
			case "Back":
			case "PadLeft":
			case "ArrowLeft":
			case "Backspace":
				setExitConfirmActive(true);
				return;
		}
	}, [mediaServers]);
	useInput(active && screen1Active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				return;
			case "PadDown":
			case "ArrowDown":
				return;
			case "PadLeft":
			case "ArrowLeft":
				setCurrentScreen(0);
				return;
			case "Back":
			case "Backspace":
				setExitConfirmActive(true);
				return;
		}
	}, []);
	useInput(active && confirmScreenActive, (button) => {
		switch (button) {
			case "Enter":
			case "Back":
			case "Backspace":
				back(true);
				return;
		}
	}, [back]);
	// Screen 0 - Media Server
	const [selectedMediaServer, setSelectedMediaServer] = useState(0);
	const onConfirm = useCallback(() => {
		if (!mediaServers) {
			updateLog(current => current + "No Media Servers???\n" + mediaServers + "\n");
			return;
		}
		setLockoutState(true);
		updateLog(current => current + "Working...\n");
		window.mediaServerAPI.removeMediaServer(mediaServers[selectedMediaServer].Id).then(() => {
			updateLog(current => current + "Server Removed!\n");
			updateLog(current => current + "Server Id: " + selectedMediaServer + "\n");
			setLockoutState(false);
			setCurrentScreen(2);
			refreshHome();
		}).catch((e) => {
			setLockoutState(false);
			setCurrentScreen(1);
			updateLog(current => current + "\n" + e);
		});
	}, [mediaServers, selectedMediaServer]);
	return (
		<div class="wizard dialog blur" style={{ opacity: navActive ? 1 : 0 }}>
			<span style={{ position: "absolute", left: "4rem", top: 40 }}>Remove Media Server</span>
			<div class="content">
				<div class="screen-wrapper" style={{
					left: `${0 * 100}vw`,
					translate: `${-100 * currentScreen}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>Server</span>
							{mediaServers ? mediaServers.map((provider, index) => {
								return <span key={provider.Id} class={index == selectedMediaServer ? "option selected" : "option"}>{provider.Name}</span>;
							}) : <Loading />}
						</div>
					</div>
				</div>
				<div class="screen-wrapper" style={{
					left: `${1 * 100}vw`,
					translate: `${-100 * currentScreen}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>Confirm removal</span>
							<span>When a server is removed, all logins, caches, and related data is also removed.</span>
							<Button active={screen1Active} onPress={onConfirm}>OK</Button>
							<div style={{ whiteSpace: "pre-line", color: "white", position: "absolute" }}>
								Output:{"\n"}
								{log}
							</div>
						</div>
					</div>
				</div>
				<div class="screen-wrapper" style={{
					left: `${2 * 100}vw`,
					translate: `${-100 * currentScreen}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<span style={{ display: "flex", textAlign: "center", margin: "0 auto" }}>Server Removed</span>
							<div style={{ whiteSpace: "pre-line", color: "white", position: "absolute" }}>
								Output:{"\n"}
								{log}
							</div>
						</div>
					</div>
				</div>
				<div class="screen-wrapper" style={{
					opacity: lockout ? 1 : 0,
				}}>
					<Loading />
				</div>
			</div>
			<Dialog active={exitConfirmActive} onSubmit={onSubmitDialog} onCancel={onCancelDialog} type={DialogType.Confirm}>Are you sure you want to cancel?</Dialog>
		</div>
	);
}