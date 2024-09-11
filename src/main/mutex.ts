export class Mutex<T> {
	#value: T;

	constructor(initial: T) {
		this.#value = initial;
	}

	set value(value: T) {
		this.#value = value;
	}

	get value() {
		return this.#value;
	}
}