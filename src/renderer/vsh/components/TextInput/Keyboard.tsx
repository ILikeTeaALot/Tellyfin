import type { FunctionComponent } from "preact";
import { useState, useRef } from "preact/hooks";
import "./keyboard.css";
import { en } from "./layouts";
import { KeyboardLayout } from "./layouts/interfaces";
import { useInput } from "../../hooks";
import { useDidUpdate } from "../../hooks/use-did-update";
import { FeedbackSound, playFeedback } from "../../context/AudioFeedback";

interface KeyboardProps {
	active: boolean;
	onCancel: () => void;
	onEnter: (text: string) => void;
	x?: number;
	y?: number;
}

export const Keyboard: FunctionComponent<KeyboardProps> = ({ active, onCancel, onEnter, x, y }) => {
	// State
	const [activeKey, setActiveKey] = useState<number>(0);
	const [activeRow, setActiveRow] = useState<number>(0);
	const [cursorPosition, setCursorPosition] = useState<number>(0);
	const [keyboardLayout, updateLayout] = useState<KeyboardLayout>(en.layouts.standard);
	const [shift, setShiftState] = useState<boolean>(false);
	const [alt, setAltState] = useState<boolean>(false);
	// const [symbols, setSymbolState] = useState<boolean>(false);
	const [currentInputValue, setValue] = useState<string>("");

	// Refs
	const layouts = useRef(en.layouts);

	useDidUpdate(() => {
		playFeedback(FeedbackSound.SelectionMove);
	}, [activeKey, activeRow]);

	useInput(active, (button) => {
		// let newActive: [number, number] = [...activeKey];
		let newActiveRow = activeRow;
		let newActiveX = activeKey;
		// console.log("active KeyDown:", newActive);
		console.log("active row:", newActiveRow);
		console.log("active key:", newActiveX);
		console.log(button);
		const insertSpace = () => {
			setValue(`${currentInputValue.slice(0, cursorPosition)} ${currentInputValue.slice(cursorPosition)}`);
			setCursorPosition(cursorPosition + 1);
		};
		const deleteChar = () => {
			setValue(`${currentInputValue.slice(0, Math.max(cursorPosition - 1, 0))}${currentInputValue.slice(cursorPosition)}`);
			setCursorPosition(Math.max(cursorPosition - 1, 0));
		};
		let breakEarly = false;
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				newActiveRow = (Math.max(activeRow - 1, 0));
				break;
			case "PadDown":
			case "ArrowDown":
				newActiveRow = (Math.min(activeRow + 1, 5));
				break;
			case "PadLeft":
			case "ArrowLeft":
				switch (activeRow) {
					case 4:
						switch (activeKey) {
							case 3:
							case 4:
							case 5:
							case 6:
								newActiveX = 2;
								breakEarly = true;
								break;
							case 8:
							case 9:
								newActiveX = 7;
								breakEarly = true;
								break;
							default:
								break;
						}
						break;
					case 5:
						switch (activeKey) {
							case 8:
							case 9:
								newActiveX = 4;
								breakEarly = true;
								break;
							default:
								break;
						}
						break;
					default:
						break;
				}
				if (breakEarly) break;
				newActiveX = (Math.max(activeKey - 1, 0));
				break;
			case "PadRight":
			case "ArrowRight":
				switch (activeRow) {
					case 4:
						switch (activeKey) {
							case 3:
							case 4:
							case 5:
							case 6:
								newActiveX = 7;
								breakEarly = true;
								break;
							case 8:
							case 9:
								newActiveX = 9;
								breakEarly = true;
								break;
							default:
								break;
						}
						break;
					case 5:
						switch (activeKey) {
							case 4:
								newActiveX = 8;
								breakEarly = true;
								break;
							case 8:
							case 9:
								newActiveX = 9;
								breakEarly = true;
								break;
							default:
								break;
						}
						break;
					default:
						break;
				}
				if (breakEarly) break;
				newActiveX = (Math.min(activeKey + 1, 9));
				break;
			case "X":
				playFeedback(FeedbackSound.SelectionMove);
				deleteChar();
				break;
			case "Y":
				playFeedback(FeedbackSound.SelectionMove);
				insertSpace();
				break;
			case "L1":
				playFeedback(FeedbackSound.SelectionMove);
				setCursorPosition(Math.max(cursorPosition - 1, 0));
				break;
			case "L2":
				setShiftState(!shift);
				updateLayout(!shift ? layouts.current.shift : layouts.current.standard);
				break;
			case "R1":
				playFeedback(FeedbackSound.SelectionMove);
				setCursorPosition(Math.min(cursorPosition + 1, currentInputValue.length));
				break;
			case "Enter":
				if (activeRow < 4) {
					playFeedback(FeedbackSound.Enter);
					const key = keyboardLayout[activeRow][activeKey];
					setValue(`${currentInputValue.slice(0, cursorPosition)}${key}${currentInputValue.slice(cursorPosition)}`);
					setCursorPosition(cursorPosition + 1);
				} else {
					console.log("function rows");
					switch (activeRow) {
						case 4:
							playFeedback(FeedbackSound.Enter);
							console.log("function row 1");
							switch (activeKey) {
								/** Shift */
								case 0:
									console.log("toggle shift");
									setShiftState(!shift);
									if (alt && layouts.current.alt && layouts.current.alt_shift) {
										updateLayout(!shift ? layouts.current.alt_shift : layouts.current.alt);
									} else {
										updateLayout(!shift ? layouts.current.shift : layouts.current.standard);
									}
									break;
								/** Symbols Page(s) */
								// case 1:
								// 	setSymbolState(state => {
								// 		if (!state && layouts.current.symbols) {
								// 			updateLayout(layouts.current.symbols);
								// 		} else {
								// 			updateLayout(!shift ? layouts.current.shift : layouts.current.standard);
								// 		}
								// 		return !state;
								// 	});
								// 	break;
								/** Non-English latin characters */
								case 2:
									console.log("toggle alt");
									setAltState(!alt);
									if (!alt && layouts.current.alt && layouts.current.alt_shift) {
										updateLayout(shift ? layouts.current.alt_shift : layouts.current.alt);
									} else {
										updateLayout(shift ? layouts.current.shift : layouts.current.standard);
									}
									updateLayout(shift ? !alt ? layouts.current.alt_shift : layouts.current.shift : !alt ? layouts.current.alt : layouts.current.standard);
									break;
								case 3:
								case 4:
								case 5:
								case 6:
									insertSpace();
									break;
								case 7:
									break;
								case 8:
								case 9:
									deleteChar();
									break;
							}
							break;
						case 5:
							switch (activeKey) {
								case 0:
									playFeedback(FeedbackSound.Enter);
									setCursorPosition(0);
									break;
								case 1:
									playFeedback(FeedbackSound.Enter);
									setCursorPosition(currentInputValue.length);
									break;
								case 2:
									playFeedback(FeedbackSound.Enter);
									setCursorPosition(Math.max(cursorPosition - 1, 0));
									break;
								case 3:
									playFeedback(FeedbackSound.Enter);
									setCursorPosition(Math.min(cursorPosition + 1, currentInputValue.length));
									break;
								case 8:
								case 9:
									onEnter(currentInputValue);
									break;
							}
							break;
					}
				}
				// cancelRepeat(GamepadButton.Enter);
				break;
			case "Back":
			case "Backspace":
				// cancelRepeat(GamepadButton.Back);
				onCancel();
				return;
			default:
				return;
		}
		console.log("New Active Row:", newActiveRow);
		console.log("New Active X:", newActiveX);
		setActiveRow(newActiveRow);
		setActiveKey(newActiveX);
	}, [activeKey, activeRow, cursorPosition, currentInputValue, shift, keyboardLayout, onCancel, onEnter]);

	return (
		<div className={active ? "keyboard open" : "keyboard"} style={{ top: y, left: x }}>
			<div className="input">{currentInputValue.slice(0, cursorPosition)}<span className="cursor" />{currentInputValue.slice(cursorPosition)}</div>
			{keyboardLayout.map((keys, rowIndex) => {
				return (
					<div key={rowIndex} className="row">
						{keys.map((key, keyIndex) => {
							const keyActive = activeKey === keyIndex && activeRow === rowIndex;
							return (
								<div key={keyIndex} className={keyActive ? "key active" : "key"}>
									<span className="char">{key}{"\u200d"}</span>
									{/* <div className="shadow"></div>
									<div className="panel-content">
									</div>
									<div className="border-highlight"></div> */}
								</div>
							);
						})}
					</div>
				);
			})}
			<div className="row functions-1">
				<div className={activeKey === 0 && activeRow === 4 ? shift ? "key highlight active" : "key active" : shift ? "key highlight" : "key"}><span className="char">⇧</span></div>
				{/* <div className={activeKey === 1 && activeRow === 4 ? symbols ? "key highlight active" : "key active" : symbols ? "key highlight" : "key"}><span className="char small">@#</span></div> */}
				<div className={activeKey === 1 && activeRow === 4 ? "key active" : "key"} />
				<div className={activeKey === 2 && activeRow === 4 ? "key active" : "key"}><span className="char small">{alt ? "Ab" : "àß"}</span></div>
				<div className={activeKey > 2 && activeKey < 7 && activeRow === 4 ? "key active" : "key"} style={{ gridColumn: "span 4" }}><span className="char">␣</span></div>
				<div className={activeKey === 7 && activeRow === 4 ? "key active" : "key"} />
				<div className={activeKey > 7 && activeRow === 4 ? "key active" : "key"} style={{ gridColumn: "span 2" }}><span className="char">⌫</span></div>
			</div>
			<div className="row functions-2">
				<div className={activeKey === 0 && activeRow === 5 ? "key active" : "key"}><span className="icon"></span></div>
				<div className={activeKey === 1 && activeRow === 5 ? "key active" : "key"}><span className="icon"></span></div>
				<div className={activeKey === 2 && activeRow === 5 ? "key active" : "key"}><span className="icon" style={{ transform: "rotate(-90deg)" }}></span></div>
				<div className={activeKey === 3 && activeRow === 5 ? "key active" : "key"}><span className="icon" style={{ transform: "rotate(-90deg)" }}></span></div>
				<div className={activeKey === 4 && activeRow === 5 ? "key active" : "key"}><span className="icon" style={{ fontSize: "1em" }}></span></div>
				<div className={activeKey === 5 && activeRow === 5 ? "key active" : "key"} />
				<div className={activeKey === 6 && activeRow === 5 ? "key active" : "key"} />
				<div className={activeKey === 7 && activeRow === 5 ? "key active" : "key"} />
				<div className={activeKey > 7 && activeRow === 5 ? "key highlight active" : "key highlight"} style={{ gridColumn: "span 2" }}><span className="char small">Done</span></div>
			</div>
		</div>
	);
};