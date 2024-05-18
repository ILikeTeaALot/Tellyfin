import { createContext } from "preact";
import { AppState } from "../AppStates";

export const AppMode = createContext(AppState.Home);