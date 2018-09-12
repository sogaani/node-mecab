const diff = require("diff");
const fs = require("fs");
const path = require("path");

function _calculatePath(filePath, p, target) {
	const reg = new RegExp(`^([^\\/]*\\/){${p}}`);
	filePath = filePath.replace(reg, '');
	return path.join(target, filePath);
}

function _applyPatch(patch, p, target) {
	const sourceFileMatch = /--- ([^ \n\r\t]+).*/.exec(patch);
	let sourceFile;
	if (sourceFileMatch && sourceFileMatch[1]) {
		sourceFile = sourceFileMatch[1];
		if (p && target) {
			sourceFile = _calculatePath(sourceFile, p, target);
		}
	} else {
		throw Error("Unable to find source file in patch");
	}

	const destinationFileMatch = /\+\+\+ ([^ \n\r\t]+).*/.exec(patch);
	let destinationFile;
	if (destinationFileMatch && destinationFileMatch[1]) {
		destinationFile = destinationFileMatch[1];
		if (p && target) {
			destinationFile = _calculatePath(destinationFile, p, target);
		}
	} else {
		throw Error("Unable to find destination file in patch");
	}

	const original = fs.readFileSync(sourceFile, "utf8");
	const patched = diff.applyPatch(original, patch);

	if (patched === false) {
		throw Error("Failed to apply patch to '" + sourceFile + "'");
	} else if (sourceFile !== destinationFile) {
		console.log("Applied patch to '" + sourceFile + "' and stored it as '" +
			destinationFile + "'");
	} else {
		console.log("Applied patch to '" + sourceFile + "'");
	}

	fs.writeFileSync(destinationFile, patched);
}

function applyPatch(patchFile, p, target) {
	const patch = fs.readFileSync(patchFile, 'utf8');
	const patches = patch.match(/^diff .*?[\r\n]*--- [\s\S]*?(?=(^diff|^$))/mg);

	if (!patches) {
		_applyPatch(patch, p, target);
		return;
	}

	for(let patch of patches){
		patch = patch.replace(/^diff .*[\r\n]*/,'');
		_applyPatch(patch, p, target);
	}
}

module.exports = applyPatch;

if (require.main === module) {
	const argv = process.argv;
	if (argv.length === 5) {
		applyPatch(argv[2], argv[3], argv[4]);
	} else {
		applyPatch(argv[2]);
	}
}
