// ============================================================================
// MOVIE TICKET RESERVATION SYSTEM (MTRS)
// File: js/admin.js
// Description: Admin Panel controller, Show Schedule management, Screen capacity,
//              Relational Table Inspector, and Academic SQL Query Sandbox (DA2).
// ============================================================================

class MTRSAdminPanel {
    constructor() {
        this.engine = window.MTRSEngine;
        this.activeAdminTab = 'shows';
        this.selectedQueryId = 1;

        this.init();
    }

    init() {
        this.setupAdminTabs();
        this.refreshDashboard();
    }

    setupAdminTabs() {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchAdminTab(tab);
            });
        });
    }

    switchAdminTab(tabName) {
        this.activeAdminTab = tabName;
        document.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
        });

        document.querySelectorAll('.admin-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === `admin-tab-${tabName}`);
        });

        if (tabName === 'shows') this.renderShowsTable();
        if (tabName === 'screens') this.renderScreensTable();
        if (tabName === 'revenue') this.renderRevenueReport();
        if (tabName === 'relations') this.renderRelationalInspector();
    }

    // ------------------------------------------------------------------------
    // DASHBOARD KPI METRICS
    // ------------------------------------------------------------------------
    refreshDashboard() {
        const bookings = this.engine.getTable('BOOKING');
        const payments = this.engine.getTable('PAYMENT');
        const movies = this.engine.getTable('MOVIE');
        const shows = this.engine.getTable('SHOWS');
        const screens = this.engine.getTable('SCREEN');
        const bookedSeats = this.engine.getTable('BOOKED_SEAT');

        const totalRev = payments.reduce((sum, p) => sum + parseFloat(p.Amount), 0);
        const totalSeatsCapacity = screens.reduce((sum, s) => sum + s.Capacity, 0);
        const avgOccupancy = totalSeatsCapacity > 0 ? 
            ((bookedSeats.length / (totalSeatsCapacity * (shows.length || 1))) * 100).toFixed(1) : '0';

        const revEl = document.getElementById('kpi-total-revenue');
        const bkEl = document.getElementById('kpi-total-bookings');
        const mvEl = document.getElementById('kpi-active-movies');
        const shEl = document.getElementById('kpi-total-shows');

        if (revEl) revEl.textContent = `₹${totalRev.toFixed(2)}`;
        if (bkEl) bkEl.textContent = bookings.length;
        if (mvEl) mvEl.textContent = movies.length;
        if (shEl) shEl.textContent = shows.length;

        // Refresh currently active tab
        if (this.activeAdminTab === 'shows') this.renderShowsTable();
        if (this.activeAdminTab === 'screens') this.renderScreensTable();
        if (this.activeAdminTab === 'revenue') this.renderRevenueReport();
        if (this.activeAdminTab === 'relations') this.renderRelationalInspector();
    }

    // ------------------------------------------------------------------------
    // TAB 1: SHOW SCHEDULE MANAGER
    // ------------------------------------------------------------------------
    renderShowsTable() {
        const container = document.getElementById('admin-shows-table-container');
        if (!container) return;

        const shows = this.engine.getTable('SHOWS');
        const movies = this.engine.getTable('MOVIE');
        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h4 style="color: var(--text-pure); font-size: 1.1rem;">Scheduled Movie Shows (${shows.length})</h4>
                <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="window.MTRSAdmin.openAddShowModal()">
                    + Add New Show
                </button>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Show ID</th>
                        <th>Movie</th>
                        <th>Theater & Screen</th>
                        <th>Date & Time</th>
                        <th>Format</th>
                        <th>Ticket Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${shows.map(show => {
                        const movie = movies.find(m => m.Movie_ID === show.Movie_ID) || {};
                        const screen = screens.find(s => s.Screen_ID === show.Screen_ID) || {};
                        const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};

                        return `
                            <tr>
                                <td><strong style="color: var(--accent-cyan);">${show.Show_ID}</strong></td>
                                <td style="color: var(--text-pure); font-weight: 600;">${movie.Movie_Name || show.Movie_ID}</td>
                                <td>${theater.Theater_Name || ''} (Screen ${screen.Screen_Number || ''})</td>
                                <td>${show.Show_Date} at ${show.Show_Time.substring(0, 5)}</td>
                                <td><span class="card-format-tag">${show.Format}</span></td>
                                <td style="color: var(--accent-gold); font-weight: 700;">₹${show.Ticket_Price}</td>
                                <td>
                                    <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.editShowPrice('${show.Show_ID}')">
                                        Edit Price
                                    </button>
                                    <button class="btn-book-card" style="background: rgba(229, 9, 20, 0.2); border: 1px solid var(--primary); padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.deleteShow('${show.Show_ID}')">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    openAddShowModal() {
        const movies = this.engine.getTable('MOVIE');
        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');

        const modal = document.getElementById('add-show-modal');
        if (!modal) return;

        const movieSelect = document.getElementById('modal-new-show-movie');
        const screenSelect = document.getElementById('modal-new-show-screen');

        if (movieSelect) {
            movieSelect.innerHTML = movies.map(m => `<option value="${m.Movie_ID}">${m.Movie_Name} (${m.Language})</option>`).join('');
        }

        if (screenSelect) {
            screenSelect.innerHTML = screens.map(s => {
                const th = theaters.find(t => t.Theater_ID === s.Theater_ID) || {};
                return `<option value="${s.Screen_ID}">${th.Theater_Name} - Screen ${s.Screen_Number} (${s.Screen_Type})</option>`;
            }).join('');
        }

        modal.classList.add('active');
    }

    saveNewShow() {
        const movieId = document.getElementById('modal-new-show-movie').value;
        const screenId = document.getElementById('modal-new-show-screen').value;
        const date = document.getElementById('modal-new-show-date').value;
        const time = document.getElementById('modal-new-show-time').value;
        const format = document.getElementById('modal-new-show-format').value;
        const price = parseFloat(document.getElementById('modal-new-show-price').value);

        if (!date || !time || isNaN(price) || price <= 0) {
            window.App.showToast("Please enter valid show date, time, and price.", "error");
            return;
        }

        const shows = this.engine.getTable('SHOWS');
        const nextId = `SH${shows.length < 9 ? '0' + (shows.length + 1) : (shows.length + 1)}`;

        shows.push({
            Show_ID: nextId,
            Movie_ID: movieId,
            Screen_ID: screenId,
            Show_Date: date,
            Show_Time: `${time}:00`,
            Format: format,
            Ticket_Price: price
        });

        this.engine.save();
        document.getElementById('add-show-modal').classList.remove('active');
        window.App.showToast(`Show ${nextId} added to schedule successfully.`, "success");
        this.refreshDashboard();
    }

    editShowPrice(showId) {
        const show = this.engine.getTable('SHOWS').find(s => s.Show_ID === showId);
        if (!show) return;

        const newPrice = prompt(`Enter new ticket price for Show ${showId}:`, show.Ticket_Price);
        if (newPrice !== null) {
            const parsed = parseFloat(newPrice);
            if (isNaN(parsed) || parsed <= 0) {
                window.App.showToast("Ticket price must be a positive number (CHECK chk_show_price).", "error");
                return;
            }
            show.Ticket_Price = parsed;
            this.engine.save();
            window.App.showToast(`Ticket price for ${showId} updated to ₹${parsed}.`, "success");
            this.renderShowsTable();
        }
    }

    deleteShow(showId) {
        if (!confirm(`Delete Show ${showId}? This will cascade delete associated bookings and free occupied seats.`)) {
            return;
        }

        this.engine.db.SHOWS = this.engine.db.SHOWS.filter(s => s.Show_ID !== showId);
        this.engine.save();
        window.App.showToast(`Show ${showId} deleted from schedule.`, "success");
        this.refreshDashboard();
    }

    // ------------------------------------------------------------------------
    // TAB 2: SCREEN CAPACITY MANAGER
    // ------------------------------------------------------------------------
    renderScreensTable() {
        const container = document.getElementById('admin-screens-table-container');
        if (!container) return;

        const screens = this.engine.getTable('SCREEN');
        const theaters = this.engine.getTable('THEATER');
        const seats = this.engine.getTable('SEAT');

        container.innerHTML = `
            <div style="margin-bottom: 1.25rem;">
                <h4 style="color: var(--text-pure); font-size: 1.1rem;">Screens and Seating Capacities</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem;">CHECK constraint enforces: Capacity &gt; 0.</p>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Screen ID</th>
                        <th>Theater Name</th>
                        <th>Screen #</th>
                        <th>Screen Type</th>
                        <th>Total Capacity</th>
                        <th>Configured Seats</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${screens.map(screen => {
                        const theater = theaters.find(t => t.Theater_ID === screen.Theater_ID) || {};
                        const screenSeats = seats.filter(s => s.Screen_ID === screen.Screen_ID);

                        return `
                            <tr>
                                <td><strong style="color: var(--accent-cyan);">${screen.Screen_ID}</strong></td>
                                <td style="color: var(--text-pure);">${theater.Theater_Name || screen.Theater_ID}</td>
                                <td>Screen ${screen.Screen_Number}</td>
                                <td><span class="card-format-tag">${screen.Screen_Type}</span></td>
                                <td style="font-weight: 700; color: var(--text-pure);">${screen.Capacity} Seats</td>
                                <td style="color: var(--accent-gold); font-weight: 600;">${screenSeats.length} Seats Generated</td>
                                <td>
                                    <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.MTRSAdmin.editScreenCapacity('${screen.Screen_ID}')">
                                        Update Capacity
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    editScreenCapacity(screenId) {
        const screen = this.engine.getTable('SCREEN').find(s => s.Screen_ID === screenId);
        if (!screen) return;

        const newCap = prompt(`Update Capacity for Screen ${screenId} (Currently ${screen.Capacity}):`, screen.Capacity);
        if (newCap !== null) {
            const parsed = parseInt(newCap, 10);
            if (isNaN(parsed) || parsed <= 0) {
                window.App.showToast("CHECK Constraint Error: Capacity must be strictly greater than 0.", "error");
                return;
            }
            screen.Capacity = parsed;
            this.engine.save();
            window.App.showToast(`Capacity for Screen ${screenId} updated to ${parsed}.`, "success");
            this.renderScreensTable();
            this.refreshDashboard();
        }
    }

    // ------------------------------------------------------------------------
    // TAB 3: REVENUE & OCCUPANCY REPORTS (Stored Procedure sp_GetShowRevenueReport)
    // ------------------------------------------------------------------------
    renderRevenueReport() {
        const container = document.getElementById('admin-revenue-table-container');
        if (!container) return;

        // Invoke Stored Procedure: sp_GetShowRevenueReport
        const reports = this.engine.sp_GetShowRevenueReport();

        container.innerHTML = `
            <div style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h4 style="color: var(--text-pure); font-size: 1.1rem;">Financial &amp; Occupancy Performance Report</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Generated live via Stored Procedure: <code>sp_GetShowRevenueReport()</code></p>
                </div>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Show ID</th>
                        <th>Movie Title</th>
                        <th>Theater</th>
                        <th>Screen</th>
                        <th>Format</th>
                        <th>Booked / Cap</th>
                        <th>Occupancy</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(r => `
                        <tr>
                            <td><strong style="color: var(--accent-cyan);">${r.Show_ID}</strong></td>
                            <td style="color: var(--text-pure); font-weight: 600;">${r.Movie_Name}</td>
                            <td>${r.Theater_Name}</td>
                            <td>Screen ${r.Screen_Number}</td>
                            <td><span class="card-format-tag">${r.Format}</span></td>
                            <td>${r.Seats_Booked} / ${r.Total_Capacity}</td>
                            <td style="color: ${parseFloat(r.Occupancy_Rate) > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'}; font-weight: 700;">
                                ${r.Occupancy_Rate}
                            </td>
                            <td style="color: var(--accent-gold); font-weight: 800; font-size: 0.95rem;">
                                ${r.Total_Revenue}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ------------------------------------------------------------------------
    // TAB 4: RELATIONAL DATABASE INSPECTOR (9 Relations Browser)
    // ------------------------------------------------------------------------
    renderRelationalInspector() {
        const container = document.getElementById('admin-relations-container');
        if (!container) return;

        const tableNames = ['THEATER', 'SCREEN', 'MOVIE', 'SHOWS', 'SEAT', 'CUSTOMER', 'BOOKING', 'BOOKED_SEAT', 'PAYMENT'];

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: var(--text-pure); font-size: 1.2rem;">Relational Database Schema Inspector (9 BCNF Tables)</h4>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Inspect live rows, foreign key mappings, and table states.</p>
            </div>

            <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
                ${tableNames.map((tbl, i) => `
                    <button class="filter-chip ${i === 0 ? 'active' : ''}" onclick="window.MTRSAdmin.inspectTable('${tbl}', this)">
                        ${tbl} (${this.engine.getTable(tbl).length})
                    </button>
                `).join('')}
            </div>

            <div id="relation-data-view" class="data-table-container"></div>
        `;

        this.inspectTable('THEATER');
    }

    inspectTable(tableName, chipEl) {
        if (chipEl) {
            chipEl.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chipEl.classList.add('active');
        }

        const view = document.getElementById('relation-data-view');
        if (!view) return;

        const rows = this.engine.getTable(tableName);
        if (rows.length === 0) {
            view.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No records currently exist in ${tableName}.</div>`;
            return;
        }

        const headers = Object.keys(rows[0]);

        view.innerHTML = `
            <div style="padding: 0.75rem 1.25rem; background: var(--bg-surface-elevated); border-bottom: var(--glass-border); font-size: 0.82rem; color: var(--accent-cyan); font-weight: 700;">
                RELATION: ${tableName} • Total Records: ${rows.length}
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${headers.map(h => {
                                let val = row[h];
                                if (typeof val === 'number') val = val.toString();
                                return `<td>${val || '-'}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ------------------------------------------------------------------------
    // ACADEMIC SQL QUERY SANDBOX (18 DA2 Queries)
    // ------------------------------------------------------------------------
    initQuerySandbox() {
        const select = document.getElementById('academic-query-dropdown');
        if (!select || !window.ACADEMIC_QUERIES) return;

        select.innerHTML = window.ACADEMIC_QUERIES.map(q => `
            <option value="${q.id}">Query ${q.id}: ${q.title.replace(/^Q\d+:\s*/, '')}</option>
        `).join('');

        select.onchange = (e) => {
            this.selectedQueryId = parseInt(e.target.value, 10);
            this.displayQueryDetails();
        };

        this.displayQueryDetails();
    }

    displayQueryDetails() {
        const query = window.ACADEMIC_QUERIES.find(q => q.id === this.selectedQueryId);
        if (!query) return;

        const titleEl = document.getElementById('sandbox-query-title');
        const conceptEl = document.getElementById('sandbox-query-concept');
        const descEl = document.getElementById('sandbox-query-desc');
        const codeEl = document.getElementById('sandbox-sql-code');

        if (titleEl) titleEl.textContent = query.title;
        if (conceptEl) conceptEl.textContent = `Concept: ${query.concept}`;
        if (descEl) descEl.textContent = query.description;
        if (codeEl) codeEl.textContent = query.sql;

        // Auto execute on select for seamless demo
        this.runSelectedQuery();
    }

    runSelectedQuery() {
        const query = window.ACADEMIC_QUERIES.find(q => q.id === this.selectedQueryId);
        if (!query) return;

        const resultsContainer = document.getElementById('sandbox-query-results');
        if (!resultsContainer) return;

        try {
            const out = this.engine.runAcademicQuery(this.selectedQueryId);

            resultsContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="font-size: 0.85rem; color: var(--accent-emerald); font-weight: 700;">
                        ✓ Executed in ${out.executionTimeMs} ms • Returned ${out.rowCount} Row(s)
                    </div>
                    <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="navigator.clipboard.writeText(document.getElementById('sandbox-sql-code').textContent); window.App.showToast('SQL query copied to clipboard!', 'info');">
                        Copy SQL
                    </button>
                </div>

                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${out.columns.map(c => `<th>${c}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${out.rows.length > 0 ? out.rows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : 'NULL'}</td>`).join('')}
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="${out.columns.length}" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                        Empty set (0 matching records found).
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            resultsContainer.innerHTML = `
                <div style="background: rgba(229, 9, 20, 0.1); border: 1px solid var(--primary); padding: 1.5rem; border-radius: var(--radius-md); color: #fff;">
                    <strong>Execution Error:</strong> ${error.message}
                </div>
            `;
        }
    }
}

// Instantiate globally
window.MTRSAdmin = new MTRSAdminPanel();
