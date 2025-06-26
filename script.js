document.addEventListener('DOMContentLoaded', () => {
    const langSelector = document.getElementById('language-selector');
    const themeSelector = document.getElementById('theme-selector');
    let currentLanguage = localStorage.getItem('language') || 'fr';
    let currentTheme = localStorage.getItem('theme') || 'style.css';
    let resumeData = {};

    function applyTheme(theme) {
        document.getElementById('theme-style').setAttribute('href', theme);
        localStorage.setItem('theme', theme);
        themeSelector.value = theme;
    }

    async function loadContent() {
        const response = await fetch('index.json');
        resumeData = await response.json();
        langSelector.value = currentLanguage;
        updatePage(currentLanguage);
    }

    function updatePage(lang) {
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);

        // Header
        document.getElementById('name').textContent = resumeData.name;
        document.getElementById('title').textContent = resumeData.title[lang];
        document.getElementById('location').textContent = resumeData.location[lang];

        // Contact
        document.querySelector('[data-translate="contact.title"]').textContent = lang === 'fr' ? 'Coordonnées' : 'Contact';
        const linkedin = document.getElementById('linkedin');
        linkedin.textContent = resumeData.contact.linkedin;
        linkedin.href = resumeData.contact.linkedin;

        // Summary
        document.querySelector('[data-translate="summary.title"]').textContent = lang === 'fr' ? 'Résumé' : 'Summary';
        document.getElementById('summary').textContent = resumeData.summary[lang];

        // Skills
        document.getElementById('skills-title').textContent = resumeData.skills.title[lang];
        const skillsList = document.getElementById('skills-list');
        skillsList.innerHTML = '';
        resumeData.skills.list.forEach(skill => {
            const li = document.createElement('li');
            li.textContent = skill[lang];
            skillsList.appendChild(li);
        });

        // Languages
        document.getElementById('languages-title').textContent = resumeData.languages.title[lang];
        const languagesList = document.getElementById('languages-list');
        languagesList.innerHTML = '';
        resumeData.languages.list.forEach(language => {
            const li = document.createElement('li');
            li.textContent = language[lang];
            languagesList.appendChild(li);
        });

        // Experience
        document.getElementById('experience-title').textContent = resumeData.experience.title[lang];
        const experienceList = document.getElementById('experience-list');
        experienceList.innerHTML = '';
        const totalExperienceMonths = calculateTotalExperience(resumeData.experience.jobs);
        document.getElementById('total-experience').textContent = `${resumeData.experience.total_experience[lang]}: ${formatDuration(totalExperienceMonths, lang)}`;

        const sortedJobs = resumeData.experience.jobs.sort((a, b) => {
            const dateA = a.endDate.toLowerCase() === 'present' ? new Date() : new Date(a.endDate);
            const dateB = b.endDate.toLowerCase() === 'present' ? new Date() : new Date(b.endDate);
            if (dateB - dateA !== 0) {
                return dateB - dateA;
            }
            return new Date(b.startDate) - new Date(a.startDate);
        });

        sortedJobs.forEach(job => {
            const jobDiv = document.createElement('div');
            jobDiv.classList.add('job');

            const jobTitle = document.createElement('h3');
            jobTitle.textContent = job.title[lang];
            jobDiv.appendChild(jobTitle);

            const organization = document.createElement('p');
            const duration = calculateDuration(job.startDate, job.endDate, lang);
            const dates = formatDates(job.startDate, job.endDate, lang);
            organization.innerHTML = `<strong>${job.organization}</strong> | ${job.location} | ${dates} (${duration})`;
            jobDiv.appendChild(organization);

            const descriptionList = document.createElement('ul');
            job.description[lang].forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                descriptionList.appendChild(li);
            });
            jobDiv.appendChild(descriptionList);

            if (job.details) {
                const detailsToggle = document.createElement('a');
                detailsToggle.href = '#';
                detailsToggle.textContent = lang === 'fr' ? 'Détails...' : 'Details...';
                detailsToggle.classList.add('details-toggle');
                detailsToggle.onclick = (e) => {
                    e.preventDefault();
                    const detailsContainer = jobDiv.querySelector('.details-container');
                    detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
                };
                jobDiv.appendChild(detailsToggle);

                const detailsContainer = document.createElement('div');
                detailsContainer.classList.add('details-container');
                detailsContainer.style.display = 'none';
                const detailsList = document.createElement('ul');
                job.details[lang].forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    detailsList.appendChild(li);
                });
                detailsContainer.appendChild(detailsList);
                jobDiv.appendChild(detailsContainer);
            }

            if (job.clients) {
                const clientsTitle = document.createElement('h4');
                clientsTitle.textContent = lang === 'fr' ? 'Mandats clients notables :' : 'Notable Client Engagements:';
                clientsTitle.classList.add('mt-3');
                jobDiv.appendChild(clientsTitle);

                const clientsList = document.createElement('ul');
                job.clients.forEach(client => {
                    const clientLi = document.createElement('li');
                    const clientDuration = calculateDuration(client.startDate, client.endDate, lang);
                    const clientDates = formatDates(client.startDate, client.endDate, lang);
                    clientLi.innerHTML = `<strong>${client.client}</strong> | ${client.title[lang]} (${clientDates})<br><small>${client.description[lang][0]}</small>`;
                    clientsList.appendChild(clientLi);
                });
                jobDiv.appendChild(clientsList);
            }

            experienceList.appendChild(jobDiv);
        });

        // Projects
        document.getElementById('projects-title').textContent = resumeData.projects.title[lang];
        const projectsList = document.getElementById('projects-list');
        projectsList.innerHTML = '';
        resumeData.projects.list.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.classList.add('job'); // Re-use job styling

            const projectTitle = document.createElement('h3');
            projectTitle.textContent = project.title[lang];
            projectDiv.appendChild(projectTitle);

            const organization = document.createElement('p');
            const duration = calculateDuration(project.startDate, project.endDate, lang);
            const dates = formatDates(project.startDate, project.endDate, lang);
            organization.innerHTML = `<strong>${project.organization}</strong> | ${project.location} | ${dates} (${duration})`;
            projectDiv.appendChild(organization);

            const descriptionList = document.createElement('ul');
            project.description[lang].forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                descriptionList.appendChild(li);
            });
            projectDiv.appendChild(descriptionList);

            projectsList.appendChild(projectDiv);
        });

        // Education
        document.getElementById('education-title').textContent = resumeData.education.title[lang];
        const educationList = document.getElementById('education-list');
        educationList.innerHTML = '';

        const sortedEducation = resumeData.education.entries.sort((a, b) => {
            const dateA = new Date(a.endDate + 'T00:00:00Z');
            const dateB = new Date(b.endDate + 'T00:00:00Z');
            if (dateB - dateA !== 0) {
                return dateB - dateA;
            }
            return new Date(b.startDate + 'T00:00:00Z') - new Date(a.startDate + 'T00:00:00Z');
        });

        sortedEducation.forEach(entry => {
            const eduDiv = document.createElement('div');
            eduDiv.classList.add('education-item');

            const institution = document.createElement('h3');
            institution.textContent = entry.institution;
            eduDiv.appendChild(institution);

            const degree = document.createElement('p');
            const duration = calculateDuration(entry.startDate, entry.endDate, lang);
            const dates = formatDates(entry.startDate, entry.endDate, lang);
            degree.innerHTML = `${entry.degree[lang]} | ${dates} (${duration})`;
            eduDiv.appendChild(degree);

            educationList.appendChild(eduDiv);
        });

        // Certifications
        document.getElementById('certifications-title').textContent = resumeData.certifications.title[lang];
        const certificationsList = document.getElementById('certifications-list');
        certificationsList.innerHTML = '';
        resumeData.certifications.list.forEach(cert => {
            const li = document.createElement('li');
            li.textContent = cert;
            certificationsList.appendChild(li);
        });

        // Honors
        document.getElementById('honors-title').textContent = resumeData.honors.title[lang];
        const honorsList = document.getElementById('honors-list');
        honorsList.innerHTML = '';
        resumeData.honors.list.forEach(honor => {
            const li = document.createElement('li');
            li.textContent = honor;
            honorsList.appendChild(li);
        });

        // Footer
        document.getElementById('footer-name').textContent = resumeData.name;
    }

    function calculateTotalExperience(jobs) {
        const intervals = jobs.map(job => ({
            start: new Date(job.startDate + 'T00:00:00Z'),
            end: job.endDate.toLowerCase() === 'present' ? new Date() : new Date(job.endDate + 'T00:00:00Z')
        }));

        if (intervals.length === 0) return 0;

        intervals.sort((a, b) => a.start - b.start);

        const merged = [intervals[0]];
        for (let i = 1; i < intervals.length; i++) {
            const current = intervals[i];
            const last = merged[merged.length - 1];
            if (current.start <= last.end) {
                last.end = new Date(Math.max(last.end, current.end));
            } else {
                merged.push(current);
            }
        }

        const totalMilliseconds = merged.reduce((acc, interval) => acc + (interval.end - interval.start), 0);
        const totalMonths = totalMilliseconds / (1000 * 60 * 60 * 24 * 30.4375); // Average days in a month
        return Math.round(totalMonths);
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

    function formatDuration(totalMonths, lang) {
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        let durationStr = '';
        if (years > 0) {
            durationStr += `${years} ${lang === 'fr' ? (years > 1 ? 'ans' : 'an') : (years > 1 ? 'years' : 'year')}`;
        }
        if (months > 0) {
            if (years > 0) durationStr += ', ';
            durationStr += `${months} ${lang === 'fr' ? 'mois' : (months > 1 ? 'months' : 'month')}`;
        }
        return durationStr;
    }

    function calculateDuration(startDateStr, endDateStr, lang) {
        const months = getDurationInMonths(startDateStr, endDateStr);
        return formatDuration(months, lang);
    }

    function formatDates(startDateStr, endDateStr, lang) {
        const startDate = new Date(startDateStr + 'T00:00:00Z');
        const endDate = endDateStr.toLowerCase() === 'present' ? new Date() : new Date(endDateStr + 'T00:00:00Z');
        const options = { year: 'numeric', month: 'long', timeZone: 'UTC' };

        const start = startDate.toLocaleDateString(lang, options);
        const end = endDateStr.toLowerCase() === 'present' ? (lang === 'fr' ? 'Aujourd\'hui' : 'Present') : endDate.toLocaleDateString(lang, options);

        return `${start} - ${end}`;
    }

    langSelector.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updatePage(currentLanguage);
    });

    themeSelector.addEventListener('change', (e) => {
        currentTheme = e.target.value;
        applyTheme(currentTheme);
    });

    applyTheme(currentTheme);
    loadContent();
});
