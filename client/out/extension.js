"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const child_process = require("child_process");
const node_1 = require("vscode-languageclient/node");
let client;
let outputChannel;
let traceOutputChannel;
function start_lsp() {
    // The server is implemented in node
    const config = vscode.workspace.getConfiguration("sus_lsp");
    let command_path = config.get("executable_path", undefined);
    if (!command_path) {
        command_path = "sus_compiler";
    }
    const args = config.get("args");
    const tcp_port = config.get("tcp_port", undefined);
    const trace_mode = config.get("trace.server");
    console.log("Command path is: ", command_path);
    child_process.exec(command_path + " --version", (error, stdout, stderr) => {
        if (error) {
            // If the executable is not found, show a notification to the user
            if (command_path == "sus_compiler") {
                vscode.window.showErrorMessage(error + 'sus_compiler is not installed. Please install it using "cargo install sus_compiler", or if you have it installed, but not in your PATH, then set "sus_lsp.executable_path" to the path of the executable. Eg: in .vscode/settings.json: "sus_lsp.executable_path" : "/home/lennart/Desktop/sus-compiler/target/release/sus_compiler"');
            }
            else {
                vscode.window.showErrorMessage(error + 'No sus_compiler executable found at "' + command_path + '" Please install it using "cargo install sus_compiler", or if you have it installed, but not in your PATH, then set "sus_lsp.executable_path" to the path of the executable. Eg: in .vscode/settings.json: "sus_lsp.executable_path" : "/home/lennart/Desktop/sus-compiler/target/release/sus_compiler"');
            }
            return;
        }
        // If the executable is found, you can log the version or do something else
        vscode.window.showInformationMessage(`sus_compiler --version: ${stdout}`);
    });
    let transport;
    if (tcp_port) {
        transport = {
            kind: node_1.TransportKind.socket,
            port: tcp_port
        };
    }
    else {
        transport = node_1.TransportKind.stdio;
    }
    const serverExecutable = {
        command: String(command_path),
        args,
        transport
    };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: serverExecutable,
        debug: serverExecutable
    };
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel("SUS Language Server");
    }
    if (trace_mode != "off" && !traceOutputChannel) {
        traceOutputChannel = vscode.window.createOutputChannel("SUS LSP Trace");
    }
    // Options to control the language client
    const clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: "file", language: 'sus' }],
        synchronize: {
            // Notify the server about file changes to '.sus files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.sus')
        },
        outputChannel,
        traceOutputChannel,
        revealOutputChannelOn: node_1.RevealOutputChannelOn.Error,
        //errorHandler: createDefaultErrorHandler(undefined)
        connectionOptions: {
            maxRestartCount: 0
        },
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('sus_lsp', 'SUS Language Server', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
}
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("sus.restartServer", async () => {
        if (client) {
            if (client.state == node_1.State.Running) {
                // Don't use client.restart(), because we want to reload the settings
                return client.stop().then(() => {
                    client.dispose().then(() => {
                        client = undefined;
                        start_lsp();
                    });
                });
            }
            else {
                client = undefined;
                start_lsp();
            }
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