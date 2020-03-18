const vscode = require('vscode');
const DiffMatchPatch = require('diff-match-patch');
const fs = require('fs');
const path = require('path');

const dmp = new DiffMatchPatch();
const prev = new Map();

// DiffMatchPatch.DIFF_DELETE = -1;
// DiffMatchPatch.DIFF_INSERT = 1;
// DiffMatchPatch.DIFF_EQUAL = 0;

function record(fname) {
	const checked = [];
	let dirname = path.dirname(fname);
	while (!checked.includes(dirname)) {
		console.log(dirname);
		checked.push(dirname);
		const recPath = path.join(dirname, "RECORD");
		if (fs.existsSync(recPath)) {
			return true;
		}
		dirname = path.dirname(dirname);
	}

	return false;
}

function onDidCloseTextDocument(event) {
	const fname = event.fileName;
	console.log("close", fname);
	if (prev.has(fname)) {
		prev.delete(fname);
	}
}

function onDidOpenTextDocument(event) {
	const fname = event.fileName;
	console.log("open", fname);
	if (!prev.has(fname) && record(fname)) {
		const contents = fs.readFileSync(fname, 'utf8');
		prev.set(fname, contents);
	}
}

function onDidChangeTextDocument(event) {
	const doc = event.document;
	const fname = doc.fileName;
	console.log("change", doc.fileName);
	if (!prev.has(fname)) {
		return;
	}

	const curr = doc.getText();
	const diff = dmp.diff_main(prev.get(fname), curr);
	dmp.diff_cleanupSemantic(diff);

	for (const change of diff) {
		if (change[0] === DiffMatchPatch.DIFF_EQUAL) {
			continue
		}
		console.log(change[0], change[1]);
	}
	prev.set(fname, curr);
	console.log();
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const subscriptions = context.subscriptions;
	subscriptions.push((vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument)));
	subscriptions.push((vscode.workspace.onDidOpenTextDocument(onDidOpenTextDocument)));
	subscriptions.push((vscode.workspace.onDidCloseTextDocument(onDidCloseTextDocument)));
	console.log('Congratulations, your extension "codereplay" is now active!');
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
