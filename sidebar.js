(function () {
    const targetDiv = document.querySelector('.target-div');
    if (!targetDiv) return console.error('Target div not found.');

    const MIN_WIDTH = 400;
    const MAX_WIDTH = 1000;
    const DEFAULT_WIDTH = 500;

    const sidebar = createSidebar();
    const toggleBtn = createToggleButton();

    initToggleBehavior();
    initResizeBehavior();
    initSwipeToOpen();
    initKeyboardShortcut(); // ✅ NEW
    initAccordion();
    initSearch();

    // --- Function Definitions ---

    function createSidebar() {
        const style = document.createElement('style');
        style.textContent = `
            #reviewNotesSidebar {
                position: fixed;
                top: 0;
                left: -500px;
                width: 500px;
                height: 100%;
                background-color: #f4f4f4;
                box-shadow: 2px 0 5px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: row;
                transition: left 0.3s ease-in-out;
                z-index: 10000;
                font-family: sans-serif;
            }
            #reviewNotesSidebar.active { 
                left: 0; 
            }
            #sidebarContent {
                flex: 1;
                padding: 20px;
                overflow: auto;
            }
            #resizer {
                width: 8px;
                cursor: ew-resize;
                background-color: transparent;
            }
            #resizer:hover { background-color: #ddd; }
            #toggleSidebarBtn {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10001;
                padding: 8px 12px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            body.noselect { user-select: none; }
            /* ✅ Accordion styles */
            .accordion-item { margin-bottom: 5px; }
            .accordion-toggle {
                position: relative;
                width: 100%;
                text-align: left;
                padding: 10px 35px 10px 10px;
                background: #eee;
                border: none;
                outline: none;
                cursor: pointer;
                font-weight: bold;
                margin-top: 5px;
            }
            .accordion-toggle::after {
                content: '+';
                position: absolute;
                right: 10px;
                font-weight: bold;
            }
            .accordion-toggle.active::after {
                content: '−';
            }
            .accordion-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: #fafafa;
                border: 1px solid #ddd;
                padding: 0 10px;
                display: block;
            }
            .accordion-content p { margin: 10px 0; }
            .search-bar {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
                position: relative;
            }
            #emptySearchMsg {
                position: absolute;
                top: 100%;
                left: 0;
                background: #a00;
                color: #fff;
                font-size: 12px;
                padding: 3px 8px;
                border-radius: 4px;
                margin-top: 4px;
                display: none;
                z-index: 1;
                white-space: nowrap;
            }
            #searchInput {
                flex: 1;
                padding: 6px 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            #searchBtn {
                padding: 6px 12px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .search-message, #noResults {
                display: none;
                color: #a00;
                font-size: 13px;
                margin-bottom: 10px;
            }
            .copy-btn {
                margin-top: 10px;
                background: #007bff;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            .copy-btn:active { background: #0056b3; }
            .copy-msg {
                display: inline-block;
                margin-left: 10px;
                color: green;
                font-size: 12px;
            }
    `;

    document.head.appendChild(style);

    const sidebar = document.createElement('div');
    sidebar.id = 'reviewNotesSidebar';
    sidebar.innerHTML = `
        <div id="sidebarContent">
            <h2>Notes</h2>
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Search...">
                <button id="searchBtn">Search</button>
                <div id="emptySearchMsg" class="search-message">Please enter a search term.</div>
            </div>

            <!-- Git IP Input below the search bar -->
            <div class="search-bar" style="margin-bottom: 10px;">
                <input type="text" id="gitIpInput" placeholder="Enter Git IP (e.g., 54.254.224.12)">
                <button id="setIpBtn">Set IP</button>
            </div>
            <div id="noResults" class="search-message">No results found.</div>

            <!-- Generate Information Section -->
            <div class="accordion-item">
                <button class="accordion-toggle" id="generateBtn">Generate Information</button>
                <div class="accordion-content">
                    <div class="accordion-text">
                        <p id="generateInfoContent">Press Generate to create the command.</p>
                    </div>
                    <button id="copyBtnGenerate" class="copy-btn">Copy</button>
                </div>
            </div>

            <div class="accordion-item">
                <button class="accordion-toggle">Section 2</button>
                <div class="accordion-content">
                    <div class="accordion-text">
                        <p><b>This is the content for Section 2.</b></p>
                        <a href="https://google.com">https://google.com</a>
                        https://google.com
                    </div>
                    <button class="copy-btn">Copy</button>
                </div>
            </div>

            <div class="accordion-item">
                <button class="accordion-toggle">Section 3</button>
                <div class="accordion-content">
                    <div class="accordion-text">
                        <p>This is the content for Section 3.</p>
                    </div>
                    <button class="copy-btn">Copy</button>
                </div>
            </div>
        </div>
        <div id="resizer"></div>
    `;

    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) sidebar.style.width = `${savedWidth}px`;

    document.body.appendChild(sidebar);
    sidebar.classList.remove('active');
    sidebar.style.left = `-${sidebar.offsetWidth}px`;

    return sidebar;
}

// Utility: get next Monday from today
function nextMonday() {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7));
  return d.getTime();
}

// Check if stored IP is still valid until next Monday
function isIpValid() {
  const expire = localStorage.getItem('gitIpExpire');
  return expire && Date.now() < parseInt(expire);
}

// Populate input if IP is valid
const ipInput = document.getElementById('gitIpInput');
const setIpBtn = document.getElementById('setIpBtn');

if (isIpValid()) {
  ipInput.value = localStorage.getItem('gitIp') || '';
} else {
  ipInput.value = '';
  localStorage.removeItem('gitIp');
  localStorage.removeItem('gitIpExpire');
}

// When user clicks "Set IP"
setIpBtn.addEventListener('click', () => {
  const ip = ipInput.value.trim();
  // Basic IP format check (IPv4)
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    alert('Please enter a valid IPv4 address.');
    return;
  }
  localStorage.setItem('gitIp', ip);
  localStorage.setItem('gitIpExpire', nextMonday());
  alert(`IP "${ip}" saved! It will expire next Monday.`);
});

// Generate command with IP stored or prompt if missing/expired
document.getElementById('generateBtn').addEventListener('click', () => {
  const date = new Date();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  const formattedDate = `${month}-${day}-${year}`;
  const title = document.title;

  if (!isIpValid()) {
    alert('Please set a valid IP address before generating.');
    return;
  }
  const gitIp = localStorage.getItem('gitIp');

  const cmd = `mkdir -p "${formattedDate}-${title}/bu/db" "${formattedDate}-${title}/bu/wp-content" "${formattedDate}-${title}/others/screenshots" "${formattedDate}-${title}/others/old-files" "${formattedDate}-${title}/others/attachments" "${formattedDate}-${title}/others/qa-tasks" "${formattedDate}-${title}/up/db" "${formattedDate}-${title}/up/wp-content" && cd "${formattedDate}-${title}" && git clone git@${gitIp}:${title}.git`;
  document.getElementById('generateInfoContent').innerText = cmd;
});
// Generate button click event handler
// Generate the current date in "July-17-2025" format
document.getElementById('generateBtn').addEventListener('click', () => {
    const now = new Date();
    const options = { month: 'long' };
    const month = now.toLocaleString('en-US', options); // e.g., July
    const day = now.getDate(); // e.g., 17
    const year = now.getFullYear(); // e.g., 2025
    const formattedDate = `${month}-${day}-${year}`; // July-17-2025

    const title = document.title;
    let gitIp = document.getElementById('gitIpInput').value;

    // If no IP address is provided or expired, prompt the user for a new one
    if (!gitIp || isIpAddressExpired()) {
        alert('Please provide a valid IP address.');
        return; // Exit the function if no IP address
    }

    // Store the IP address in localStorage and set expiration date
    localStorage.setItem('gitIp', gitIp);
    localStorage.setItem('gitIpExpiration', Date.now() + 7 * 24 * 60 * 60 * 1000); // Expire in 1 week

    const command = `mkdir -p "${formattedDate}-${title}/bu/db" "${formattedDate}-${title}/bu/wp-content" "${formattedDate}-${title}/others/screenshots" "${formattedDate}-${title}/others/old-files" "${formattedDate}-${title}/others/attachments" "${formattedDate}-${title}/others/qa-tasks" "${formattedDate}-${title}/up/db" "${formattedDate}-${title}/up/wp-content" && cd "${formattedDate}-${title}" && git clone git@${gitIp}:${title}.git`;

    document.getElementById('generateInfoContent').innerText = command;
});

// Function to check if IP address is expired
function isIpAddressExpired() {
    const expiration = localStorage.getItem('gitIpExpiration');
    return !expiration || Date.now() > parseInt(expiration);
}

// On load, check if IP address exists in localStorage and populate input
window.addEventListener('load', () => {
    const savedIp = localStorage.getItem('gitIp');
    if (savedIp && !isIpAddressExpired()) {
        document.getElementById('gitIpInput').value = savedIp; // Auto-fill IP address
    } else {
        document.getElementById('gitIpInput').value = ''; // Prompt for new IP
    }
});

// Copy button click event handler
document.getElementById('copyBtnGenerate').addEventListener('click', () => {
    const command = document.getElementById('generateInfoContent').innerText;

    if (command) {
        navigator.clipboard.writeText(command)
            .then(() => {
                const btn = document.getElementById('copyBtnGenerate');
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000); // Reset the button text after 2 seconds
            })
            .catch(err => console.error('Copy failed:', err));
    }
});



            function createToggleButton() {
                const btn = document.createElement('button');
                btn.id = 'toggleSidebarBtn';
                btn.textContent = 'Review Notes';
                targetDiv.appendChild(btn);
                return btn;
            }

            function toggleSidebar() {
                const isOpen = sidebar.classList.contains('active');
                const width = sidebar.offsetWidth;
                if (isOpen) {
                    localStorage.setItem('sidebarWidth', width);
                    sidebar.classList.remove('active');
                    sidebar.style.left = `-${width}px`;
                } else {
                    const storedWidth = localStorage.getItem('sidebarWidth') || DEFAULT_WIDTH;
                    sidebar.style.width = `${storedWidth}px`;
                    sidebar.style.left = '0';
                    sidebar.classList.add('active');
                }
            }

            function initToggleBehavior() {
                toggleBtn.addEventListener('click', toggleSidebar);
            }

            function initResizeBehavior() {
                const resizer = sidebar.querySelector('#resizer');
                let isResizing = false;

                const updateWidth = x => {
                    if (x >= MIN_WIDTH && x <= MAX_WIDTH) {
                        sidebar.style.width = `${x}px`;
                        localStorage.setItem('sidebarWidth', x);
                    }
                };

                const stopResize = () => {
                    isResizing = false;
                    document.body.classList.remove('noselect');
                    document.body.style.cursor = '';
                };

                resizer.addEventListener('mousedown', e => {
                    isResizing = true;
                    document.body.classList.add('noselect');
                    document.body.style.cursor = 'ew-resize';
                    e.preventDefault();
                });

                document.addEventListener('mousemove', e => {
                    if (isResizing) updateWidth(e.clientX);
                });

                document.addEventListener('mouseup', stopResize);

                resizer.addEventListener('touchstart', e => {
                    isResizing = true;
                    e.preventDefault();
                });

                document.addEventListener('touchmove', e => {
                    if (isResizing) updateWidth(e.touches[0].clientX);
                });

                document.addEventListener('touchend', stopResize);
            }

            function initSwipeToOpen() {
                let startX = 0, endX = 0;
                document.addEventListener('touchstart', e => {
                    if (e.touches.length === 1) startX = e.touches[0].clientX;
                });
                document.addEventListener('touchend', e => {
                    endX = e.changedTouches[0].clientX;
                    const delta = endX - startX;
                    if (startX < 30 && delta > 60 && !sidebar.classList.contains('active')) {
                        const storedWidth = localStorage.getItem('sidebarWidth') || DEFAULT_WIDTH;
                        sidebar.style.width = `${storedWidth}px`;
                        sidebar.style.left = '0';
                        sidebar.classList.add('active');
                    }
                });
            }

            function initKeyboardShortcut() {
                document.addEventListener('keydown', e => {
                    if (e.ctrlKey && e.code === 'Space') {
                        e.preventDefault();
                        toggleSidebar();
                    }
                });
            }
            

        function initAccordion() {
            const items = sidebar.querySelectorAll('.accordion-item');

            if (items.length === 0) return;

            // Open first by default
            const firstContent = items[0].querySelector('.accordion-content');
            const firstToggle = items[0].querySelector('.accordion-toggle');

            firstContent.style.maxHeight = firstContent.scrollHeight + 'px';
            firstToggle.classList.add('active');

            items.forEach(item => {
                const toggle = item.querySelector('.accordion-toggle');
                const content = item.querySelector('.accordion-content');

                toggle.addEventListener('click', () => {
                const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

                // Close all
                items.forEach(otherItem => {
                    otherItem.querySelector('.accordion-content').style.maxHeight = '0';
                    otherItem.querySelector('.accordion-toggle').classList.remove('active');
                });

                // Open if was closed
                if (!isOpen) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    toggle.classList.add('active');
                }
                });
            });
        }

        function initCopyButtons() {
            const copyBtns = sidebar.querySelectorAll('.copy-btn');

            copyBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                const parentContent = btn.closest('.accordion-content');
                const textDiv = parentContent.querySelector('.accordion-text');

                if (!textDiv) {
                    console.error('No .accordion-text found!');
                    return;
                }

                // Wrap the HTML with a style to force Tahoma, 14px
                const htmlToCopy = `
                    <span style="font-family: Tahoma, sans-serif; font-size: 14px;">
                        ${textDiv.innerHTML.trim()}
                    </span>
                `.trim();

                const plainText = textDiv.innerText.trim();

                // Create clipboard item with HTML + plain text
                const blobHTML = new Blob([htmlToCopy], { type: 'text/html' });
                const blobPlain = new Blob([plainText], { type: 'text/plain' });

                const data = [
                    new ClipboardItem({
                    'text/plain': blobPlain,
                    'text/html': blobHTML
                    })
                ];

                navigator.clipboard.write(data).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                    btn.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Copy failed:', err);
                });
                });
            });
        }



        function initSearch() {
            const searchInput = sidebar.querySelector('#searchInput');
            const searchBtn = sidebar.querySelector('#searchBtn');
            const noResults = sidebar.querySelector('#noResults');
            const emptySearchMsg = sidebar.querySelector('#emptySearchMsg');

            const toggles = sidebar.querySelectorAll('.accordion-toggle');
            const accordions = sidebar.querySelectorAll('.accordion-content');

            function doSearch() {
                const filter = searchInput.value.trim().toLowerCase();
                let matches = 0;

                if (filter === '') {
                // ✅ If empty, show all toggles & contents, collapse all & RESET icons
                toggles.forEach((toggle, i) => {
                    toggle.style.display = '';
                    toggle.classList.remove('active'); // 🗝 RESET icon
                    accordions[i].style.display = '';
                    accordions[i].style.overflow = 'hidden';
                    accordions[i].style.maxHeight = '0';
                });
                noResults.style.display = 'none';
                emptySearchMsg.style.display = 'none';
                return;
                }

                toggles.forEach((toggle, i) => {
                const content = accordions[i];
                const text = toggle.textContent + ' ' + content.textContent;
                const match = text.toLowerCase().includes(filter);

                toggle.style.display = match ? '' : 'none';
                content.style.display = match ? '' : 'none';

                // ✅ Always collapse & reset icon when filtering
                content.style.maxHeight = '0';
                toggle.classList.remove('active');

                if (match) matches++;
                });

                noResults.style.display = matches === 0 ? 'block' : 'none';
                emptySearchMsg.style.display = 'none';
            }

            // ✅ Live search on typing
            searchInput.addEventListener('input', doSearch);

            // ✅ Search button click
            searchBtn.addEventListener('click', () => {
                const searchTerm = searchInput.value.trim().toLowerCase();
                if (searchTerm === '') {
                emptySearchMsg.style.display = 'block';
                noResults.style.display = 'none';
                toggles.forEach((toggle, i) => {
                    toggle.style.display = '';
                    toggle.classList.remove('active'); // 🗝 RESET icon here too
                    accordions[i].style.display = '';
                    accordions[i].style.overflow = 'hidden';
                    accordions[i].style.maxHeight = '0';
                });
                return;
                }
                emptySearchMsg.style.display = 'none';
                doSearch();
            });

            // ✅ Enter key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim().toLowerCase();
                if (searchTerm === '') {
                    emptySearchMsg.style.display = 'block';
                    noResults.style.display = 'none';
                    toggles.forEach((toggle, i) => {
                    toggle.style.display = '';
                    toggle.classList.remove('active'); // 🗝 RESET icon here too
                    accordions[i].style.display = '';
                    accordions[i].style.overflow = 'hidden';
                    accordions[i].style.maxHeight = '0';
                    });
                    return;
                }
                emptySearchMsg.style.display = 'none';
                doSearch();
                }
            });

            // ✅ Click anywhere hides "empty search" message
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchBtn.contains(e.target)) {
                emptySearchMsg.style.display = 'none';
                }
            });
            }

        // === ✅ Init all ===
        // initAccordion();        // Initialize accordion behavior
        initSearch();           // Initialize search functionality
        initCopyButtons();      // Initialize copy buttons
        initResizeBehavior();   // Initialize resize behavior
    })();