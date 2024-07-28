/* export class Option<T> {
	#inner?: T;

	static Some<T>(value: T) {
		// this.#value = value;
		let option = new Option<T>();
		option.#inner = value;
		return option;
	}

	isSome() {
		return !!this.some;
	}

	unwrap() {
		return this.value;
	}

	get some() {
		return !!this.#inner;
	}

	get value() {
		if (this.#inner) {
			return this.#inner;
		} else {
			throw new Error("Attempt to read None");
		}
	}
}

export function Some<T>(value: T): Option<T> {
	return Option.Some(value);
}

export const None = new Option(); */

export type Option<T> = {
	some: false;
} | {
	some: true;
	value: T;
};

export function Some<T>(value: T): Option<T> {
	return {
		some: true,
		value,
	}
}

// export function None<T>(): Option<T> {
// 	return {
// 		some: false,
// 	}
// }

export const None: Option<any> = {
	some: false,
}