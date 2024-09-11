import { useContext } from "preact/hooks";
import { NavigationContext } from "~/renderer/vsh/context/NavigationContext";

export function useCurrent() {
	const { current } = useContext(NavigationContext);
	return current;
}

export function useMatch(path: string) {
	const { stack } = useContext(NavigationContext);
	return stack.some(route => route.id == path);
}

export function useNavigationFunctions() {
	const { back, forward, go, clear, pop, push } = useContext(NavigationContext);
	return { back, forward, go, clear, pop, push };
}

export function useNavActive() {
	const { active, position } = useContext(NavigationContext);
	return active && position == 0;
}

export function useNavPosition() {
	const { position } = useContext(NavigationContext);
	return position;
}

export function useStack() {
	const { stack } = useContext(NavigationContext);
	return stack;
}