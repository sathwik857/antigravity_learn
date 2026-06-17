document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let releaseNotes = [];
    let selectedNote = null;
    let currentFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshSpinner = refreshBtn.querySelector('.spinner-icon');
    const refreshText = refreshBtn.querySelector('.btn-text');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const searchInput = document.getElementById('search-input');
    const filterPills = document.querySelectorAll('.pill');
    const notesList = document.getElementById('notes-list');
    
    const noSelectionState = document.getElementById('no-selection-state');
    const detailContentState = document.getElementById('detail-content-state');
    const detailDate = document.getElementById('detail-date');
    const detailBadge = document.getElementById('detail-badge');
    const detailCopyBtn = document.getElementById('detail-copy-btn');
    const detailTitle = document.getElementById('detail-title');
    const detailBody = document.getElementById('detail-body');
    const detailLink = document.getElementById('detail-link');
    
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const charRing = document.getElementById('char-ring');
    const tweetBtn = document.getElementById('tweet-btn');
    const resetTweetBtn = document.getElementById('reset-tweet-btn');
    const charCounterContainer = document.querySelector('.character-counter');

    // Categorization Helper
    function categorizeNote(note) {
        const text = (note.title + ' ' + note.content).toLowerCase();
        
        if (text.includes('deprecated') || text.includes('deprecation') || text.includes('no longer support') || text.includes('will be removed') || text.includes('removes support')) {
            return 'deprecated';
        }
        if (text.includes('fixed') || text.includes('resolves') || text.includes('bug fix') || text.includes('issue where') || text.includes('remedied')) {
            return 'fixed';
        }
        if (text.includes('changed') || text.includes('updated') || text.includes('modified') || text.includes('behavior') || text.includes('default value')) {
            return 'changed';
        }
        if (text.includes('new') || text.includes('introducing') || text.includes('added') || text.includes('feature') || text.includes('support for') || text.includes('now available') || text.includes('preview')) {
            return 'new';
        }
        return 'other';
    }

    // Date Formatter
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Generate Auto-Draft for Twitter
    function generateAutoDraft(note) {
        const prefix = "[BigQuery Update] ";
        const hashtags = " #GCP #BigQuery";
        const link = note.link || '';
        
        // Structure: [BigQuery Update] Title - Link #GCP #BigQuery
        // Maximum allowed characters for title = 280 - prefix - spacing/hyphen - link - hashtags
        const decorationLength = prefix.length + hashtags.length + 4; // 4 characters for " - " and space before hashtag
        const linkLength = link.length;
        const availableLength = 280 - decorationLength - linkLength;
        
        let title = note.title.trim();
        if (title.length > availableLength) {
            title = title.substring(0, availableLength - 3) + "...";
        }
        
        return `${prefix}${title} - ${link}${hashtags}`;
    }

    // Show Error Toast
    function showErrorToast(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        // Fade out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 4000);
    }

    // Fetch Notes from Backend API
    async function fetchNotes() {
        // Show loading state
        refreshBtn.disabled = true;
        refreshSpinner.classList.remove('hidden');
        refreshText.innerText = "Loading...";
        
        notesList.innerHTML = `
            <div class="shimmer-container">
                <div class="shimmer-card"></div>
                <div class="shimmer-card"></div>
                <div class="shimmer-card"></div>
            </div>
        `;

        try {
            const response = await fetch('/api/notes');
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch notes");
            }
            
            releaseNotes = data.notes.map(note => {
                const category = categorizeNote(note);
                return {
                    ...note,
                    category: category
                };
            });
            
            renderNotes();
            
            // If we have notes, auto-select the first one by default if nothing is selected
            if (releaseNotes.length > 0 && !selectedNote) {
                selectNote(releaseNotes[0]);
            } else if (selectedNote) {
                // Refresh the selected note content if it still exists in the new list
                const updatedSelected = releaseNotes.find(n => n.id === selectedNote.id || n.title === selectedNote.title);
                if (updatedSelected) {
                    selectNote(updatedSelected);
                }
            }

        } catch (error) {
            console.error("Error loading release notes:", error);
            showErrorToast(error.message);
            notesList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--color-deprecated); margin-bottom: 1rem;"></i>
                    <p>Could not load release notes. Please try again.</p>
                </div>
            `;
        } finally {
            refreshBtn.disabled = false;
            refreshSpinner.classList.add('hidden');
            refreshText.innerText = "Refresh Feed";
        }
    }

    // Select specific note
    function selectNote(note) {
        selectedNote = note;
        
        // Highlight in list
        document.querySelectorAll('.note-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.id === note.id || (note.id === '' && card.dataset.title === note.title)) {
                card.classList.add('selected');
            }
        });

        // Hide Empty State, Show Content State
        noSelectionState.classList.add('hidden');
        detailContentState.classList.remove('hidden');

        // Populating details
        detailDate.textContent = formatDate(note.date);
        
        // Set Badge Styling
        detailBadge.className = `badge badge-${note.category}`;
        detailBadge.textContent = note.category;

        detailTitle.textContent = note.title;
        
        // Render content HTML. Since Google's release feed contains HTML, we inject it.
        detailBody.innerHTML = note.content;
        
        // Ensure links open in new tab
        detailBody.querySelectorAll('a').forEach(a => {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        });

        // Setup Link
        if (note.link) {
            detailLink.href = note.link;
            detailLink.classList.remove('hidden');
        } else {
            detailLink.classList.add('hidden');
        }

        // Initialize Tweet Draft
        const draft = generateAutoDraft(note);
        tweetTextarea.value = draft;
        updateTweetComposerMetrics();
        
        // Scroll detail view to top
        document.getElementById('detail-panel').scrollTop = 0;
    }

    // Render Note Cards on the left list panel
    function renderNotes() {
        let filteredNotes = releaseNotes;

        // Apply Tag Category Filter
        if (currentFilter !== 'all') {
            filteredNotes = filteredNotes.filter(note => note.category === currentFilter);
        }

        // Apply Search Text Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredNotes = filteredNotes.filter(note => 
                note.title.toLowerCase().includes(query) || 
                note.content.toLowerCase().includes(query)
            );
        }

        if (filteredNotes.length === 0) {
            notesList.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No release notes found matching your criteria.</p>
                </div>
            `;
            return;
        }

        notesList.innerHTML = '';
        filteredNotes.forEach(note => {
            const card = document.createElement('article');
            card.className = `note-card ${note.category}`;
            card.dataset.id = note.id;
            card.dataset.title = note.title;
            
            if (selectedNote && (selectedNote.id === note.id || (note.id === '' && selectedNote.title === note.title))) {
                card.classList.add('selected');
            }

            // Create a short preview of the text content by stripping HTML tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const textPreview = tempDiv.textContent || tempDiv.innerText || "";

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-date">${formatDate(note.date)}</span>
                    <div class="card-actions">
                        <button class="card-copy-btn" title="Copy preview to clipboard">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <span class="badge badge-${note.category}">${note.category}</span>
                    </div>
                </div>
                <h3>${note.title}</h3>
                <p>${textPreview}</p>
            `;

            // Wire up card click to select
            card.addEventListener('click', () => selectNote(note));

            // Wire up copy button inside card
            const copyBtn = card.querySelector('.card-copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card selection
                
                const copyText = `[BigQuery Release - ${formatDate(note.date)}]\nTitle: ${note.title}\n\n${textPreview}\n\nRead details: ${note.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes'}`;
                copyTextToClipboard(copyText, copyBtn);
            });

            notesList.appendChild(card);
        });
    }

    // Update Tweet count and ring visualization
    function updateTweetComposerMetrics() {
        const text = tweetTextarea.value;
        const length = text.length;
        
        charCount.textContent = length;
        
        // Conic gradient ring matching remaining chars
        const percentage = Math.min(100, (length / 280) * 100);
        
        // Colors warning / danger
        if (length > 280) {
            charCounterContainer.className = "character-counter danger";
            charRing.style.background = `conic-gradient(var(--color-deprecated) ${percentage}%, rgba(255,255,255,0.05) ${percentage}%)`;
            tweetBtn.disabled = true;
        } else if (length > 250) {
            charCounterContainer.className = "character-counter warning";
            charRing.style.background = `conic-gradient(#f59e0b ${percentage}%, rgba(255,255,255,0.05) ${percentage}%)`;
            tweetBtn.disabled = false;
        } else {
            charCounterContainer.className = "character-counter";
            charRing.style.background = `conic-gradient(var(--accent) ${percentage}%, rgba(255,255,255,0.05) ${percentage}%)`;
            tweetBtn.disabled = length === 0;
        }
    }

    // Helper to Copy Text to Clipboard
    async function copyTextToClipboard(text, buttonEl) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Visual success feedback
            const icon = buttonEl.querySelector('i');
            icon.className = 'fa-solid fa-check';
            buttonEl.classList.add('copied');
            
            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                buttonEl.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showErrorToast('Could not copy to clipboard.');
        }
    }

    // Helper to Export Filtered Notes to CSV
    function exportToCSV() {
        let filteredNotes = releaseNotes;

        // Apply Tag Category Filter
        if (currentFilter !== 'all') {
            filteredNotes = filteredNotes.filter(note => note.category === currentFilter);
        }

        // Apply Search Text Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredNotes = filteredNotes.filter(note => 
                note.title.toLowerCase().includes(query) || 
                note.content.toLowerCase().includes(query)
            );
        }

        if (filteredNotes.length === 0) {
            showErrorToast("No notes available to export.");
            return;
        }

        // CSV headers
        const headers = ["Date", "Category", "Title", "Link", "Content"];
        const csvRows = [headers.join(",")];
        
        for (const note of filteredNotes) {
            // Strip HTML content and clean double quotes
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const plainContent = (tempDiv.textContent || tempDiv.innerText || "")
                .trim()
                .replace(/"/g, '""')
                .replace(/\n/g, ' '); // remove line breaks within cell
            
            const cleanTitle = note.title.trim().replace(/"/g, '""');
            const cleanLink = (note.link || '').trim().replace(/"/g, '""');
            
            const row = [
                `"${formatDate(note.date)}"`,
                `"${note.category}"`,
                `"${cleanTitle}"`,
                `"${cleanLink}"`,
                `"${plainContent}"`
            ];
            csvRows.push(row.join(","));
        }

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bigquery_release_notes_${currentFilter}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchNotes);
    
    exportCsvBtn.addEventListener('click', exportToCSV);

    detailCopyBtn.addEventListener('click', () => {
        if (!selectedNote) return;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = selectedNote.content;
        const plainContent = tempDiv.textContent || tempDiv.innerText || "";
        
        const copyText = `[BigQuery Release - ${formatDate(selectedNote.date)}]\nTitle: ${selectedNote.title}\nCategory: ${selectedNote.category}\n\n${plainContent}\n\nFull details: ${selectedNote.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes'}`;
        copyTextToClipboard(copyText, detailCopyBtn);
    });
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderNotes();
    });

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            renderNotes();
        });
    });

    tweetTextarea.addEventListener('input', updateTweetComposerMetrics);

    resetTweetBtn.addEventListener('click', () => {
        if (selectedNote) {
            tweetTextarea.value = generateAutoDraft(selectedNote);
            updateTweetComposerMetrics();
        }
    });

    tweetBtn.addEventListener('click', () => {
        if (!selectedNote || tweetTextarea.value.length === 0 || tweetTextarea.value.length > 280) return;
        
        const tweetText = encodeURIComponent(tweetTextarea.value);
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
        
        window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    });

    // Start App by Loading Notes
    fetchNotes();
});
