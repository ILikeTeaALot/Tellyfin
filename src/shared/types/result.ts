export type Result<T> = {
	ok: true;
	value: T;
} | {
	ok: false;
	error: Error | unknown;
};

export function Ok<T>(value: T): Result<T> {
	return {
		ok: true,
		value,
	};
}

export function Err(error: string | Error | unknown): Result<any> {
	return {
		ok: false,
		error: typeof error == "string" ? new Error(error) : error,
	};
}