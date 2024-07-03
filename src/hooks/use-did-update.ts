import { useRef, useEffect, useLayoutEffect } from "preact/hooks";

export function useDidUpdate(fn: () => (void | (() => void)), deps: Array<any>) {
	const isMountingRef = useRef(true);

	useEffect(() => {
		isMountingRef.current = true;
	}, []);

	useEffect(() => {
		if (!isMountingRef.current) {
			return fn();
		} else {
			isMountingRef.current = false;
		}
	}, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useDeferredLayoutEffect(fn: () => (void | (() => void)), deps: Array<any>) {
	const isMountingRef = useRef(true);

	useLayoutEffect(() => {
		isMountingRef.current = true;
	}, []);

	useLayoutEffect(() => {
		if (!isMountingRef.current) {
			return fn();
		} else {
			isMountingRef.current = false;
		}
	}, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useDidMount(fn: () => (void | (() => void)), deps: Array<any>) {
	const isMountedRef = useRef(false);

	useEffect(() => {
		isMountedRef.current = true;
	}, []);

	useEffect(() => {
		if (isMountedRef.current) {
			return fn();
		} else {
			isMountedRef.current = false;
		}
	}, deps); // eslint-disable-line react-hooks/exhaustive-deps
}