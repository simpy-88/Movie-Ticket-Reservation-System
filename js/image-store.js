// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/image-store.js
// Description: Persistent IndexedDB Image Store for Posters & Hero Backdrops
// Provides Blob storage without localStorage size limits or temporary URL expiry.
// Independently stores portrait posters and widescreen cinematic backdrops.
// ============================================================================

(function () {
    'use strict';

    const DB_NAME = 'MTRS_POSTER_STORE';
    const DB_VERSION = 2; // Version 2: adds independent 'backdrops' store
    const POSTERS_STORE = 'posters';
    const BACKDROPS_STORE = 'backdrops';

    class MTRSImageStore {
        constructor() {
            this.db = null;
            this.posterUrls = {};   // Memory cache: movieId -> Object URL (Posters)
            this.backdropUrls = {}; // Memory cache: movieId -> Object URL (Backdrops)
            this.isReady = false;
            this.initPromise = this.init();
        }

        async init() {
            if (this.isReady && this.db) return this.db;

            return new Promise((resolve) => {
                if (!window.indexedDB) {
                    console.warn('[MTRS ImageStore] IndexedDB not supported. Falling back to in-memory store.');
                    this.isReady = true;
                    resolve(null);
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(POSTERS_STORE)) {
                        db.createObjectStore(POSTERS_STORE, { keyPath: 'movieId' });
                    }
                    if (!db.objectStoreNames.contains(BACKDROPS_STORE)) {
                        db.createObjectStore(BACKDROPS_STORE, { keyPath: 'movieId' });
                    }
                };

                request.onsuccess = async (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    await this.preloadAllImages();
                    resolve(this.db);
                };

                request.onerror = (event) => {
                    console.error('[MTRS ImageStore] Failed to open IndexedDB:', event.target.error);
                    this.isReady = true;
                    resolve(null);
                };
            });
        }

        /**
         * Preloads all stored poster and backdrop Blobs into memory Object URLs
         */
        async preloadAllImages() {
            if (!this.db) return;

            await Promise.all([
                this._preloadStore(POSTERS_STORE, this.posterUrls),
                this._preloadStore(BACKDROPS_STORE, this.backdropUrls)
            ]);

            // Dispatch legacy and modern events for instant UI synchronization
            window.dispatchEvent(new CustomEvent('mtrs:posters-loaded', { detail: { posterUrls: this.posterUrls } }));
            window.dispatchEvent(new CustomEvent('mtrs:artwork-updated', {
                detail: {
                    posterUrls: this.posterUrls,
                    backdropUrls: this.backdropUrls
                }
            }));
        }

        /**
         * Backward compatibility alias
         */
        async preloadAllPosters() {
            return this.preloadAllImages();
        }

        _preloadStore(storeName, targetMap) {
            return new Promise((resolve) => {
                try {
                    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
                        resolve();
                        return;
                    }
                    const tx = this.db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.getAll();

                    req.onsuccess = () => {
                        const records = req.result || [];
                        records.forEach(rec => {
                            if (rec && rec.movieId && rec.blob) {
                                if (targetMap[rec.movieId]) {
                                    URL.revokeObjectURL(targetMap[rec.movieId]);
                                }
                                targetMap[rec.movieId] = URL.createObjectURL(rec.blob);
                            }
                        });
                        resolve();
                    };

                    req.onerror = () => {
                        console.warn(`[MTRS ImageStore] Failed to preload ${storeName}`);
                        resolve();
                    };
                } catch (e) {
                    console.warn(`[MTRS ImageStore] Error preloading ${storeName}:`, e);
                    resolve();
                }
            });
        }

        /**
         * Synchronous getter for preloaded poster Object URL
         */
        getPosterUrl(movieId) {
            if (!movieId) return null;
            return this.posterUrls[movieId] || null;
        }

        /**
         * Synchronous getter for preloaded backdrop Object URL
         */
        getBackdropUrl(movieId) {
            if (!movieId) return null;
            return this.backdropUrls[movieId] || null;
        }

        hasCustomPoster(movieId) {
            return !!this.getPosterUrl(movieId);
        }

        hasCustomBackdrop(movieId) {
            return !!this.getBackdropUrl(movieId);
        }

        /**
         * Validates image file type and maximum size
         */
        validateImageFile(fileOrBlob, isBackdrop = false) {
            if (!fileOrBlob) throw new Error('No image file selected.');

            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const fileType = (fileOrBlob.type || '').toLowerCase();
            if (!validTypes.includes(fileType)) {
                throw new Error(`Invalid file type "${fileOrBlob.type || 'unknown'}". Please select a JPEG, PNG, or WebP image.`);
            }

            // Up to 25 MB to accommodate lossless high-res 4K assets
            const maxSize = 25 * 1024 * 1024;
            if (fileOrBlob.size > maxSize) {
                const sizeMB = (fileOrBlob.size / (1024 * 1024)).toFixed(1);
                throw new Error(`File is too large (${sizeMB} MB). Maximum allowed size is 25 MB.`);
            }

            return true;
        }

        /**
         * Saves an uploaded portrait poster Blob into IndexedDB
         */
        async savePoster(movieId, fileOrBlob) {
            if (!movieId) throw new Error('Movie ID is required to save poster.');
            this.validateImageFile(fileOrBlob, false);
            await this.initPromise;
            return this._saveRecord(POSTERS_STORE, movieId, fileOrBlob, this.posterUrls);
        }

        /**
         * Saves an uploaded landscape backdrop Blob into IndexedDB
         */
        async saveBackdrop(movieId, fileOrBlob) {
            if (!movieId) throw new Error('Movie ID is required to save backdrop.');
            this.validateImageFile(fileOrBlob, true);
            await this.initPromise;
            return this._saveRecord(BACKDROPS_STORE, movieId, fileOrBlob, this.backdropUrls);
        }

        async _saveRecord(storeName, movieId, fileOrBlob, targetMap) {
            return new Promise((resolve, reject) => {
                // Revoke previous Object URL for this movie and store
                if (targetMap[movieId]) {
                    URL.revokeObjectURL(targetMap[movieId]);
                    delete targetMap[movieId];
                }

                // Create fresh Object URL
                const objectUrl = URL.createObjectURL(fileOrBlob);
                targetMap[movieId] = objectUrl;

                if (!this.db) {
                    window.dispatchEvent(new CustomEvent('mtrs:artwork-updated', {
                        detail: { movieId, storeName, url: objectUrl }
                    }));
                    resolve(objectUrl);
                    return;
                }

                try {
                    const tx = this.db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const record = {
                        movieId: String(movieId).trim(),
                        blob: fileOrBlob,
                        type: fileOrBlob.type,
                        size: fileOrBlob.size,
                        updatedAt: Date.now()
                    };

                    const req = store.put(record);
                    req.onsuccess = () => {
                        window.dispatchEvent(new CustomEvent('mtrs:artwork-updated', {
                            detail: { movieId, storeName, url: objectUrl }
                        }));
                        resolve(objectUrl);
                    };
                    req.onerror = (e) => reject(e.target.error || new Error(`Failed to save ${storeName} to IndexedDB`));
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * Removes poster from IndexedDB and revokes its memory URL
         */
        async removePoster(movieId) {
            if (!movieId) return;
            await this.initPromise;
            return this._removeRecord(POSTERS_STORE, movieId, this.posterUrls);
        }

        async deletePoster(movieId) {
            return this.removePoster(movieId);
        }

        /**
         * Removes backdrop from IndexedDB and revokes its memory URL
         */
        async removeBackdrop(movieId) {
            if (!movieId) return;
            await this.initPromise;
            return this._removeRecord(BACKDROPS_STORE, movieId, this.backdropUrls);
        }

        async deleteBackdrop(movieId) {
            return this.removeBackdrop(movieId);
        }

        async _removeRecord(storeName, movieId, targetMap) {
            if (targetMap[movieId]) {
                URL.revokeObjectURL(targetMap[movieId]);
                delete targetMap[movieId];
            }

            if (!this.db) {
                window.dispatchEvent(new CustomEvent('mtrs:artwork-updated', {
                    detail: { movieId, storeName, removed: true }
                }));
                return true;
            }

            return new Promise((resolve) => {
                try {
                    const tx = this.db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const req = store.delete(String(movieId).trim());
                    req.onsuccess = () => {
                        window.dispatchEvent(new CustomEvent('mtrs:artwork-updated', {
                            detail: { movieId, storeName, removed: true }
                        }));
                        resolve(true);
                    };
                    req.onerror = () => resolve(false);
                } catch (e) {
                    resolve(false);
                }
            });
        }
    }

    window.MTRSImageStore = new MTRSImageStore();
})();
