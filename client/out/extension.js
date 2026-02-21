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
    const configArgs = config.get("args");
    const args = ["--lsp", ...((Array.isArray(configArgs) ? configArgs : []))];
    // env should be NodeJS.ProcessEnv. If not set in config, use the current process.env.
    // If config provides an object, merge it on top of process.env so config overrides defaults.
    const configEnv = config.get("env");
    const env = configEnv ? { ...process.env, ...configEnv } : { ...process.env };
    const cwd = config.get("cwd");
    const tcp_port = config.get("tcp_port", undefined);
    const trace_mode = config.get("trace.server");
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel("SUS Language Server");
    }
    outputChannel.appendLine(`Command path is: ${command_path}`);
    // Check sus_compiler version synchronously and ensure it meets minimum requirements
    try {
        const versionOutput = child_process.execFileSync(command_path, ["--version"], { encoding: "utf8" }).trim();
        // Example output: SUS Compiler 0.3.2-devel (bd8e2dab3bd2c33c95620022e25bf4bc327ddc13) built at 2025-10-02T15:12:02+02:00
        const versionMatch = versionOutput.match(/SUS Compiler ([0-9]+)\.([0-9]+)\.([0-9]+)(?:-[^ ]*)?/);
        if (versionMatch) {
            const minVersion = [0, 3, 3]; // Minimum required version: 0.3.3, because this added "without LSP Support" as optional version string
            const currentVersion = [
                parseInt(versionMatch[1], 10),
                parseInt(versionMatch[2], 10),
                parseInt(versionMatch[3], 10)
            ];
            if (currentVersion[0] < minVersion[0]
                || currentVersion[0] == minVersion[0] && currentVersion[1] < minVersion[1]
                || currentVersion[0] == minVersion[0] && currentVersion[1] == minVersion[1] && currentVersion[2] < minVersion[2]) {
                vscode.window.showWarningMessage(`sus_compiler version too old\nMinimum required version is ${minVersion.join('.')}. Update it using "cargo install sus_compiler"`);
            }
            if (versionOutput.includes("without LSP Support")) {
                vscode.window.showErrorMessage(`sus_compiler was not compiled with LSP support: ${command_path} --version: ${versionOutput}\nBuild it with "cargo build --features lsp"`);
                return;
            }
        }
        else {
            vscode.window.showWarningMessage(`Could not parse sus_compiler version from output: ${versionOutput}`);
        }
        vscode.window.showInformationMessage(`${command_path} --version: ${versionOutput}`);
    }
    catch (error) {
        const pathEnv = process.env.PATH ?? "(PATH not set)";
        // Executable not found (cross-platform)
        if (error?.code === "ENOENT") {
            if (command_path === "sus_compiler") {
                vscode.window.showErrorMessage(`sus_compiler not found in PATH.\n\n` +
                    `Install it using:\n` +
                    `  cargo install sus_compiler\n\n` +
                    `Current PATH:\n${pathEnv}`);
            }
            else {
                vscode.window.showErrorMessage(`Executable not found: ${command_path}\n\n` +
                    `Current PATH:\n${pathEnv}`);
            }
            return;
        }
        // Permission problem
        if (error?.code === "EACCES") {
            vscode.window.showErrorMessage(`Permission denied when executing: ${command_path}\n` +
                `Check executable permissions.`);
            return;
        }
        // Process ran but exited non-zero
        if (typeof error?.status === "number") {
            vscode.window.showErrorMessage(`${command_path} exited with code ${error.status}\n\n` +
                `${error.stderr?.toString() ?? ""}`);
            return;
        }
        // Fallback
        vscode.window.showErrorMessage(`Failed to execute ${command_path}:\n${error}`);
        return;
    }
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
    const options = {
        cwd,
        env,
    };
    const serverExecutable = {
        command: command_path,
        options,
        args,
        transport
    };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: serverExecutable,
        debug: serverExecutable
    };
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