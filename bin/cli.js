#! /usr/bin/env node

var program   = require('commander');
var pkg       = require('../package.json');
var pvault    = require('../index');
var fs        = require('fs');
var path      = require('path');
var Input     = require('prompt-input');
var List      = require('prompt-list');

var Vault = pvault(process.cwd());

function interrupt(msg) {
    console.error(msg);
    process.exit(1);
}

function getAvailableVaults() {
    return fs.readdirSync(process.cwd())
        .filter(function (file) {
            return /\.pv$/.test(file);
        })
        .map(function (file) {
            return file.replace(/\.pv$/, "");
        });
}

function vaultSelect() {
    var vaults = getAvailableVaults();
    if (vaults.length == 0) {
        interrupt("No vaults found");
    }

    var list = new List({
        name: 'vault',
        message: 'Select vault',
        choices: vaults
    });
    list.ask((vaultName) => {
        new Input({ name: 'password', message: 'Please enter password' }).ask(function (pw) {
            try {
                vaultPrompt(new Vault(vaultName, pw));
            } catch (e) {
                interrupt("Opening vault failed. Please verify password")
            }
        });
    });
}

function vaultPrompt(vault) {
    var commands = {
        "set": { 
            params: 2,
            action: function (key, value) {
                vault.set(key, value);
                console.log("New value : " + value);
            }
         },
        "unset": { 
            params: 1,
            action: function (key) {
                vault.unset(key);
                console.log(key + " deleted");
            }},
        "get": { 
            params: 1,
            action: function(key) {
                console.log(key + ": " + vault.get(key));
            }
        },
        "dump": { 
            params: 0,
            action: function(key) {
                vault.keys().forEach(function (key) {
                    console.log(key + ": " + vault.get(key));
                })
            }
        },
        "exit": {
            params: 0,
            action: function () {
                process.exit()
            }
        }
    }

    new Input({ message: '$>' }).ask(function (text) {
        var split = text.split(' ');
        var cmd = commands[split[0]];
        if (!cmd) {
            console.error("Unknown command");
            return vaultPrompt(vault);
        }

        if (split.length - 1 < cmd.params) {
            console.error("Command " + split[0] + " requires " + cmd.params + " arguments");
            return vaultPrompt(vault);
        }

        cmd.action.apply(null, split.slice(1));
        vaultPrompt(vault);
    })
}

program
    .version(pkg.version, '-v, --version')
    .usage('[options]');

program
    .command("create [vault]")
    .description("Create a new vault")
    .action(function (name) {
        if (!name) {
            interrupt("Invalid or missing vault name");
        }

        if (fs.existsSync(path.join(process.cwd(), name + ".pv"))) {
            interrupt("A vault with the same name already exists");
        }

        new Input({ name: 'password', message: 'Please create a password' })
            .ask(function (pw) {
                new Input({ name: 'confirmation', message: 'Please confirm password' })
                    .ask(function (confirmation) {
                        if (confirmation != pw) {
                            interrupt("Passwords don't match");
                        }

                        var v = new Vault(name, pw, { create: true });
                        vaultPrompt(v);
                    });
            });
    });

program
    .command("shell")
    .description("View and update vaults")
    .action(vaultSelect);

program.parse(process.argv);