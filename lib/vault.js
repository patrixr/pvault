import crypto   from "crypto"
import fs       from "fs"
import path     from "path"
import mkdirp   from "mkdirp"
import _        from "lodash"

module.exports = (folder) => {

    const ALGORITHM = 'AES-128-CBC';
    const EXT       = '.pv';
    const KEY_LEN   = 16;

    mkdirp.sync(folder);

    /**
     * Password storage
     * 
     * @class Vault
     */
    class Vault {

        constructor(name, secret, { create = false } = {}) {
            this.filepath = path.join(folder, name + EXT);
            this.encryptionKey = crypto
                .createHash("sha256")
                .update(secret)
                .digest()
                .slice(0, KEY_LEN);
                
            if (create && !fs.existsSync(this.filepath)) {
                const now = Date.now();
                this.data = {
                    _createdAt: now,
                    _updatedAt: now,
                    records: {}
                };

                return this._save();
            }

            this._readFromFile(this.filepath);
        }

        set(key, value, cb = _.noop) {
            this.data.records[key] = value;
            return this._save(cb);
        }

        get(key) {
            return this.data.records[key] || null;
        }

        unset(key, cb) {
            delete this.data.records[key];
            return this._save(cb);
        }

        keys() {
            return _.keys(this.data.records);
        }

        _encrypt(data) {
            const iv        = crypto.randomBytes(KEY_LEN);
            const cipher    = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv)

            let crypted = cipher.update(data, 'utf8', 'hex')
            crypted += cipher.final('hex');
            return `${iv.toString('hex')}:${crypted}`;
        }

        _decrypt(data){
            const sepIdx = data.indexOf(':');
            const iv = new Buffer(data.slice(0, sepIdx), "hex");
            const enc = data.slice(sepIdx + 1);

            if (iv.length != KEY_LEN) {
                throw new Error("Invalid vault file");
            }
            
            let decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv)
            let dec = decipher.update(enc, 'hex', 'utf8')
            dec += decipher.final('utf8');
            return dec;
        }

        _save(cb) {
            this.data._updatedAt = Date.now();
            const encrypted = this._encrypt(JSON.stringify(this.data));
            if (cb) {
                fs.writeFile(this.filepath, encrypted, cb);
            } else {
                fs.writeFileSync(this.filepath, encrypted, cb);
            }
        }

        _readFromFile(filepath) {
            const str = this._decrypt(fs.readFileSync(filepath).toString());
            const data = JSON.parse(str);
            const corrupt = (
                _.keys(data).length != 3
                || _.isNaN(data._createdAt) 
                || _.isNaN(data._updatedAt)
                || !_.isObject(data.records)
            )

            if (corrupt) {
                throw new Error("Invalid vault file");
            }

            this.data = data;
        }

    };

    return Vault;
}