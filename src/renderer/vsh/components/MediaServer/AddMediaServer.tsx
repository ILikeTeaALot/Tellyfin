import { useCallback, useEffect, useState } from "preact/hooks";
import { useInput } from "../../hooks";
import { useNavActive, useNavigationFunctions, useNavPosition } from "../../hooks/routing";
import useSWR from "swr";
import { Loading } from "../Loading";
import { TextInput } from "../TextInput/TextInput";
import { Dialog, DialogType } from "../Dialog";
import { net_address } from "../TextInput/layouts";
import { Button } from "../Button";
import { refreshHome } from "../../functions/refresh-home-categories";

export function AddMediaServer() {
	const { back } = useNavigationFunctions();
	const position = useNavPosition();
	const navActive = useNavActive();
	const { data: contentProviders } = useSWR("content-providers", window.mediaServerAPI.getContentProviders);
	const [exitConfirmActive, setExitConfirmActive] = useState(false);
	const onCancelDialog = useCallback(() => setExitConfirmActive(false), []);
	const onSubmitDialog = useCallback((confirmed: boolean) => {
		setExitConfirmActive(false);
		if (confirmed) {
			back(true);
		}
	}, [back]);
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	const [lockout, setLockoutState] = useState(false);
	const active = !exitConfirmActive && !keyboardOpen && !lockout && navActive;
	const [serverRegistered, setServerRegistered] = useState(false);
	const [currentScreen, setCurrentScreen] = useState(0);
	const [log, updateLog] = useState("");
	const screen0Active = active && currentScreen == 0;
	const screen1Active = active && currentScreen == 1;
	const screen2Active = active && currentScreen == 2;
	useInput(active && screen0Active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				if (contentProviders) setSelectedContentProvider(current => Math.max(current - 1, 0));
				return;
			case "PadDown":
			case "ArrowDown":
				if (contentProviders) setSelectedContentProvider(current => Math.min(current + 1, contentProviders.length - 1));
				return;
			case "Enter":
			case "PadRight":
			case "ArrowRight":
				if (contentProviders) setCurrentScreen(1);
				return;
			case "Back":
			case "PadLeft":
			case "ArrowLeft":
			case "Backspace":
				setExitConfirmActive(true);
				return;
		}
	}, [contentProviders]);
	useInput(active && screen1Active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				setScreen1Focus(current => Math.max(current - 1, 0));
				return;
			case "PadDown":
			case "ArrowDown":
				setScreen1Focus(current => Math.min(current + 1, 2));
				return;
			// case "PadRight":
			// case "ArrowRight":
			// 	setCurrentScreen(2);
			// 	return;
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
	useInput(active && screen2Active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				setScreen2Focus(current => Math.max(current - 1, 0));
				return;
			case "PadDown":
			case "ArrowDown":
				setScreen2Focus(current => Math.min(current + 1, 2));
				return;
			case "PadRight":
			case "ArrowRight":
				return;
			case "PadLeft":
			case "ArrowLeft":
				return;
			case "Back":
			case "Backspace":
				setExitConfirmActive(true);
				return;
		}
	}, []);
	useInput(active && currentScreen == 3, (button) => {
		switch (button) {
			case "Enter":
			case "Back":
			case "Backspace":
				back(true);
		}
	}, [back]);
	/// Keyboard
	// onKeyboardOpen
	const onKO = useCallback(() => {
		setKeyboardOpen(true);
	}, []);
	// onKeyboardClose
	const onKC = useCallback(() => {
		setKeyboardOpen(false);
	}, []);
	// Screen 0 - Content Provider
	const [selectedContentProvider, setSelectedContentProvider] = useState(0);
	// Screen 1 - Server
	const [screen1Focus, setScreen1Focus] = useState(0);
	const [serverAddress, setServerAddress] = useState("https://demo.jellyfin.org/stable");
	const [serverName, setServerName] = useState("Demo");
	const onPress1 = useCallback(() => {
		setCurrentScreen(2);
	}, []);
	// Screen 2 - Login
	const [screen2Focus, setScreen2Focus] = useState(0);
	const [username, setUsername] = useState("demo");
	const [password, setPassword] = useState("");
	const onPress2 = useCallback(() => {
		if (!contentProviders) {
			updateLog(current => current + "No Content Providers???\n" + contentProviders + "\n");
			return;
		}
		const prov = contentProviders[selectedContentProvider].Id;
		updateLog(current => current + "\nContent Provider: " + prov + "\n");
		const addr = serverAddress;
		updateLog(current => current + "Server Address: " + addr + "\n");
		const name = serverName;
		setLockoutState(true);
		updateLog(current => current + "Working...\n");
		window.mediaServerAPI.registerServer(prov, addr, name).then((serverId) => {
			updateLog(current => current + "Server Registered!\n");
			updateLog(current => current + "Server Id: " + serverId + "\n");
			setServerRegistered(true);
			window.mediaServerAPI.authenticateUserOnServer(serverId, username, password).then(() => {
				updateLog(current => current + "User Authenticated!\n");
				setLockoutState(false);
				setCurrentScreen(3);
				refreshHome();
			}).catch(error => {
				console.error(error);
				setLockoutState(false);
				setCurrentScreen(2);
				updateLog(current => current + "\n" + error);
			});
		}).catch((e) => {
			setServerRegistered(false);
			setLockoutState(false);
			setCurrentScreen(1);
			updateLog(current => current + "\n" + e);
		});
	}, [contentProviders, selectedContentProvider, serverAddress, serverName, username, password]);
	return (
		<div class="wizard dialog blur" style={{ opacity: navActive ? 1 : 0 }}>
			<span style={{ position: "absolute", left: "4rem", top: 40 }}>Add Media Server Connection</span>
			<div class="content">
				<div class="screen-wrapper" style={{
					left: `${0 * 100}vw`,
					translate: `${-100 * currentScreen}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>Server Type</span>
							{contentProviders ? contentProviders.map((provider, index) => {
								return <span key={provider.Id} class={index == selectedContentProvider ? "option selected" : "option"}>{provider.Name}</span>;
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
							<span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>Server Settings</span>
							<TextInput onKeyboardOpen={onKO} onKeyboardClose={onKC} active={screen1Active && screen1Focus == 0} name="Name" onChange={setServerName} value={serverName} />
							<TextInput onKeyboardOpen={onKO} onKeyboardClose={onKC} active={screen1Active && screen1Focus == 1} layout={net_address.layouts} name="Address" onChange={setServerAddress} value={serverAddress} />
							<Button active={screen1Active && screen1Focus == 2} onPress={onPress1}>OK</Button>
						</div>
					</div>
				</div>
				<div class="screen-wrapper" style={{
					left: `${2 * 100}vw`,
					translate: `${-100 * currentScreen}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>Log In to {serverName}</span>
							<TextInput onKeyboardOpen={onKO} onKeyboardClose={onKC} active={screen2Active && screen2Focus == 0} name="Username" onChange={setUsername} value={username} />
							<TextInput onKeyboardOpen={onKO} onKeyboardClose={onKC} active={screen2Active && screen2Focus == 1} layout={net_address.layouts} name="Password" onChange={setPassword} value={password} />
							<Button active={screen2Active && screen2Focus == 2} onPress={onPress2}>OK</Button>
							<div style={{ whiteSpace: "pre-line", color: "white" }}>
								Output:{"\n"}
								{log}
							</div>
						</div>
					</div>
				</div>
				<div class="screen-wrapper" style={{
					left: `${3 * 100}vw`,
					translate: `${-100 * currentScreen}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>You're All Set!</span>
							<div style={{ whiteSpace: "pre-line", color: "white" }}>
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