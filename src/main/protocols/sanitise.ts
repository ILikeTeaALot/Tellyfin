import * as node_path from "node:path";

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

const isAbsolute = node_path.isAbsolute;
const join = node_path.join;
const normalize = node_path.normalize;
const resolve = node_path.resolve;
const separator = node_path.sep;

export function resolvePath(rootPath: string, relativePath?: string) {
	let base = relativePath;
	let root = rootPath;

	// root is optional, similar to root.resolve
	if (!relativePath) {
		base = rootPath;
		root = process.cwd();
	}

	if (root == null) {
		throw new TypeError('argument rootPath is required');
	}

	if (typeof root !== 'string') {
		throw new TypeError('argument rootPath must be a string');
	}

	if (base == null) {
		throw new TypeError('argument relativePath is required');
	}

	if (typeof base !== 'string') {
		throw new TypeError('argument relativePath must be a string');
	}

	// containing NULL bytes is malicious
	if (base.indexOf('\0') !== -1) {
		throw new Error('Malicious Path');
	}

	// path should never be absolute
	if (isAbsolute(base) || isAbsolute(base)) {
		new Error('Malicious Path');
	}

	// path outside root
	if (UP_PATH_REGEXP.test(normalize('.' + separator + base))) {
		throw new Error("403");
	}

	// join the relative path
	return normalize(join(resolve(root), base));
}