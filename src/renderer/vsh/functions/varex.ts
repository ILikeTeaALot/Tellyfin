// https://github.com/OlaHulleberg/varEx - Ported to TypeScript
export function varEx<T extends { [key: string]: any }>(inputString: string, inputObject: T) {
	// Early return if there are no $[] blocks
	if (!inputString.includes("$[")) return inputString;

	// Find all $[] blocks, and run a function for each block found.
	// Returns a complete string where all VarEx blocks have been parsed
	return inputString.replace(/\$\[(['"`\w[\].]+)\]/g, (_, key): string => {
		// Initialize inputObject to be recursively parsed
		let resolvedValue = inputObject;

		// Check that we have equal amounts of open brackets [ as closing brackets ]
		// This allows us to check if the VarEx block is complete
		if (key.split("[").length !== key.split("]").length) return `$[${key}]`;

		// Replace all array blocks [] with .
		// eg. table['a'] becomes table.a
		// table[1] becomes table.1
		const cleanKey = key.replace(/\[["'`]?(\w*)["'`]?\]/g, ".$1");

		// Now we split the variable by . to resolve child elements if provided
		const variableBlocks = cleanKey.split(".");

		// Loop through each variableBlock variable (e.g variable.children.grandchildren.tableindex)
		variableBlocks.forEach((varKey: string) => {
			// Resolve value step-by-step
			// Prevent errors by checking if resolvedValue is set
			if (resolvedValue)
				resolvedValue =
					resolvedValue[varKey] !== null && resolvedValue[varKey] !== undefined ? resolvedValue[varKey] : "";
		});

		// Return the resolved variable
		return resolvedValue as unknown as string;
	});
}
