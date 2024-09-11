export type SelectOption = {
	value: any;
	display: string;
};

export type SelectScreen = {
	class: "Select";
	key: string;
	display: string;
	default?: string | number | boolean;
	options: SelectOption[];
};

export type ScreenCondition = {
	key: string;
	is: {
		op: "eq";
		to: string | number | boolean;
	} | {
		op: "ne";
		to: string | number | boolean;
	} | {
		op: "gt";
		key: number;
	} | {
		op: "lt";
		key: number;
	};
};

export type SetupScreen = (SelectScreen) & {
	conditions: ScreenCondition[];
};

export type Setup = {
	Setup: {
		table: string;
		key: string;
		name: string;
		Screens: SetupScreen[];
	};
};