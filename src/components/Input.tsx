export type InputProps<T> = {
	active: boolean;
	default: T;
	onCancel: () => void;
	onSubmit: (value: T) => void;
}