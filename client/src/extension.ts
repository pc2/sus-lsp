/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, commands } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	Executable
} from 'vscode-languageclient/node';

let client: LanguageClient;

function start_lsp() {
	// The server is implemented in node
	const config = workspace.getConfiguration("sus_lsp");
	const command_path = config.get("executable_path");
	console.log("Command path is: ", command_path);
	const serverExecutable: Executable = {
		command: String(command_path),
		args: ["--lsp"],
		transport : TransportKind.stdio
		/*transport: {
			kind: TransportKind.socket,
			port: 25000
		}*/
	};
	/*const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);*/

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: serverExecutable,
		debug : serverExecutable
		//run: { module: serverModule, transport: TransportKind.ipc },
		//debug: {
		//	module: serverModule,
		//	transport: TransportKind.ipc,
		//}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: "file", language: 'sus' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.sus')
		},
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

function stop_lsp() {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function restart_lsp() {
	stop_lsp();
	start_lsp();
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand("sus.restartServer", restart_lsp));

	start_lsp();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
