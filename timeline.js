document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');
    let resumeData = {};
    let allItems = [];
    let currentIndex = -1;

    let DEBUG_SHOW_FILENAME = false; // Set to true to show filenames under photos

    async function loadContent() {
        const response = await fetch('index.json');
        resumeData = await response.json();
        // Load photos.json in parallel
        const photosResponse = await fetch('photos.json');
        const photosData = await photosResponse.json();
        buildTimeline(photosData);
    }

    function buildTimeline(photosData) {
        // Add a label to each item to distinguish work, projects, and leisure
        const work = resumeData.experience.jobs.map(item => ({ ...item, itemType: 'work' }));
        const projects = resumeData.projects.list.map(item => ({ ...item, itemType: 'project' }));
        const leisure = resumeData.leisure && resumeData.leisure.list ? resumeData.leisure.list.map(item => ({ ...item, itemType: 'leisure' })) : [];
        allItems = [...work, ...projects, ...leisure].sort((a, b) => {
            const aEnd = a.endDate && a.endDate.toLowerCase() !== 'present' ? new Date(a.endDate) : new Date();
            const bEnd = b.endDate && b.endDate.toLowerCase() !== 'present' ? new Date(b.endDate) : new Date();
            if (bEnd - aEnd !== 0) return bEnd - aEnd;
            const aStart = new Date(a.startDate);
            const bStart = new Date(b.startDate);
            return bStart - aStart;
        });

        // Prepare photos sorted by created timestamp (ascending)
        const sortedPhotos = photosData
            .filter(photo => photo.created)
            .map(photo => ({ ...photo, createdDate: new Date(photo.created) }))
            .sort((a, b) => a.createdDate - b.createdDate);
        console.log(`Total photos loaded: ${sortedPhotos.length}`);

        const maxDuration = Math.max(...allItems.map(item => getDurationInMonths(item.startDate, item.endDate)));

        let photoIndex = 0;
        allItems.forEach((item, index) => {
            const duration = getDurationInMonths(item.startDate, item.endDate);
            const height = (duration / maxDuration) * 200 + 100; // Base height + proportional height

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('timeline-item');
            itemDiv.style.minHeight = `${height}px`;
            itemDiv.dataset.index = index;

            // Create a flex row for logo and text
            const headerRow = document.createElement('div');
            headerRow.style.display = 'flex';
            headerRow.style.alignItems = 'center';
            headerRow.style.gap = '16px';

            if (item.organization) {
                const logo = document.createElement('img');
                logo.src = `logos/${item.organization.toLowerCase().replace(/\s/g, '')}.png`;
                logo.alt = `${item.organization} Logo`;
                logo.classList.add('logo');
                logo.onerror = () => { logo.style.display = 'none'; };
                // Place logo at the start (left side)
                headerRow.appendChild(logo);
            }

            // Add text content to the right of the logo
            const textCol = document.createElement('div');
            const title = document.createElement('h3');
            title.textContent = item.title.fr; // Default to French for now
            title.classList.add(item.itemType === 'work' ? 'timeline-title-work' : item.itemType === 'project' ? 'timeline-title-project' : 'timeline-title-leisure');
            textCol.appendChild(title);
            const org = document.createElement('p');
            const dates = formatDates(item.startDate, item.endDate, 'fr');
            org.innerHTML = item.organization
                ? `<strong>${item.organization}</strong> | ${item.location} | ${dates}`
                : `${item.location} | ${dates}`;
            textCol.appendChild(org);
            headerRow.appendChild(textCol);
            itemDiv.appendChild(headerRow);

            // Collect all photos for this item in a row
            const itemStart = new Date(item.startDate);
            const itemEnd = item.endDate.toLowerCase() === 'present' ? new Date() : new Date(item.endDate);
            const photosRow = document.createElement('div');
            photosRow.classList.add('timeline-photos-row');
            sortedPhotos.forEach(photo => {
                if (
                    photo.createdDate >= itemStart &&
                    photo.createdDate <= itemEnd &&
                    Array.isArray(photo.labels) &&
                    photo.labels.includes(item.itemType)
                ) {
                    const photoContainer = document.createElement('div');
                    photoContainer.classList.add('timeline-photo-container');
                    const photoImg = document.createElement('img');
                    photoImg.src = `photos/${photo.filename}`;
                    photoImg.alt = `Photo taken on ${photo.created}`;
                    photoImg.classList.add('timeline-photo');
                    // Show full resolution on hover only (no display image)
                    photoImg.addEventListener('mouseenter', (e) => showFullResHover(photoImg, photo.filename));
                    photoImg.addEventListener('mouseleave', hideFullResHover);
                    // Display filename at the bottom if debugging flag is set
                    if (DEBUG_SHOW_FILENAME) {
                        const filenameDiv = document.createElement('div');
                        filenameDiv.classList.add('timeline-photo-filename');
                        filenameDiv.textContent = photo.filename;
                        photoContainer.appendChild(filenameDiv);
                    }
                    photoContainer.appendChild(photoImg);
                    photosRow.appendChild(photoContainer);
                }
            });
            if (photosRow.children.length > 0) {
                itemDiv.appendChild(photosRow);
            }

            timelineContainer.appendChild(itemDiv);
        });
    }

    function getDurationInMonths(startDateStr, endDateStr) {
        const start = new Date(startDateStr + 'T00:00:00Z');
        let end;
        if (endDateStr.toLowerCase() === 'present') {
            end = new Date();
        } else {
            end = new Date(endDateStr + 'T00:00:00Z');
        }
        const years = end.getUTCFullYear() - start.getUTCFullYear();
        const months = end.getUTCMonth() - start.getUTCMonth();
        return years * 12 + months + 1;
    }

    function formatDates(startDateStr, endDateStr, lang) {
        const startDate = new Date(startDateStr + 'T00:00:00Z');
        const endDate = endDateStr.toLowerCase() === 'present' ? new Date() : new Date(endDateStr + 'T00:00:00Z');
        const options = { year: 'numeric', month: 'long', timeZone: 'UTC' };

        const start = startDate.toLocaleDateString(lang, options);
        const end = endDateStr.toLowerCase() === 'present' ? (lang === 'fr' ? 'Aujourd\'hui' : 'Present') : endDate.toLocaleDateString(lang, options);

        return `${start} - ${end}`;
    }

    function updateActive(newIndex) {
        if (newIndex < 0 || newIndex >= allItems.length) return;

        const currentActive = document.querySelector('.timeline-item.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }

        currentIndex = newIndex;
        const newActive = document.querySelector(`[data-index='${currentIndex}']`);
        if (newActive) {
            newActive.classList.add('active');
            newActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateActive(currentIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateActive(currentIndex - 1);
        }
    });

    // Hover logic for full resolution image
    let fullResHoverDiv = null;
    function showFullResHover(targetImg, filename) {
        hideFullResHover();
        fullResHoverDiv = document.createElement('div');
        fullResHoverDiv.className = 'photo-hover-fullres';
        const img = document.createElement('img');
        img.src = `photos/${filename}`;
        img.alt = 'Full size photo';
        fullResHoverDiv.appendChild(img);
        document.body.appendChild(fullResHoverDiv);
        // Position near the hovered image
        const rect = targetImg.getBoundingClientRect();
        fullResHoverDiv.style.top = `${rect.top + window.scrollY - 10}px`;
        fullResHoverDiv.style.left = `${rect.right + 20 + window.scrollX}px`;
    }
    function hideFullResHover() {
        if (fullResHoverDiv) {
            fullResHoverDiv.remove();
            fullResHoverDiv = null;
        }
    }

    loadContent();
});
