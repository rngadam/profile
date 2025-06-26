document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline-container');
    let resumeData = {};
    let allItems = [];
    let currentIndex = -1;

    async function loadContent() {
        const response = await fetch('index.json');
        resumeData = await response.json();
        buildTimeline();
    }

    function buildTimeline() {
        const experiences = resumeData.experience.jobs;
        const projects = resumeData.projects.list;
        allItems = [...experiences, ...projects].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        const maxDuration = Math.max(...allItems.map(item => getDurationInMonths(item.startDate, item.endDate)));

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
            logo.onerror = () => { logo.style.display = 'none'; }; // Hide if logo not found
            itemDiv.appendChild(logo);

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

    loadContent();
});
