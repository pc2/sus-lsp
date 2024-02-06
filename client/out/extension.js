"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function start_lsp() {
    // The server is implemented in node
    const config = vscode_1.workspace.getConfiguration("sus_lsp");
    const command_path = config.get("executable_path");
    const args = config.get("args");
    const tcp_port = config.get("tcp_port");
    console.log("Command path is: ", command_path);
    const serverExecutable = {
        command: String(command_path),
        args,
        transport: {
            kind: node_1.TransportKind.socket,
            port: tcp_port
        }
    };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: serverExecutable,
        debug: serverExecutable
        //run: { module: serverModule, transport: TransportKind.ipc },
        //debug: {
        //	module: serverModule,
        //	transport: TransportKind.ipc,
        //}
    };
    // Options to control the language client
    const clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: "file", language: 'sus' }],
        synchronize: {
            // Notify the server about file changes to '.sus files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.sus')
        },
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('susLanguageServer', 'SUS Language Server', serverOptions, clientOptions);
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
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand("sus.restartServer", restart_lsp));
    start_lsp();
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map