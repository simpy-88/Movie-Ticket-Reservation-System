// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/image-store.js
// Description: Persistent IndexedDB Image Store for Administrator Poster Uploads
// Provides Blob storage without localStorage size limits or temporary URL expiry.
// ============================================================================

(function () {
    'use strict';

    const DB_NAME = 'MTRS_POSTER_STORE';
    const DB_VERSION = 1;
    const STORE_NAME = 'posters';

    class MTRSImageStore {
        constructor() {
            this.db = null;
            this.posterUrls = {}; // Memory cache: movieId -> Object URL
            this.isReady = false;
            this.initPromise = this.init();
        }

        async init() {
            if (this.isReady && this.db) return this.db;

            return new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    console.warn('IndexedDB not supported in this browser. Falling back to memory store.');
                    this.isReady = true;
                    resolve(null);
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'movieId' });
                    }
                };

                request.onsuccess = async (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    await this.preloadAllPosters();
                    resolve(this.db);
                };

                request.onerror = (event) => {
                    console.error('Failed to open MTRS IndexedDB poster store:', event.target.error);
                    this.isReady = true;
                    resolve(null);
                };
            });
        }

        /**
         * Preloads all stored poster Blobs into memory Object URLs for instant synchronous rendering
         */
        async preloadAllPosters() {
            if (!this.db) return;

            return new Promise((resolve) => {
                try {
                    const tx = this.db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.getAll();

                    req.onsuccess = () => {
                        const records = req.result || [];
                        records.forEach(rec => {
                            if (rec && rec.movieId && rec.blob) {
                                // Revoke old if present
                                if (this.posterUrls[rec.movieId]) {
                                    URL.revokeObjectURL(this.posterUrls[rec.movieId]);
                                }
                                this.posterUrls[rec.movieId] = URL.createObjectURL(rec.blob);
                            }
                        });
                        resolve();
                    };

                    req.onerror = () => {
                        console.warn('Failed to preload posters from IndexedDB');
                        resolve();
                    };
                } catch (e) {
                    console.warn('Error reading from IndexedDB:', e);
                    resolve();
                }
            });
        }

        /**
         * Returns preloaded Object URL for synchronous rendering
         */
        getPosterUrl(movieId) {
            if (!movieId) return null;
            return this.posterUrls[movieId] || null;
        }

        /**
         * Validates and saves an uploaded poster Blob into IndexedDB
         */
        async savePoster(movieId, fileOrBlob) {
            if (!movieId) throw new Error('Movie ID is required for saving poster.');
            if (!fileOrBlob) throw new Error('No image file provided.');

            // Validate file type: JPEG, PNG, WebP
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(fileOrBlob.type.toLowerCase())) {
                throw new Error(`Invalid file type (${fileOrBlob.type}). Please upload a JPEG, PNG, or WebP image.`);
            }

            // Validate file size: maximum 5 MB
            const maxSize = 5 * 1024 * 1024;
            if (fileOrBlob.size > maxSize) {
                const sizeMB = (fileOrBlob.size / (1024 * 1024)).toFixed(1);
                throw new Error(`File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
            }

            await this.initPromise;

            return new Promise((resolve, reject) => {
                // Revoke old object URL
                if (this.posterUrls[movieId]) {
                    URL.revokeObjectURL(this.posterUrls[movieId]);
                    delete this.posterUrls[movieId];
                }

                // Create fresh object URL
                const objectUrl = URL.createObjectURL(fileOrBlob);
                this.posterUrls[movieId] = objectUrl;

                if (!this.db) {
                    // Fallback to memory
                    resolve(objectUrl);
                    return;
                }

                try {
                    const tx = this.db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    const record = {
                        movieId: movieId,
                        blob: fileOrBlob,
                        type: fileOrBlob.type,
                        size: fileOrBlob.size,
                        updatedAt: Date.now()
                    };

                    const req = store.put(record);
                    req.onsuccess = () => resolve(objectUrl);
                    req.onerror = (e) => reject(e.target.error || new Error('Failed to save poster in IndexedDB'));
                } catch (err) {
                    reject(err);
                }
            });
        }

        /**
         * Deletes poster from IndexedDB and revokes memory URL
         */
        async removePoster(movieId) {
            if (!movieId) return;
            await this.initPromise;

            if (this.posterUrls[movieId]) {
                URL.revokeObjectURL(this.posterUrls[movieId]);
                delete this.posterUrls[movieId];
            }

            if (!this.db) return;

            return new Promise((resolve) => {
                try {
                    const tx = this.db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.delete(movieId);
                    req.onsuccess = () => resolve(true);
                    req.onerror = () => resolve(false);
                } catch (e) {
                    resolve(false);
                }
            });
        }
    }

    window.MTRSImageStore = new MTRSImageStore();
})();
