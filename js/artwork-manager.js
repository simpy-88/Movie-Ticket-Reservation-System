// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/artwork-manager.js
// Description: User-friendly Artwork Manager Controller
// Allows direct upload, preview, and reset of movie posters & cinematic backdrops.
// Works independently with persistent IndexedDB storage & reactive hero slideshow.
// ============================================================================

(function () {
    'use strict';

    class MTRSArtworkManager {
        constructor() {
            this.selectedMovieId = null;
            this.pendingPosterFile = null;
            this.pendingPosterPreviewUrl = null;
            this.pendingBackdropFile = null;
            this.pendingBackdropPreviewUrl = null;
            this.isSaving = false;

            this.dom = {};
            this.init();
        }

        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.bindDom());
            } else {
                this.bindDom();
            }
        }

        bindDom() {
            this.dom.modal = document.getElementById('artwork-manager-modal');
            this.dom.movieSelect = document.getElementById('art-movie-select');
            this.dom.movieName = document.getElementById('art-movie-name');
            this.dom.movieId = document.getElementById('art-movie-id');
            this.dom.movieGenre = document.getElementById('art-movie-genre');

            // Poster elements
            this.dom.posterContainer = document.getElementById('art-poster-preview-container');
            this.dom.posterStatus = document.getElementById('art-poster-status');
            this.dom.posterFileInput = document.getElementById('art-poster-file-input');
            this.dom.btnUploadPoster = document.getElementById('btn-art-upload-poster');
            this.dom.btnResetPoster = document.getElementById('btn-art-reset-poster');

            // Backdrop elements
            this.dom.backdropContainer = document.getElementById('art-backdrop-preview-container');
            this.dom.backdropStatus = document.getElementById('art-backdrop-status');
            this.dom.backdropFileInput = document.getElementById('art-backdrop-file-input');
            this.dom.btnUploadBackdrop = document.getElementById('btn-art-upload-backdrop');
            this.dom.btnResetBackdrop = document.getElementById('btn-art-reset-backdrop');

            // Global controls
            this.dom.btnSave = document.getElementById('btn-art-save');
            this.dom.btnClose = document.getElementById('btn-art-close');
            this.dom.statusBanner = document.getElementById('art-status-banner');

            if (!this.dom.modal) return;

            // Event Listeners
            if (this.dom.movieSelect) {
                this.dom.movieSelect.addEventListener('change', (e) => {
                    this.selectMovie(e.target.value);
                });
            }

            if (this.dom.posterFileInput) {
                this.dom.posterFileInput.addEventListener('change', (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) this.handlePosterSelected(file);
                });
            }

            if (this.dom.backdropFileInput) {
                this.dom.backdropFileInput.addEventListener('change', (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) this.handleBackdropSelected(file);
                });
            }

            if (this.dom.btnUploadPoster) {
                this.dom.btnUploadPoster.addEventListener('click', () => {
                    if (this.dom.posterFileInput) this.dom.posterFileInput.click();
                });
            }

            if (this.dom.btnUploadBackdrop) {
                this.dom.btnUploadBackdrop.addEventListener('click', () => {
                    if (this.dom.backdropFileInput) this.dom.backdropFileInput.click();
                });
            }

            if (this.dom.btnResetPoster) {
                this.dom.btnResetPoster.addEventListener('click', () => this.resetPoster());
            }

            if (this.dom.btnResetBackdrop) {
                this.dom.btnResetBackdrop.addEventListener('click', () => this.resetBackdrop());
            }

            if (this.dom.btnSave) {
                this.dom.btnSave.addEventListener('click', () => this.saveChanges());
            }

            if (this.dom.btnClose) {
                this.dom.btnClose.addEventListener('click', () => this.close());
            }

            // Close on backdrop click
            this.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.dom.modal) this.close();
            });

            // Close on ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.dom.modal && this.dom.modal.classList.contains('active')) {
                    this.close();
                }
            });
        }

        /**
         * Resolves current list of movies from Supabase, Engine, or Poster Registry
         */
        getAvailableMovies() {
            if (window.App && Array.isArray(window.App.movies) && window.App.movies.length > 0) {
                return window.App.movies;
            }
            if (window.MTRSEngine && typeof window.MTRSEngine.getTable === 'function') {
                const dbMovies = window.MTRSEngine.getTable('MOVIE');
                if (Array.isArray(dbMovies) && dbMovies.length > 0) return dbMovies;
            }
            if (window.MTRSPosters && typeof window.MTRSPosters.getRegistry === 'function') {
                const reg = window.MTRSPosters.getRegistry();
                return Object.values(reg).map(r => ({
                    Movie_ID: r.id,
                    Movie_Name: r.title,
                    Genre: 'Theatrical Release'
                }));
            }
            return [];
        }

        /**
         * Finds movie object by Movie_ID
         */
        findMovie(movieId) {
            const movies = this.getAvailableMovies();
            return movies.find(m => m.Movie_ID === movieId) || {
                Movie_ID: movieId,
                Movie_Name: movieId,
                Genre: 'Action / Cinema'
            };
        }

        /**
         * Opens the Artwork Manager modal
         */
        open(initialMovieId = null) {
            this.bindDom();
            if (!this.dom.modal) return;

            const movies = this.getAvailableMovies();
            if (!movies || movies.length === 0) {
                alert('No movies found in the catalogue to manage.');
                return;
            }

            // Populate movie dropdown
            if (this.dom.movieSelect) {
                this.dom.movieSelect.innerHTML = movies.map(m => `
                    <option value="${m.Movie_ID}">${m.Movie_Name} (${m.Movie_ID})</option>
                `).join('');
            }

            // Choose selected movie
            let targetId = initialMovieId;
            if (!targetId || !movies.some(m => m.Movie_ID === targetId)) {
                targetId = this.selectedMovieId && movies.some(m => m.Movie_ID === this.selectedMovieId) ?
                    this.selectedMovieId : movies[0].Movie_ID;
            }

            this.selectedMovieId = targetId;
            if (this.dom.movieSelect) {
                this.dom.movieSelect.value = targetId;
            }

            // Discard prior uncommitted uploads
            this.discardPending();
            this.clearStatus();

            // Render view
            this.refreshView();

            // Display modal
            this.dom.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        /**
         * Closes the Artwork Manager modal and cleans up temporary resources
         */
        close() {
            this.discardPending();
            if (this.dom.modal) {
                this.dom.modal.classList.remove('active');
            }
            document.body.style.overflow = '';
        }

        discardPending() {
            if (this.pendingPosterPreviewUrl) {
                URL.revokeObjectURL(this.pendingPosterPreviewUrl);
                this.pendingPosterPreviewUrl = null;
            }
            this.pendingPosterFile = null;

            if (this.pendingBackdropPreviewUrl) {
                URL.revokeObjectURL(this.pendingBackdropPreviewUrl);
                this.pendingBackdropPreviewUrl = null;
            }
            this.pendingBackdropFile = null;

            if (this.dom.posterFileInput) this.dom.posterFileInput.value = '';
            if (this.dom.backdropFileInput) this.dom.backdropFileInput.value = '';

            this.updateSaveButton();
        }

        selectMovie(movieId) {
            if (!movieId || movieId === this.selectedMovieId) return;
            this.discardPending();
            this.clearStatus();
            this.selectedMovieId = movieId;
            this.refreshView();
        }

        /**
         * Refreshes all preview elements and metadata badges for current movie
         */
        refreshView() {
            if (!this.selectedMovieId) return;

            const movie = this.findMovie(this.selectedMovieId);
            const movieId = movie.Movie_ID;

            // Update title and badges
            if (this.dom.movieName) this.dom.movieName.textContent = movie.Movie_Name;
            if (this.dom.movieId) this.dom.movieId.textContent = `ID: ${movieId}`;
            if (this.dom.movieGenre) this.dom.movieGenre.textContent = movie.Genre || 'Feature Film';

            // ----------------------------------------------------------------
            // 1. POSTER PREVIEW & BADGE
            // ----------------------------------------------------------------
            const hasUploadedPoster = window.MTRSImageStore && window.MTRSImageStore.hasCustomPoster(movieId);
            const hasConfiguredPoster = window.MTRSPosters && !!window.MTRSPosters.getCustomPoster(movieId);
            const dbPoster = movie.Poster_Hires_Url || movie.Poster_Url || movie.poster_url || '';

            let posterSrc = '';
            let posterBadgeHtml = '';

            if (this.pendingPosterPreviewUrl) {
                posterSrc = this.pendingPosterPreviewUrl;
                posterBadgeHtml = `<span class="art-badge art-badge-staged">● Pending Upload (Staged)</span>`;
                if (this.dom.btnResetPoster) this.dom.btnResetPoster.style.display = 'inline-flex';
            } else if (dbPoster) {
                posterSrc = window.MTRSPosters ? window.MTRSPosters.resolvePoster(movie, { size: 'w780' }) : dbPoster;
                if (dbPoster.includes('movie-artwork') || dbPoster.includes('supabase.co/storage')) {
                    posterBadgeHtml = `<span class="art-badge art-badge-uploaded" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4);">✓ Cloud Synced (Supabase Storage)</span>`;
                } else {
                    posterBadgeHtml = `<span class="art-badge art-badge-uploaded">✓ Database Linked URL</span>`;
                }
                if (this.dom.btnResetPoster) this.dom.btnResetPoster.style.display = 'inline-flex';
            } else if (hasUploadedPoster) {
                posterSrc = window.MTRSImageStore.getPosterUrl(movieId);
                posterBadgeHtml = `<span class="art-badge art-badge-config">💾 Local Cache (IndexedDB)</span>`;
                if (this.dom.btnResetPoster) this.dom.btnResetPoster.style.display = 'inline-flex';
            } else if (hasConfiguredPoster) {
                posterSrc = window.MTRSPosters.getCustomPoster(movieId);
                posterBadgeHtml = `<span class="art-badge art-badge-config">⚙️ Override Configured</span>`;
                if (this.dom.btnResetPoster) this.dom.btnResetPoster.style.display = 'inline-flex';
            } else {
                posterSrc = window.MTRSPosters ? 
                    window.MTRSPosters.resolvePoster(movie, { size: 'w780' }) : '';
                posterBadgeHtml = `<span class="art-badge art-badge-default">Official Artwork / Default</span>`;
                if (this.dom.btnResetPoster) this.dom.btnResetPoster.style.display = 'none';
            }

            if (this.dom.posterStatus) {
                this.dom.posterStatus.innerHTML = posterBadgeHtml;
            }

            if (this.dom.posterContainer) {
                this.renderImageIntoContainer(this.dom.posterContainer, posterSrc, `${movie.Movie_Name} Poster`, 'portrait');
            }

            // ----------------------------------------------------------------
            // 2. BACKDROP PREVIEW & BADGE
            // ----------------------------------------------------------------
            const hasUploadedBackdrop = window.MTRSImageStore && window.MTRSImageStore.hasCustomBackdrop(movieId);
            const hasConfiguredBackdrop = window.MTRSPosters && !!window.MTRSPosters.getCustomBackdrop(movieId);
            const dbBackdrop = movie.Backdrop_Url || movie.backdrop_url || '';

            let backdropSrc = '';
            let backdropBadgeHtml = '';

            if (this.pendingBackdropPreviewUrl) {
                backdropSrc = this.pendingBackdropPreviewUrl;
                backdropBadgeHtml = `<span class="art-badge art-badge-staged">● Pending Upload (Staged)</span>`;
                if (this.dom.btnResetBackdrop) this.dom.btnResetBackdrop.style.display = 'inline-flex';
            } else if (dbBackdrop) {
                backdropSrc = window.MTRSPosters ? window.MTRSPosters.resolveBackdrop(movie, { size: 'w1280' }) : dbBackdrop;
                if (dbBackdrop.includes('movie-artwork') || dbBackdrop.includes('supabase.co/storage')) {
                    backdropBadgeHtml = `<span class="art-badge art-badge-uploaded" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4);">✓ Cloud Synced (Supabase Storage)</span>`;
                } else {
                    backdropBadgeHtml = `<span class="art-badge art-badge-uploaded">✓ Database Linked URL</span>`;
                }
                if (this.dom.btnResetBackdrop) this.dom.btnResetBackdrop.style.display = 'inline-flex';
            } else if (hasUploadedBackdrop) {
                backdropSrc = window.MTRSImageStore.getBackdropUrl(movieId);
                backdropBadgeHtml = `<span class="art-badge art-badge-config">💾 Local Cache (IndexedDB)</span>`;
                if (this.dom.btnResetBackdrop) this.dom.btnResetBackdrop.style.display = 'inline-flex';
            } else if (hasConfiguredBackdrop) {
                backdropSrc = window.MTRSPosters.getCustomBackdrop(movieId);
                backdropBadgeHtml = `<span class="art-badge art-badge-config">⚙️ Override Configured</span>`;
                if (this.dom.btnResetBackdrop) this.dom.btnResetBackdrop.style.display = 'inline-flex';
            } else {
                backdropSrc = window.MTRSPosters ? 
                    window.MTRSPosters.resolveBackdrop(movie, { size: 'w1280' }) : '';
                backdropBadgeHtml = `<span class="art-badge art-badge-default">Official Artwork / Default</span>`;
                if (this.dom.btnResetBackdrop) this.dom.btnResetBackdrop.style.display = 'none';
            }

            if (this.dom.backdropStatus) {
                this.dom.backdropStatus.innerHTML = backdropBadgeHtml;
            }

            if (this.dom.backdropContainer) {
                this.renderImageIntoContainer(this.dom.backdropContainer, backdropSrc, `${movie.Movie_Name} Backdrop`, 'landscape');
            }

            this.updateSaveButton();
        }

        renderImageIntoContainer(container, src, alt, type = 'portrait') {
            if (!container) return;

            if (!src) {
                container.innerHTML = `
                    <div class="art-preview-placeholder">
                        <span style="font-size: 1.5rem; margin-bottom: 0.35rem;">🖼️</span>
                        <span>No image assigned</span>
                    </div>
                `;
                return;
            }

            // If raw SVG string (starts with <svg)
            if (typeof src === 'string' && src.trim().startsWith('<svg')) {
                container.innerHTML = `<div class="art-svg-wrapper">${src}</div>`;
                return;
            }

            container.innerHTML = `
                <img 
                    src="${src}" 
                    alt="${alt}" 
                    class="art-preview-img ${type === 'landscape' ? 'art-img-landscape' : 'art-img-portrait'}" 
                    loading="eager"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <div class="art-preview-placeholder" style="display: none;">
                    <span style="font-size: 1.5rem; margin-bottom: 0.35rem;">⚠️</span>
                    <span>Image failed to load</span>
                </div>
            `;
        }

        /**
         * Handles selecting a new poster file from disk
         */
        handlePosterSelected(file) {
            try {
                if (window.MTRSImageStore) {
                    window.MTRSImageStore.validateImageFile(file, false);
                }

                // Check aspect ratio dimensions
                const img = new Image();
                const tempUrl = URL.createObjectURL(file);

                img.onload = () => {
                    if (this.pendingPosterPreviewUrl) {
                        URL.revokeObjectURL(this.pendingPosterPreviewUrl);
                    }
                    this.pendingPosterFile = file;
                    this.pendingPosterPreviewUrl = tempUrl;

                    if (img.naturalWidth > img.naturalHeight) {
                        this.showStatus('⚠️ Notice: Selected image is landscape. A portrait image (approx. 2:3 aspect ratio) is recommended for theatrical poster cards.', 'warning');
                    } else {
                        this.showStatus('Poster preview loaded. Click "Save & Apply Changes" below to store it in IndexedDB.', 'info');
                    }
                    this.refreshView();
                };

                img.onerror = () => {
                    URL.revokeObjectURL(tempUrl);
                    this.showStatus('Failed to load selected image file. Please choose a valid image.', 'error');
                };

                img.src = tempUrl;
            } catch (err) {
                this.showStatus(err.message, 'error');
                if (this.dom.posterFileInput) this.dom.posterFileInput.value = '';
            }
        }

        /**
         * Handles selecting a new backdrop file from disk
         */
        handleBackdropSelected(file) {
            try {
                if (window.MTRSImageStore) {
                    window.MTRSImageStore.validateImageFile(file, true);
                }

                // Check aspect ratio dimensions
                const img = new Image();
                const tempUrl = URL.createObjectURL(file);

                img.onload = () => {
                    if (this.pendingBackdropPreviewUrl) {
                        URL.revokeObjectURL(this.pendingBackdropPreviewUrl);
                    }
                    this.pendingBackdropFile = file;
                    this.pendingBackdropPreviewUrl = tempUrl;

                    if (img.naturalHeight > img.naturalWidth) {
                        this.showStatus('⚠️ Notice: Selected image is portrait. A widescreen landscape image (approx. 16:9 aspect ratio) is recommended for the hero backdrop.', 'warning');
                    } else {
                        this.showStatus('Backdrop preview loaded. Click "Save & Apply Changes" below to store it in IndexedDB.', 'info');
                    }
                    this.refreshView();
                };

                img.onerror = () => {
                    URL.revokeObjectURL(tempUrl);
                    this.showStatus('Failed to load selected image file. Please choose a valid image.', 'error');
                };

                img.src = tempUrl;
            } catch (err) {
                this.showStatus(err.message, 'error');
                if (this.dom.backdropFileInput) this.dom.backdropFileInput.value = '';
            }
        }

        updateSaveButton() {
            if (!this.dom.btnSave) return;
            const hasPending = !!(this.pendingPosterFile || this.pendingBackdropFile);
            this.dom.btnSave.disabled = !hasPending || this.isSaving;
            this.dom.btnSave.textContent = this.isSaving ? '⏳ Saving Artwork...' : 
                (hasPending ? '💾 Save & Apply Changes' : '✓ Changes Saved');
        }

        /**
         * Commits pending staged poster and/or backdrop to IndexedDB
         */
        async saveChanges() {
            if (!this.selectedMovieId) return;
            if (!this.pendingPosterFile && !this.pendingBackdropFile) {
                this.showStatus('No pending changes to save.', 'info');
                return;
            }

            // 1. Verify admin authorization
            if (!window.MTRSSupabase || !window.MTRSSupabase.isConfigured) {
                this.showStatus('Supabase client not initialized. Cannot upload shared artwork.', 'error');
                return;
            }

            this.isSaving = true;
            this.updateSaveButton();

            const adminCheck = await window.MTRSSupabase.checkIsAdmin();
            if (!adminCheck.success || !adminCheck.isAdmin) {
                this.isSaving = false;
                this.updateSaveButton();
                const errMsg = 'Admin authorization required: Only authenticated administrators registered in public.admin_users can save shared artwork to Supabase Storage.';
                this.showStatus(errMsg, 'error');
                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast('Admin authorization required to upload shared artwork.', 'error');
                }
                return;
            }

            const movie = this.findMovie(this.selectedMovieId);
            const savedItems = [];
            const newlyUploadedFiles = [];
            const updatePayload = {};

            try {
                // 2. Upload Poster to Supabase Storage if staged
                if (this.pendingPosterFile) {
                    this.showStatus('Uploading theatrical poster to Supabase Storage...', 'info');
                    const uploadRes = await window.MTRSSupabase.uploadArtworkFile({
                        file: this.pendingPosterFile,
                        folder: 'posters',
                        movieId: this.selectedMovieId
                    });

                    if (!uploadRes.success) {
                        throw new Error(`Poster upload failed: ${uploadRes.error}`);
                    }

                    updatePayload.poster_url = uploadRes.publicUrl;
                    updatePayload.poster_hires_url = uploadRes.publicUrl;
                    newlyUploadedFiles.push(uploadRes.path);
                    savedItems.push('Theatrical Poster');

                    // Cache locally in IndexedDB as immediate cache
                    try {
                        await window.MTRSImageStore.savePoster(this.selectedMovieId, this.pendingPosterFile);
                    } catch (e) {}
                }

                // 3. Upload Backdrop to Supabase Storage if staged
                if (this.pendingBackdropFile) {
                    this.showStatus('Uploading cinematic hero backdrop to Supabase Storage...', 'info');
                    const uploadRes = await window.MTRSSupabase.uploadArtworkFile({
                        file: this.pendingBackdropFile,
                        folder: 'backdrops',
                        movieId: this.selectedMovieId
                    });

                    if (!uploadRes.success) {
                        // Clean up already uploaded poster to prevent orphans
                        const cleanupFailures = [];
                        for (const f of newlyUploadedFiles) {
                            const delRes = await window.MTRSSupabase.deleteArtworkFile(f);
                            if (!delRes || !delRes.success) cleanupFailures.push(f);
                        }
                        newlyUploadedFiles.length = 0;
                        let errMsg = `Hero backdrop upload failed: ${uploadRes.error}`;
                        if (cleanupFailures.length > 0) {
                            errMsg += ` (Warning: Storage cleanup failed for orphaned files: ${cleanupFailures.join(', ')}. Please delete manually in Supabase Storage.)`;
                        }
                        throw new Error(errMsg);
                    }

                    updatePayload.backdrop_url = uploadRes.publicUrl;
                    newlyUploadedFiles.push(uploadRes.path);
                    savedItems.push('Cinematic Hero Backdrop');

                    // Cache locally in IndexedDB as immediate cache
                    try {
                        await window.MTRSImageStore.saveBackdrop(this.selectedMovieId, this.pendingBackdropFile);
                    } catch (e) {}
                }

                // 4. Update Central Database Record in Supabase
                this.showStatus('Updating movie artwork URLs in Supabase database...', 'info');
                const updateRes = await window.MTRSSupabase.updateMovie(this.selectedMovieId, updatePayload);

                if (!updateRes || !updateRes.success) {
                    // Compensating cleanup of uploaded files to prevent orphaned storage objects
                    const cleanupFailures = [];
                    let cleanupSuccessCount = 0;
                    for (const f of newlyUploadedFiles) {
                        const delRes = await window.MTRSSupabase.deleteArtworkFile(f);
                        if (!delRes || !delRes.success) {
                            cleanupFailures.push(f);
                        } else {
                            cleanupSuccessCount++;
                        }
                    }
                    newlyUploadedFiles.length = 0;
                    let errMsg = `Database record update failed: ${updateRes?.error || 'Unknown error'}`;
                    if (cleanupFailures.length > 0) {
                        errMsg += ` (Warning: Storage cleanup could not confirm deletion of orphaned files: ${cleanupFailures.join(', ')}. Please delete manually in Supabase Storage.)`;
                    } else if (cleanupSuccessCount > 0) {
                        errMsg += ` (Compensating rollback confirmed deletion of uploaded storage file(s).)`;
                    }
                    throw new Error(errMsg);
                }

                // 5. Reload Central Movie Catalogue
                if (window.App && typeof window.App.loadCinemaData === 'function') {
                    await window.App.loadCinemaData();
                }

                // 6. Clean up Staging & Reset View
                if (this.pendingPosterPreviewUrl) {
                    URL.revokeObjectURL(this.pendingPosterPreviewUrl);
                    this.pendingPosterPreviewUrl = null;
                }
                this.pendingPosterFile = null;

                if (this.pendingBackdropPreviewUrl) {
                    URL.revokeObjectURL(this.pendingBackdropPreviewUrl);
                    this.pendingBackdropPreviewUrl = null;
                }
                this.pendingBackdropFile = null;

                if (this.dom.posterFileInput) this.dom.posterFileInput.value = '';
                if (this.dom.backdropFileInput) this.dom.backdropFileInput.value = '';

                this.refreshView();

                // 7. Success Feedback
                const msg = `✓ Successfully uploaded ${savedItems.join(' and ')} for "${movie.Movie_Name}" to Supabase Storage and updated central database!`;
                this.showStatus(msg, 'success');

                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast(`Artwork live on cloud for ${movie.Movie_Name}`, 'success');
                }

            } catch (err) {
                console.error('[MTRS ArtworkManager] Error saving artwork:', err);
                let extraWarning = '';
                if (newlyUploadedFiles && newlyUploadedFiles.length > 0) {
                    const cleanupFailures = [];
                    for (const f of newlyUploadedFiles) {
                        try {
                            const delRes = await window.MTRSSupabase.deleteArtworkFile(f);
                            if (!delRes || !delRes.success) cleanupFailures.push(f);
                        } catch (e) {
                            cleanupFailures.push(f);
                        }
                    }
                    if (cleanupFailures.length > 0) {
                        extraWarning = ` (Warning: Storage cleanup failed for orphaned files: ${cleanupFailures.join(', ')}. Please delete manually in Supabase Storage.)`;
                    }
                }
                this.showStatus(`Failed to save artwork: ${err.message}${extraWarning}`, 'error');
            } finally {
                this.isSaving = false;
                this.updateSaveButton();
            }
        }

        async resetPoster() {
            if (!this.selectedMovieId) return;
            const movie = this.findMovie(this.selectedMovieId);

            const confirmed = confirm(`Reset custom poster for "${movie.Movie_Name}"?\nThis will restore the original theatrical card artwork and update the database.`);
            if (!confirmed) return;

            // Check admin authorization
            if (!window.MTRSSupabase || !window.MTRSSupabase.isConfigured) {
                this.showStatus('Supabase client not initialized.', 'error');
                return;
            }

            const adminCheck = await window.MTRSSupabase.checkIsAdmin();
            if (!adminCheck.success || !adminCheck.isAdmin) {
                this.showStatus('Admin authorization required to reset artwork in database.', 'error');
                return;
            }

            try {
                // Cancel pending staged poster
                if (this.pendingPosterPreviewUrl) {
                    URL.revokeObjectURL(this.pendingPosterPreviewUrl);
                    this.pendingPosterPreviewUrl = null;
                }
                this.pendingPosterFile = null;
                if (this.dom.posterFileInput) this.dom.posterFileInput.value = '';

                // Remove from IndexedDB
                if (window.MTRSImageStore) {
                    await window.MTRSImageStore.removePoster(this.selectedMovieId);
                }

                // Clear manual localStorage override
                if (window.MTRSPosters && typeof window.MTRSPosters.setCustomPoster === 'function') {
                    window.MTRSPosters.setCustomPoster(this.selectedMovieId, '');
                }

                // Determine official registry poster if any (e.g. M01-M06)
                const rec = window.MTRSPosters ? window.MTRSPosters.findRecord(this.selectedMovieId) : null;
                const defaultPoster = rec ? (rec.posterUrl || rec.posterHiRes || '') : '';
                const defaultPosterHiRes = rec ? (rec.posterHiRes || rec.posterUrl || '') : '';

                // Update database
                await window.MTRSSupabase.updateMovie(this.selectedMovieId, {
                    poster_url: defaultPoster,
                    poster_hires_url: defaultPosterHiRes
                });

                if (window.App && typeof window.App.loadCinemaData === 'function') {
                    await window.App.loadCinemaData();
                }

                this.refreshView();
                this.showStatus(`✓ Custom poster reset for "${movie.Movie_Name}". Restored default theatrical artwork.`, 'success');

                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast(`Poster reset for ${movie.Movie_Name}`, 'info');
                }
            } catch (err) {
                console.error('[MTRS ArtworkManager] Error resetting poster:', err);
                this.showStatus(`Failed to reset poster: ${err.message}`, 'error');
            }
        }

        async resetBackdrop() {
            if (!this.selectedMovieId) return;
            const movie = this.findMovie(this.selectedMovieId);

            const confirmed = confirm(`Reset custom backdrop for "${movie.Movie_Name}"?\nThis will restore the original cinematic hero background and update the database.`);
            if (!confirmed) return;

            // Check admin authorization
            if (!window.MTRSSupabase || !window.MTRSSupabase.isConfigured) {
                this.showStatus('Supabase client not initialized.', 'error');
                return;
            }

            const adminCheck = await window.MTRSSupabase.checkIsAdmin();
            if (!adminCheck.success || !adminCheck.isAdmin) {
                this.showStatus('Admin authorization required to reset artwork in database.', 'error');
                return;
            }

            try {
                // Cancel pending staged backdrop
                if (this.pendingBackdropPreviewUrl) {
                    URL.revokeObjectURL(this.pendingBackdropPreviewUrl);
                    this.pendingBackdropPreviewUrl = null;
                }
                this.pendingBackdropFile = null;
                if (this.dom.backdropFileInput) this.dom.backdropFileInput.value = '';

                // Remove from IndexedDB
                if (window.MTRSImageStore) {
                    await window.MTRSImageStore.removeBackdrop(this.selectedMovieId);
                }

                // Clear manual localStorage override
                if (window.MTRSPosters && typeof window.MTRSPosters.setCustomBackdrop === 'function') {
                    window.MTRSPosters.setCustomBackdrop(this.selectedMovieId, '');
                }

                // Determine official registry backdrop if any (e.g. M01-M06)
                const rec = window.MTRSPosters ? window.MTRSPosters.findRecord(this.selectedMovieId) : null;
                const defaultBackdrop = rec ? (rec.backdropUrl || '') : '';

                // Update database
                await window.MTRSSupabase.updateMovie(this.selectedMovieId, {
                    backdrop_url: defaultBackdrop
                });

                if (window.App && typeof window.App.loadCinemaData === 'function') {
                    await window.App.loadCinemaData();
                }

                this.refreshView();
                this.showStatus(`✓ Custom backdrop reset for "${movie.Movie_Name}". Restored default cinematic hero background.`, 'success');

                if (window.App && typeof window.App.showToast === 'function') {
                    window.App.showToast(`Hero backdrop reset for ${movie.Movie_Name}`, 'info');
                }
            } catch (err) {
                console.error('[MTRS ArtworkManager] Error resetting backdrop:', err);
                this.showStatus(`Failed to reset backdrop: ${err.message}`, 'error');
            }
        }

        showStatus(message, type = 'info') {
            if (!this.dom.statusBanner) return;
            this.dom.statusBanner.textContent = message;
            this.dom.statusBanner.className = `art-status-banner art-status-${type}`;
            this.dom.statusBanner.style.display = 'block';
        }

        clearStatus() {
            if (!this.dom.statusBanner) return;
            this.dom.statusBanner.textContent = '';
            this.dom.statusBanner.style.display = 'none';
        }
    }

    // Instantiate and expose globally
    window.MTRSArtworkManager = new MTRSArtworkManager();

})();
