/**
 * Route: { name/id: string; data: Record<string, any> }
 * 
 * Stack: Array<Route> (As opposed to separated by `/`)
 * StackPosition: index of Stack
 * 
 * push(name: string, data?: Record<string, any>): Append to the stack
 * pop(): Remove the last item in the stack
 * back(): decrement stack position
 * forward(): increment stack position
 * go(): `push()` and then `forward()`.
 * 
 */

import { createContext, type ComponentChild, type ComponentProps, type ComponentType } from "preact";
import { useCallback, useContext, useMemo, useState } from "preact/hooks";
import { useMatch } from "../hooks/routing";
import { FeedbackSound, playFeedback } from "./AudioFeedback";

interface RouteData<P = {}> {
	id: string;
	props?: ComponentProps<ComponentType<P>>;
	Component: ComponentType<P>;
}

interface NavigationContextType {
	/**
	 * Convenience Method: same as `push()` + `forward()` (internally that's what it does.)
	 * 
	 * The sort of thing that would be used by a `Link` component/
	 * 
	 * @param id Route Name (typically "PascalCase").
	 */
	go(id: string, Component: ComponentType<{}>): void;
	/**
	 * Convenience Method: same as `push()` + `forward()` (internally that's what it does.)
	 * 
	 * The sort of thing that would be used by a `Link` component/
	 * 
	 * @param id Route Name (typically "PascalCase").
	 * @param props Extra data for the route.
	 */
	go<P extends {}>(id: string, Component: ComponentType<P>, props: ComponentProps<ComponentType<P>>): void;
	push(id: string, Component: ComponentType<{}>): void;
	push<P extends {}>(id: string, Component: ComponentType<P>, props: ComponentProps<ComponentType<P>>): void;
	pop(): void;
	clear(): void;
	back(pop?: boolean): void;
	forward(): void;
	stack: readonly RouteData<any>[];
	current: number;
	position: number;
	active: boolean;
}

/**
 * Not recommended to be used directly. Use the hooks.
 */
export const NavigationContext = createContext<NavigationContextType>({
	go<P extends {}>(id: string, Component: ComponentType<P>, props?: ComponentProps<ComponentType<P>>) { },
	push<P extends {}>(id: string, Component: ComponentType<P>, props?: ComponentProps<ComponentType<P>>) { },
	pop() { },
	clear() { },
	back(pop = false) { },
	forward() { },
	current: 0,
	stack: [],
	position: 0,
	active: false,
});

interface NavigationProviderProps {
	children: ComponentChild;
	active: boolean;
}

/**
 * # Rules of the Navigator™
 * 
 * 0. The navigator's default selected stack item is `-1`, to enable a "root" that is unaffected by stack clears etc.
 * 1. It is the **Component's** responsibility to handle the call to `back()`.
 * This is because some Components *also* need to use the back button for internal functionality (Menus, TV Shows, etc.)
 * 
 * @param props 
 * @returns 
 */
export function NavigationProvider(props: NavigationProviderProps) {
	const { active, children } = props;
	const [current, setCurrent] = useState<number>(-1);
	const [stack, updateStack] = useState<Array<RouteData<any>>>([]);
	const clear = useCallback(() => {
		updateStack([]);
		setCurrent(-1);
	}, []);
	const back = useCallback((pop = false) => {
		setCurrent(current => Math.max(current - 1, -1));
		if (pop) updateStack(stack => [...stack.slice(0, -1)]);
		playFeedback(FeedbackSound.Back);
	}, []);
	const forward = useCallback(() => {
		updateStack(stack => {
			setCurrent(current => Math.min(current + 1, stack.length - 1));
			return stack;
		});
		playFeedback(FeedbackSound.Enter);
	}, []);
	const pop = useCallback(() => {
		setCurrent(current => {
			updateStack(stack => {
				// if (current == stack.length - 1) {
				// 	setCurrent(current => current + 1);
				// }
				return [...stack.slice(0, -1)];
			});
			return Math.max(current - 1, -1);
		});
	}, []);
	const push = useCallback(<P extends {} = {}>(id: string, Component: ComponentType<P>, props?: P) => {
		setCurrent(current => {
			updateStack(stack => [...stack.slice(0, current + 1), { id, Component, props }]);
			return current;
		});
	}, []);
	const go = useCallback(<P extends {} = {}>(id: string, Component: ComponentType<P>, props?: P) => {
		setCurrent(current => {
			updateStack(stack => {
				const next = stack.at(current + 1);
				if (next) {
					if (next.Component == Component && next.id == id) {
						return stack;
					}
				}
				return [...stack.slice(0, current + 1), { id, Component, props }];
			});
			// return Math.min(current + 1, stack.length);
			return current + 1;
		});
		playFeedback(FeedbackSound.Enter);
	}, []);
	const value = useMemo(() => ({
		back, forward, clear, pop, push, go, current, position: 0, stack, active,
	}), [back, forward, clear, pop, push, go, current, stack, active]);
	return (
		<NavigationContext.Provider value={value}>
			{children}
		</NavigationContext.Provider>
	);
}

/**
 * Render the navigation stack.
 */
export function StackRenderer(props: { current_offset?: number; }) {
	const { current_offset } = props;
	const { current, stack, active } = useContext(NavigationContext);
	return (
		<>
			{stack.map(({ id, Component, props }, index) => {
				const position = (index - current) + (current_offset ?? 0);
				return (
					<RouteInternal key={`${id}-${index}`} active={active && position == 0} position={position}>
						<Component {...props} />
					</RouteInternal>
				);
			})}
		</>
	);
}

interface InternalRouteProps extends NavigationProviderProps {
	position: number;
}

function RouteInternal(props: InternalRouteProps) {
	const { children, position } = props;
	const context = useContext(NavigationContext);
	const contextValue = useMemo<NavigationContextType>(() => ({
		...context, position,
	}), [context, position]);
	return (
		<NavigationContext.Provider value={contextValue}>
			{children}
		</NavigationContext.Provider>
	);
}

interface RouteProps extends NavigationProviderProps {
	path: string;
}

export function Route(props: RouteProps) {
	const { children, path } = props;
	const matches = useMatch(path);
	if (matches) {
		return children;
	} else {
		return null;
	}
}