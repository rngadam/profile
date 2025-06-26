document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');
    let resumeData = {};
    let allItems = [];
    let currentIndex = -1;

    async function loadContent() {
        const response = await fetch('index.json');
        resumeData = await response.json();
        // Load photos.json in parallel
        const photosResponse = await fetch('photos.json');
        const photosData = await photosResponse.json();
        buildTimeline(photosData);
    }

    function buildTimeline(photosData) {
        const experiences = resumeData.experience.jobs;
        const projects = resumeData.projects.list;
        allItems = [...experiences, ...projects].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

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

            const title = document.createElement('h3');
            title.textContent = item.title.fr; // Default to French for now
            itemDiv.appendChild(title);

            const company = document.createElement('p');
            const dates = formatDates(item.startDate, item.endDate, 'fr');
            company.innerHTML = `<strong>${item.company}</strong> | ${item.location} | ${dates}`;
            itemDiv.appendChild(company);

            const logo = document.createElement('img');
            logo.src = `logos/${item.company.toLowerCase().replace(/\s/g, '')}.png`; // Placeholder path
            logo.alt = `${item.company} Logo`;
            logo.classList.add('logo');
            logo.onerror = () => { logo.style.display = 'none'; };
            itemDiv.appendChild(logo);

            // Insert photos that fall within this timeline item's date range
            const itemStart = new Date(item.startDate);
            const itemEnd = item.endDate.toLowerCase() === 'present' ? new Date() : new Date(item.endDate);
            console.log(`Processing item: ${item.title.fr} from ${itemStart} to ${itemEnd}`);
            // Collect all photos for this item in a row
            const photosRow = document.createElement('div');
            photosRow.classList.add('timeline-photos-row');
            sortedPhotos.forEach(photo => {
                if (photo.createdDate >= itemStart && photo.createdDate <= itemEnd) {
                    const photoImg = document.createElement('img');
                    photoImg.src = `photos/${photo.filename}`;
                    photoImg.alt = `Photo taken on ${photo.created}`;
                    photoImg.classList.add('timeline-photo');
                    // Show full resolution on hover
                    photoImg.addEventListener('mouseenter', (e) => showFullResHover(photoImg, photo.filename));
                    photoImg.addEventListener('mouseleave', hideFullResHover);
                    photosRow.appendChild(photoImg);
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
