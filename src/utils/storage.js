import localforage from 'localforage';
/**
 * @desc https://localforage.github.io/localForage/
 */
class DBStorage {
    constructor(driver) {
        this.storage = localforage.createInstance({ name: 'h5ds', driver: driver });
    }
    getAsync(storeName, key) {
        this.storage.config({ storeName });
        return this.storage.getItem(key);
    }

    setAsync(storeName, key, value) {
        this.storage.config({ storeName });
        return this.storage.setItem(key, value);
    }

    removeAsync(storeName, key) {
        this.storage.config({ storeName });
        return this.storage.removeItem(key);
    }

    clearAsync(storeName) {
        return localforage.dropInstance({ name: 'h5ds', storeName });
    }
}

export const storage = new DBStorage(localforage.LOCALSTORAGE);
