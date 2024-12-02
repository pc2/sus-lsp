"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const child_process = require("child_process");
const node_1 = require("vscode-languageclient/node");
let client;
function start_lsp() {
    // The server is implemented in node
    const config = vscode.workspace.getConfiguration("sus_lsp");
    let command_path = config.get("executable_path");
    if (!command_path) {
        command_path = "sus_compiler";
    }
    const args = config.get("args");
    const tcp_port = config.get("tcp_port");
    console.log("Command path is: ", command_path);
    child_process.exec(command_path + " --version", (error, stdout, stderr) => {
        if (error) {
            // If the executable is not found, show a notification to the user
            if (command_path == "sus_compiler") {
                vscode.window.showErrorMessage('sus_compiler is not installed. Please install it using "cargo install sus_compiler", or if you have it installed, but not in your PATH, then set "sus_lsp.executable_path" to the path of the executable. Eg: in .vscode/settings.json: "sus_lsp.executable_path" : "/home/lennart/Desktop/sus-compiler/target/release/sus_compiler"');
            }
            else {
                vscode.window.showErrorMessage('No sus_compiler executable found at "' + command_path + '" Please install it using "cargo install sus_compiler", or if you have it installed, but not in your PATH, then set "sus_lsp.executable_path" to the path of the executable. Eg: in .vscode/settings.json: "sus_lsp.executable_path" : "/home/lennart/Desktop/sus-compiler/target/release/sus_compiler"');
            }
            return;
        }
        // If the executable is found, you can log the version or do something else
        vscode.window.showInformationMessage(`sus_compiler --version: ${stdout}`);
    });
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
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.sus')
        },
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('susLanguageServer', 'SUS Language Server', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
}
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("sus.restartServer", async () => {
        if (client) {
            client.restart();
        }
        else {
            start_lsp();
        }
    }));
    start_lsp();
}
exports.activate = activate;
function deactivate() {
    if (client) {
        return client.stop().then(() => {
            client.dispose().then(() => {
                client = undefined;
            });
        });
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map