import _            from 'lodash'
import { expect }   from 'chai'
import rimraf       from 'rimraf'
import path         from 'path'
import pvault       from '../lib/vault'
import fs           from 'fs'
import crypto       from 'crypto'

const testFolder    = path.join(__dirname, '__testVault');
const Vault         = pvault(testFolder);

function vaultName() {
    return crypto.randomBytes(6).toString('hex');
}

describe("Vault", () => {
    
    let vault = null; 

    after((done) => {
        rimraf(testFolder, done)
    });

    it("Should throw when opening a vault that doesn't exist", () => {
        expect(() => new Vault(vaultName(), "password")).to.throw
    })

    it("Should create a vault with the 'create' option if the vault doesn't exist", () => {
        const name      = vaultName();
        const vault     = new Vault(name, "password", { create : true });
        const exists    = fs.existsSync(path.join(testFolder, `${name}.pv`));

        expect(exists).to.be.true;
    });

    it("Should fail to open a vault with a wrong password", () => {
        const name = vaultName();
        new Vault(name, "password", { create : true });
        
        expect(() => {
            new Vault(name, "bad_password");
        }).to.throw

        expect(() => {
            new Vault(name, "password");
        }).to.not.throw
    });

    it("Should return null for missing keys", () => {
        const name = vaultName();
        const vault = new Vault(name, "password", { create : true });

        expect(vault.get("i.dont.exist")).to.be.null;
    });

    it("Should set and get keys from a vault", (done) => {
        const name = vaultName();
        const vault = new Vault(name, "password", { create : true });

        vault.set("apikey", "foo", (err) => {
            expect(err).to.be.null;
            expect(vault.get("apikey")).to.equal("foo");
            done();
        });
    });

    it("Two vaults with the same name should share the file", (done) => {
        const name = vaultName();
        const vault = new Vault(name, "password", { create : true });

        vault.set("apikey", "foo", (err) => {
            const clone = new Vault(name, "password");
            expect(clone.get("apikey")).to.equal("foo");
            done();
        });
    });

    it("Should delete keys from a vault", () => {
        const name = vaultName();
        const vault = new Vault(name, "password", { create : true });

        vault.set("foo", "bar", (err) => {
            expect(err).to.be.null;
            expect(vault.get("foo")).to.equal("bar");
            vault.unset("foo");
            expect(vault.get("foo")).to.be.null;
        });
    });

    it("Should list the keys from a vault", () => {
        const name = vaultName();
        const vault = new Vault(name, "password", { create : true });

        vault.set("foo", "a");
        vault.set("bar", "b");

        expect(vault.keys()).to.deep.equal(["foo", "bar"]);
    });

})