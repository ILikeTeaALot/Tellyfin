export class Mutex<T> {
	#value: T;

	constructor(initial: T) {
		this.#value = initial;
	}

	set inner(value: T) {
		this.#value = value;
	}

	get inner() {
		return this.#value;
	}
}