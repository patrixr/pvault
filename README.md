# pvault

Save your api keys in a password protected file on your repo.

## Demo

![demo-gif](https://raw.githubusercontent.com/patrixr/pvault/master/resources/tty_cropped.gif)

## Getting started

```console
npm install && npm test
```

## CLI

Create a new vault

```console
pvault create <name>
```

List existing vaults

```console
pvault list
```

#### Shell

Once a vault is open, the following commands are available :

- `set <key> <value>`
  
- `unset <key>`

- `get <key>`
  
- `dump`

- `exit`

## Opening a vault from the application

```javascript
  var pvault    = require('pvault');
  var Vault     = pvault(process.cwd()); // Vault folder

  var apiKeys = new Vault('apiKeys', process.ENV.PVAULT_PASSWORD);
  
  apiKeys.get('github');
```
