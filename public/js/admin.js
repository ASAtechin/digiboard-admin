// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Enhanced Lectures Page Functionality
    if (window.location.pathname === '/lectures') {
        initializeLecturesPage();
    }

    // Auto-refresh dashboard every 5 minutes
    if (window.location.pathname === '/dashboard') {
        setInterval(function() {
            window.location.reload();
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Confirm delete actions
    document.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item?')) {
                e.preventDefault();
            }
        });
    });
});

    // Auto-save form data to localStorage
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        const formId = form.id || 'auto-save-form';
        
        // Load saved data
        const savedData = localStorage.getItem(formId);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(function(key) {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input && input.type !== 'password') {
                        input.value = data[key];
                    }
                });
            } catch (e) {
                console.log('Error loading saved form data');
            }
        }

        // Save data on input
        form.addEventListener('input', function() {
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                if (key !== 'password') {
                    data[key] = value;
                }
            }
            localStorage.setItem(formId, JSON.stringify(data));
        });

        // Clear saved data on successful submit
        form.addEventListener('submit', function() {
            localStorage.removeItem(formId);
        });
    });

    // Bulk selection for lectures
    const selectAllCheckbox = document.getElementById('selectAll');
    const lectureCheckboxes = document.querySelectorAll('.lecture-checkbox');
    const bulkActionBtn = document.getElementById('bulkActionBtn');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            lectureCheckboxes.forEach(function(checkbox) {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateBulkActionButton();
        });
    }

    lectureCheckboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            updateBulkActionButton();
            
            // Update select all checkbox
            if (selectAllCheckbox) {
                const checkedCount = document.querySelectorAll('.lecture-checkbox:checked').length;
                selectAllCheckbox.checked = checkedCount === lectureCheckboxes.length;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < lectureCheckboxes.length;
            }
        });
    });

    function updateBulkActionButton() {
        const checkedCount = document.querySelectorAll('.lecture-checkbox:checked').length;
        if (bulkActionBtn) {
            bulkActionBtn.style.display = checkedCount > 0 ? 'block' : 'none';
            bulkActionBtn.textContent = `Bulk Actions (${checkedCount} selected)`;
        }
    }

    // Time picker enhancement
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(function(input) {
        input.addEventListener('change', function() {
            validateTimeRange();
        });
    });

    function validateTimeRange() {
        const startTime = document.querySelector('input[name="startTime"]');
        const endTime = document.querySelector('input[name="endTime"]');
        
        if (startTime && endTime && startTime.value && endTime.value) {
            if (startTime.value >= endTime.value) {
                endTime.setCustomValidity('End time must be after start time');
            } else {
                endTime.setCustomValidity('');
            }
        }
    }

    // Dynamic form validation
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(function(input) {
        input.addEventListener('blur', function() {
            validateInput(input);
        });
    });

    function validateInput(input) {
        const feedback = input.parentNode.querySelector('.invalid-feedback');
        
        if (!input.checkValidity()) {
            input.classList.add('is-invalid');
            if (feedback) {
                feedback.textContent = input.validationMessage;
            }
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    }

    // Quick search functionality
    const searchInputs = document.querySelectorAll('.quick-search');
    searchInputs.forEach(function(searchInput) {
        const targetSelector = searchInput.dataset.target;
        const searchableItems = document.querySelectorAll(targetSelector);

        searchInput.addEventListener('input', function() {
            const searchTerm = searchInput.value.toLowerCase();
            
            searchableItems.forEach(function(item) {
                const text = item.textContent.toLowerCase();
                const shouldShow = text.includes(searchTerm);
                item.style.display = shouldShow ? '' : 'none';
            });
        });
    });

    // Auto-resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(function(textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });

    // Status indicator with fallback
    function updateConnectionStatus() {
        // Try the health endpoint first
        fetch('/api/health')
            .then(response => {
                const statusIndicator = document.getElementById('connectionStatus');
                if (statusIndicator) {
                    if (response.ok) {
                        statusIndicator.className = 'badge bg-success';
                        statusIndicator.innerHTML = '<i class="fas fa-check-circle me-1"></i>Connected';
                    } else {
                        statusIndicator.className = 'badge bg-warning';
                        statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Warning';
                    }
                }
            })
            .catch(() => {
                // Fallback to simple status endpoint if health endpoint fails
                fetch('/status')
                    .then(response => {
                        const statusIndicator = document.getElementById('connectionStatus');
                        if (statusIndicator) {
                            if (response.ok) {
                                statusIndicator.className = 'badge bg-info';
                                statusIndicator.innerHTML = '<i class="fas fa-info-circle me-1"></i>Online';
                            } else {
                                statusIndicator.className = 'badge bg-warning';
                                statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Warning';
                            }
                        }
                    })
                    .catch(() => {
                        const statusIndicator = document.getElementById('connectionStatus');
                        if (statusIndicator) {
                            statusIndicator.className = 'badge bg-danger';
                            statusIndicator.innerHTML = '<i class="fas fa-times-circle me-1"></i>Disconnected';
                        }
                    });
            });
    }

    // Update status every 30 seconds
    updateConnectionStatus();
    setInterval(updateConnectionStatus, 30000);

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
                submitBtn.disabled = true;
                
                // Re-enable button after 5 seconds (fallback)
                setTimeout(function() {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 5000);
            }
        });
    });

    // Enhanced table sorting
    document.querySelectorAll('.sortable').forEach(function(header) {
        header.addEventListener('click', function() {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const index = Array.from(header.parentNode.children).indexOf(header);
            const isAsc = header.classList.contains('sort-asc');
            
            // Remove existing sort classes
            header.parentNode.querySelectorAll('th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Add new sort class
            header.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
            
            // Sort rows
            rows.sort(function(a, b) {
                const aText = a.children[index].textContent.trim();
                const bText = b.children[index].textContent.trim();
                
                if (!isNaN(aText) && !isNaN(bText)) {
                    return isAsc ? bText - aText : aText - bText;
                } else {
                    return isAsc ? bText.localeCompare(aText) : aText.localeCompare(bText);
                }
            });
            
            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        });
    });
});

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.remove();
    }, 5000);
}

function formatTime(time) {
    const date = new Date(`1970-01-01T${time}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Enhanced Lectures Page Functionality
function initializeLecturesPage() {
    const searchInput = document.getElementById('searchInput');
    const dayFilter = document.getElementById('dayFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const teacherFilter = document.getElementById('teacherFilter');
    const selectAllCheckbox = document.getElementById('selectAll');
    const bulkActionsRow = document.getElementById('bulkActionsRow');
    const selectedCountSpan = document.getElementById('selectedCount');

    if (!searchInput) {
        console.error('searchInput not found');
        return;
    }

    let selectedLectures = new Set();

    // Search and filter functionality
    function filterLectures() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const dayValue = dayFilter?.value || '';
        const semesterValue = semesterFilter?.value || '';
        const teacherValue = teacherFilter?.value || '';

        document.querySelectorAll('.lecture-row').forEach(row => {
            // Get text content from correct columns (updated table structure)
            const subject = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
            const teacher = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
            const classroom = row.querySelector('td:nth-child(6)')?.textContent.toLowerCase() || '';
            
            // Get data attributes (fixed attribute names)
            const day = row.dataset.day || '';
            const semester = row.getAttribute('data-semester') || '';
            const teacherId = row.getAttribute('data-teacher-id') || '';

            const matchesSearch = !searchTerm || 
                subject.includes(searchTerm) || 
                teacher.includes(searchTerm) || 
                classroom.includes(searchTerm);
            
            const matchesDay = !dayValue || day === dayValue;
            const matchesSemester = !semesterValue || semester === semesterValue;
            const matchesTeacher = !teacherValue || teacherId === teacherValue;

            if (matchesSearch && matchesDay && matchesSemester && matchesTeacher) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
                // Uncheck hidden rows
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    checkbox.checked = false;
                    selectedLectures.delete(checkbox.value);
                }
            }
        });

        updateBulkActions();
    }

    // Event listeners for filters
    if (searchInput) {
        searchInput.addEventListener('input', filterLectures);
    }
    if (dayFilter) {
        dayFilter.addEventListener('change', filterLectures);
    }
    if (semesterFilter) {
        semesterFilter.addEventListener('change', filterLectures);
    }
    if (teacherFilter) {
        teacherFilter.addEventListener('change', filterLectures);
    }

    // Select all functionality
    selectAllCheckbox?.addEventListener('change', function() {
        const visibleCheckboxes = document.querySelectorAll('.lecture-row:not([style*="display: none"]) input[type="checkbox"]');
        visibleCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            if (this.checked) {
                selectedLectures.add(checkbox.value);
            } else {
                selectedLectures.delete(checkbox.value);
            }
        });
        updateBulkActions();
    });

    // Individual checkbox handling
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('.lecture-row')) {
            if (e.target.checked) {
                selectedLectures.add(e.target.value);
            } else {
                selectedLectures.delete(e.target.value);
            }
            updateBulkActions();
        }
    });

    // Update bulk actions visibility
    function updateBulkActions() {
        if (selectedCountSpan) {
            selectedCountSpan.textContent = selectedLectures.size;
        }
        
        if (bulkActionsRow) {
            bulkActionsRow.style.display = selectedLectures.size > 0 ? 'block' : 'none';
        }

        // Update select all checkbox
        if (selectAllCheckbox) {
            const visibleCheckboxes = document.querySelectorAll('.lecture-row:not([style*="display: none"]) input[type="checkbox"]');
            const checkedVisible = document.querySelectorAll('.lecture-row:not([style*="display: none"]) input[type="checkbox"]:checked');
            selectAllCheckbox.indeterminate = checkedVisible.length > 0 && checkedVisible.length < visibleCheckboxes.length;
            selectAllCheckbox.checked = visibleCheckboxes.length > 0 && checkedVisible.length === visibleCheckboxes.length;
        }
    }

    // Clear filters
    window.clearFilters = function() {
        if (searchInput) searchInput.value = '';
        if (dayFilter) dayFilter.value = '';
        if (semesterFilter) semesterFilter.value = '';
        if (teacherFilter) teacherFilter.value = '';
        filterLectures();
    };

    // Clear selection
    window.clearSelection = function() {
        selectedLectures.clear();
        document.querySelectorAll('.lecture-row input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateBulkActions();
    };

    // Bulk delete
    window.bulkDelete = function() {
        if (selectedLectures.size === 0) return;
        
        if (confirm(`Are you sure you want to delete ${selectedLectures.size} lecture(s)?`)) {
            // Create form and submit
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/lectures/bulk-delete';
            
            selectedLectures.forEach(id => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'lectureIds[]';
                input.value = id;
                form.appendChild(input);
            });
            
            document.body.appendChild(form);
            form.submit();
        }
    };

    // Bulk toggle status
    window.bulkToggleStatus = function() {
        if (selectedLectures.size === 0) return;
        
        if (confirm(`Toggle status for ${selectedLectures.size} lecture(s)?`)) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/lectures/bulk-toggle-status';
            
            selectedLectures.forEach(id => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'lectureIds[]';
                input.value = id;
                form.appendChild(input);
            });
            
            document.body.appendChild(form);
            form.submit();
        }
    };

    // Initial setup
    updateBulkActions();
}

function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}
