function formatDistanceToNow(date) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/;
    const parsedDate = date instanceof Date ? date : new Date(date);

    if (isNaN(parsedDate.getTime()) || !regex.test(date)) {
        return "Invalid date";
    }

    const now = new Date();
    const diffInMilliseconds = now - parsedDate;

    if (diffInMilliseconds < 1000) {
        return "less than a minute ago";
    } else if (diffInMilliseconds < 60000) {
        const seconds = Math.round(diffInMilliseconds / 1000);
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 3600000) {
        const minutes = Math.round(diffInMilliseconds / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 86400000) {
        const hours = Math.round(diffInMilliseconds / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 2592000000) {
        const days = Math.round(diffInMilliseconds / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 31536000000) {
        const months = Math.round(diffInMilliseconds / 2592000000);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else { // More than a year
        const years = Math.round(diffInMilliseconds / 31536000000);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
}


function subString(text, end) {
    if (typeof end === 'string') {
        end = parseInt(end);
    }
    return text.substring(0, end);
}

htmx.defineExtension('load-templates', {
    transformResponse: function (text, xhr, elt) {
        var nunjucksTemplate = htmx.closest(elt, '[nunjucks-template]');
        if (nunjucksTemplate) {
            var data = JSON.parse(text);
            var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
            var template = htmx.find('#' + templateName);
            template.innerHTML = `
        <div id="hub-container-id" data-id="{{ data.id }}" class="flex w-full flex-col space-y-6 mb-10">
            <div class="flex flex-col space-y-2 text-left">
            <div class="text-2xl md:text-[32px] font-semibold tracking-tight flex items-center w-full">
                {{ data.name }}
            </div>
            <p class="text-[15px] text-muted-foreground max-w-[600px]">
                {{ data.description }}
            </p>
            </div>

            <div class="mt-40">
                <div class="flex flex-col space-y-3 mb-10">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-xl font-semibold md:text-[30px] tracking-tight">Your Recent notes</p>
                        <div
                            class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                            >
                            <a href="/workspace{{ details.path }}/notes/new">
                                <div
                                class="relative btn-outline rounded-md flex items-center px-3 py-2 space-x-2 cursor-pointer"
                                >
                                <div class="text-muted-foreground">
                                    <svg
                                    class="size-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-plus-circle"
                                    >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12h8" />
                                    <path d="M12 8v8" />
                                    </svg>
                                </div>
                                <p class="text-sm">Create Note</p>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div class="space-y-8 mb-4">
                        {% for note in data.notes %}
                            <a class="cursor-pointer" href="/workspace{{ details.path }}/notes/{{ note.id }}/edit" preload="mouseover">
                                <div class="flex items-center space-x-2 btn-ghost py-3 px-3 rounded-md overflow-hidden">
                                    <div class="mr-3">
                                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/></svg>
                                    </div>
                                    <div class="space-y-1 w-full">
                                        <div class="w-full flex items-center justify-between text-sm font-medium leading-none">
                                            {% if note.name %}
                                            <div>{{ note.name }}</div>
                                            {% else %}
                                            <div>No name yet</div>
                                            {% endif %}
                                            <div class="updated-at hidden ml-auto text-xs font-medium">{{ note.updatedAt }}</div>
                                        </div>
                                        <div class="note-text text-xs text-muted-foreground">
                                            {% if note.text %}
                                            {{ note.text }}
                                            {% else %}
                                            No content yet!
                                            {% endif %}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        {% endfor %}
                    </div>
                </div>
                <div id="card" class="rounded-xl border bg-card text-card-foreground shadow relative top-9">
                    <div id="card-header" class="flex flex-col space-y-1.5 p-6">
                        <h3 id="card-title" class="font-semibold leading-none tracking-tight">Your Hub Members</h3>
                        <p id="card-description" class="text-sm text-muted-foreground">The hub members you collaborate with.</p>
                        {% if data.invitee|length == 0 %}
                        <p class="text-sm text-foreground font-medium">No hub member yet!</p>
                        {% endif %}
                    </div>
                    {% for invitee in data.invitee %}
                        <div id="card-content" class="p-6 pt-0">
                            <div onclick="window.location.href='/workspace/hubs/{{ data.id }}/invitees/{{ invitee.id }}'" class="grid gap-6 cursor-pointer">
                                <div class="flex items-center justify-between space-x-4">
                                    <div class="flex items-center space-x-4">
                                        <div class="bg-muted rounded-full">
                                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>
                                        </div>
                                        <div>
                                        <p class="text-sm font-medium leading-none">{{ invitee.name }}</p>
                                        <p class="text-sm text-muted-foreground">{{ invitee.email }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    <div class="mr-4 cursor-pointer">
                                        <a href="/workspace/hubs/{{ data.id }}/invitees/{{ invitee.id }}/chat">
                                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                        </a>
                                    </div>
                                    <button class="btn-outline btn-base-size text-sm rounded-md flex items-center justify-center">{{ invitee.role }}</button>
                                </div>
                            </div>
                        </div>
                    {% endfor %}
                    <div id="card-footer" class="flex items-center p-6 pt-0"></div>
                </div>
            </div>
        </div>

        <div class="w-full h-full px-5">
            <div class="flex flex-col space-y-2 text-left">
                <div class="flex items-center justify-between mb-4">
                    <p class="text-xl font-semibold md:text-[30px] tracking-tight">Your Documents</p>
                    <div
                        class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                        >
                        <div>
                            <div
                            >
                            <form id="upload-documents-form" onsubmit="event.preventDefault()">
                                <label
                                    for="file"
                                    class="relative btn-outline rounded-md flex items-center px-3 py-2 space-x-2 cursor-pointer"
                                >
                                    <div class="text-muted-foreground">
                                        <svg
                                        class="size-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="lucide lucide-plus-circle"
                                        >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8 12h8" />
                                        <path d="M12 8v8" />
                                        </svg>
                                    </div>
                                    <span class="text-sm select-none">Upload a document</span>
                                    <input
                                    id="file"
                                    name="file"
                                    type="file"
                                    class="file-input sr-only"
                                    />
                                </label>
                                <button id="upload-document-submit" class="hidden" type="submit">Upload</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>    
            <div id="docuemnts-card class="flex flex-col items-center justify-center">
                {% for document in data.documents %}
                    <div>
                        <div class="grid gap-6 cursor-pointer mb-4">
                            <div class="flex items-center justify-between space-x-4">
                                <div class="flex items-center space-x-4">
                                    <div class="bg-muted rounded-full document-icon">
                                        
                                    </div>
                                    <div>
                                    <p class="text-sm font-medium leading-none"></p>
                                </div>
                            </div>
                            <div class="flex items-center">
                                <div class="mr-4 cursor-pointer">
                                    <button data-href="{{ document }}" class="file-download flex items-center justify-center" onclick="window.open('{{ document }}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                    </button>
                                </div>
                                <button class="btn-outline btn-base-size text-sm rounded-md flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                {% endfor %}
            </div>
        </div>
        <script nonce="{{ nonce }}">
            const fileInput = document.getElementById('file');
            const submitButton = document.getElementById('upload-document-submit');

            submitButton.addEventListener('click', async () => {
                const file = fileInput.files[0];

                if (!file) {
                    alert('Please select a file to upload');
                    return;
                }

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await fetch(
                        "/api/v1/hubs/{{ data.id }}/upload-file?to=documents",
                        {
                        method: 'POST',
                        body: formData,
                        },
                    );
                    const data = await res.json();
                    console.log(data.url);
                } catch (e) {
                    console.log(e);
                }
            });

            if (fileInput) {
                fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    console.log(fileInput.files[0]);
                    submitButton.click();
                }
                });
            }
        </script>
      `;
            if (template) {
                return nunjucks.renderString(template.innerHTML, data);
            } else {
                return nunjucks.render(templateName, data);
            }
        }
    },
});

setTimeout(() => {
    const hubId = document.getElementById('hub-container-id').getAttribute('data-id');
    const dates = document.querySelectorAll('.updated-at')
    const note_texts = document.querySelectorAll('.note-text')
    const docIcons = document.querySelectorAll('.document-icon')
    const docDownload = document.querySelectorAll('.file-download')
    let docsData = [];
    const image_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-image"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="12" r="2"/><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22"/></svg>'
    const file_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>'
    note_texts.forEach((n) => {
        if (n.textContent.length > 300) {
            n.textContent = `${subString(n.textContent, 300)}...`
        }
        n.textContent = `${subString(n.textContent, 300)}`
    })
    dates.forEach((d) => {
        d.classList.remove('hidden')
        d.textContent = `${formatDistanceToNow(d.textContent)}`
    })

    for (let d of docDownload) {
        let extIcon;
        const pathParts = d.getAttribute('data-href').split('/');
        const fileName = pathParts[pathParts.length - 1];
        const [name, ext] = fileName.split('.');

        if (ext === 'jpeg' || ext === 'png' || ext === 'jpeg' || ext === 'webp') {
            extIcon = image_icon;
        } else {
            extIcon = file_icon;
        }
        docsData.push({"key": name, "filename": fileName, "extIcon": extIcon})
    }

    console.log(docsData)
    docsData.forEach((d) => {
    })

}, 100)

