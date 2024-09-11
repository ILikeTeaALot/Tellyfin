import useSWR from "swr";
import { useInput } from "../../hooks";
import { useNavActive, useNavigationFunctions } from "../../hooks/routing";
import { Loading } from "../Loading";
import type { SelectScreen, Setup } from "./setup";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type StateUpdater } from "preact/hooks";

import "./style.css";
import { useDidUpdate } from "../../hooks/use-did-update";
import { FeedbackSound, playFeedback } from "../../context/AudioFeedback";

interface WizardProps {
	key: string;
	root_key: string;
	item_key: string;
}

export function Wizard(props: WizardProps) {
	const { key, root_key, item_key } = props;
	const { data, isLoading, isValidating } = useSWR(key, fetchSetup);
	const { back } = useNavigationFunctions();
	const [value, updateValue] = useState<Record<string, any>>({});
	const [currentScreen, setCurrentScreen] = useState(0);
	const active = useNavActive();
	const screens = useMemo(() => {
		if (data) {
			return data.Setup.Screens.map((screen, index) => {
				if (screen.conditions) {
					if (screen.conditions.map(condition => {
						switch (condition.is.op) {
							case "eq": {
								const eq = value[condition.key] == condition.is.to;
								return eq;
							}
							case "ne": {
								const notEq = value[condition.key] != condition.is.to;
								return notEq;
							}
							case "gt":
							case "lt":
								return false;
						}
					}).every(value => value == false)) {
						updateValue(current => {
							if (screen.key in current) {
								let next = { ...current };
								delete next[screen.key];
								return next;
							} else {
								return current;
							}
						});
						return null;
					}
				}
				return screen;
			}).filter(v => !!v);
		} else {
			return [];
		}
	}, [data, value]);
	useInput(active, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				setCurrentScreen(current => {
					if (current == 0) {
						back();
						playFeedback(FeedbackSound.Back);
						return current;
					} else {
						playFeedback(FeedbackSound.Back);
						return current - 1;
					}
				});
				return;
			case "PadLeft":
			case "ArrowLeft":
				setCurrentScreen(current => {
					if (current != 0) {
						playFeedback(FeedbackSound.Back);
						return current - 1;
					}
					return current;
				});
		}
	}, [back]);
	useInput(active && currentScreen == screens.length, (button) => {
		switch (button) {
			case "Enter":
				window.electronAPI.setSetting(root_key, item_key, value);
				playFeedback(FeedbackSound.Enter);
				back();
				setCurrentScreen(0);
		}
	}, [back, root_key, item_key, value]);
	const onConfirm = useCallback(() => {
		setCurrentScreen(current => {
			return Math.min(current + 1, screens.length);
		});
	}, [screens]);
	if (isLoading || isValidating) {
		return (
			<Loading />
		);
	}
	if (!data) {
		return (
			<div class="dialog blur" style={{ opacity: active ? 1 : 0 }}>
				<span>Loading failed?</span>
				<div class="content vertical">
					<h1>I'm a wizard that has failed to load!</h1>
				</div>
			</div>
		);
	}
	const { Setup } = data;
	return (
		<div class="wizard dialog blur" style={{ opacity: active ? 1 : 0 }}>
			<span style={{ position: "absolute", left: "4rem", top: 40 }}>{Setup.name}</span>
			{/* <h1>I'm a Wizard!</h1> */}
			<div class="content">
				{/* <div style={{
					height: "100%",
					// position: "absolute",
					display: "flex",
					width: `${100 * screens.length}vw`,
					translate: `${-100 * currentScreen}vw`,
					transitionDuration: "var(--transition-standard)",
				}}> */}
				{/* </div> */}
				{active && screens.map((screen, index) => {
					switch (screen.class) {
						case "Select":
							return (
								<div key={screen.key} class="screen-wrapper" style={{
									left: `${index * 100}vw`,
									translate: `${-100 * currentScreen}vw`,
								}}>
									<Select active={active && currentScreen == index} updateValue={updateValue} onConfirm={onConfirm} {...screen} />
								</div>
							);
					}
				})}
				<div class="screen-wrapper" style={{
					position: "absolute",
					width: "100vw",
					translate: `${currentScreen == screens.length ? 0 : 100}vw`,
				}}>
					<div class="screen">
						<div class="options vertical">
							<h2>Setup Complete</h2>
							{Object.entries(value).map(([key, value]) => {
								return (
									<div>
										<span>{screens.find(screen => screen.key == key)?.display ?? key}:</span>
										<span>{screens.find(screen => screen.key == key)?.options.find(option => option.value == value)?.display ?? rushJobDisplayValue(value)}</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
			{JSON.stringify(value)}
		</div>
	);
}

function rushJobDisplayValue(value: any) {
	switch (typeof value) {
		case "string":
			return value;
		case "number":
			return `${value}`;
		case "bigint":
			return `${value}`;
		case "boolean":
			return value ? "On" : "Off";
		case "symbol":
			return value.description;
		case "undefined":
			return "None";
		case "object":
			return JSON.stringify(value);
		case "function":
			return "This shouldn't happen";
	}
}

type ScreenProps = {
	active: boolean;
	updateValue: Dispatch<StateUpdater<Record<string, any>>>;
	onConfirm: () => void;
};

type SelectScreenProps = SelectScreen & ScreenProps & {
	// onSelect: (value: string | number | boolean) => void;
};

function Select(props: SelectScreenProps) {
	const { active, default: _default, display, key, options, onConfirm, updateValue } = props;
	const defaultOption = options.findIndex(value => value.value == _default);
	const [selected, setSelected] = useState(defaultOption == -1 ? 0 : defaultOption);
	useInput(active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				setSelected(current => Math.max(current - 1, 0));
				return;
			case "PadDown":
			case "ArrowDown":
				setSelected(current => Math.min(current + 1, options.length - 1));
				return;
			case "Enter":
			case "PadRight":
			case "ArrowRight":
				playFeedback(FeedbackSound.Enter);
				onConfirm();
				return;
		}
	}, [options, onConfirm]);
	useDidUpdate(() => {
		playFeedback(FeedbackSound.SelectionMove);
	}, [selected]);
	useEffect(() => {
		updateValue(current => ({
			...current,
			[key]: options[selected].value
		}));
	}, [key, options, selected, updateValue]);
	return (
		<div class="screen">
			<div class="options vertical">
				{display && <span style={{ display: "flex", textAlign: "center", margin: "-4rem auto 4rem" }}>{display}</span>}
				{options.map((option, index) => {
					return <span key={option.value} class={index == selected ? "option selected" : "option"}>{option.display}</span>;
				})}
			</div>
		</div>
	);
}

async function fetchSetup(key: string): Promise<Setup> {
	return fetch(`xb://localhost/data/${key}.json`).then(value => value.json());
}