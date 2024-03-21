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
<div id="hub-container-id" data-hub-id="{{ data.id }}" class="flex w-full flex-col space-y-6 mb-10">
    <div class="flex flex-col space-y-2 text-left">
        <div class="text-2xl md:text-[32px] font-semibold tracking-tight flex items-center w-full">
            {{ data.name }}
        </div>
        <p class="text-[15px] text-muted-foreground max-w-[600px]">
            {{ data.description }}
        </p>
    </div>

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
                <a class="cursor-pointer" href="/workspace{{ details.path }}/notes/{{ note.id }}/edit" preload="mouseover" title="{{ note.name }}">
                    <div class="flex items-center space-x-2 btn-ghost py-3 px-3 rounded-md overflow-hidden">
                        <div class="mr-3">
                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/></svg>
                        </div>
                        <div class="space-y-1 w-full">
                            <div class="w-full flex items-center justify-between text-sm font-medium leading-none">
                                {% if note.name %}
                                    <span class="note-name">{{ note.name }}</span>
                                {% else %}
                                    No name yet
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
            {% if data.notes|length == 0 %}
            <div class="py-3 {% if data.notes|length == 0 %}mt-4{% else %}mt-6{% endif %} btn-outline rounded-md">
                <div class="flex items-center justify-center space-x-4 py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-sm font-medium text-center">
                    You don't have any notes yet!
                    </p>
                </div>
            </div>
            {% endif %}
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
                                class="file-input sr-only hidden"
                                />
                            </label>
                            <button id="upload-document-submit" class="hidden" type="submit">Upload</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>    
        <div id="documents-card class="flex flex-col items-center justify-center">
            {% for document in data.documents %}
                <div id="document-{{ document.key }}">
                    <div class="grid gap-6 cursor-pointer mb-4">
                        <div class="flex items-center justify-between space-x-4">
                            <div class="flex items-center space-x-4">
                                <div data-icon='{{ document.extIcon }}' class="bg-muted rounded-full document-icon">
                                    
                                </div>
                                <div>
                                <p class="text-sm font-medium leading-none">{{ document.fileName }}</p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <div class="mr-4 cursor-pointer">
                                <button class="file-download flex items-center justify-center" onclick="window.open('{{ document.url }}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                </button>
                            </div>
                            <button data-key="{{ document.key }}" class="btn-outline btn-base-size text-sm rounded-md flex items-center justify-center file-delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            {% endfor %}
            {% if data.documents|length == 0 %}
                    <div class="py-3 {% if data.documents|length == 0 %}mt-4{% else %}mt-6{% endif %} btn-outline rounded-md">
                    <div class="flex items-center justify-center space-x-4 py-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <p class="text-sm font-medium text-center">
                        You don't have any documents yet!
                        </p>
                    </div>
                    </div>
            {% endif %}
        </div>
    </div>

    <div id="members-container" class="flex flex-col space-y-2 mt-6" data-hx-ext="preload">
        <div class="flex items-center justify-between mb-4">
            <p class="text-xl font-semibold md:text-[30px] tracking-tight">Your Hub members</p>
            <div
                class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <a href="/workspace/hubs/add-invitee">
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
                        <p class="text-sm">Add member</p>
                    </div>
                </a>
            </div>
        </div>
        {% for invitee in data.invitee %}   
            <div
                id="invitee-{{ invitee.id }}"
                class="flex items-center justify-between mb-3 gap-2 overflow-hidden bg-outline rounded-lg border p-3 text-left text-sm transition-all"
            >
                <div class="w-full flex space-x-2 items-center">
                    <div class="mx-auto bg-secondary p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="flex flex-col space-y-2 w-full">
                        <p>{{ invitee.name }}</p>
                        <p class="text-muted-foreground text-sm">{{ invitee.role | capitalize  }}</p>
                    </div>
                </div>
                <div class="flex w-full flex-col items-end">
                    <div class="flex space-x-2">
                        <div class="btn-ghost px-2 py-1 rounded-md cursor-pointer">
                            <a title="Edit" href="/workspace/hubs/{{ invitee.hubId }}/invitees/{{ invitee.id }}/edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </a>
                            </div>
                        <div id="{{ invitee.id }}" data-id="{{ invitee.id }}" title="Delete" class="btn-ghost px-2 py-1 rounded-md cursor-pointer delete-invitee-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </div>
                    </div>
                </div>
            </div>
        {% endfor %}
        {% if data.invitee|length == 0 %}
            <div class="py-3 {% if data.invitee|length == 0 %}mt-4{% else %}mt-6{% endif %} btn-outline rounded-md">
            <div class="flex items-center justify-center space-x-4 py-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p class="text-sm font-medium text-center">
                You don't have any members yet!
                </p>
            </div>
            </div>
        {% endif %}
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
    const hub = document.getElementById('hub-container-id')
    const hubId = hub.getAttribute('data-hub-id');
    const dates = document.querySelectorAll('.updated-at')
    const note_texts = document.querySelectorAll('.note-text')
    const note_names = document.querySelectorAll('.note-name')
    const docIcons = document.querySelectorAll('.document-icon')
    const docDownload = document.querySelectorAll('.file-download')
    const docDelete = document.querySelectorAll('.file-delete')
    let windowWidth = window.innerWidth;

    window.addEventListener('resize', () => {
        windowWidth = window.innerWidth;
    });

    note_names.forEach((n) => {
        if (windowWidth < 560) {
            n.textContent = `${subString(n.textContent, Math.round(n.textContent.length / 2))}...`
        }
        n.textContent = `${subString(n.textContent, 300)}`
    })
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

    docIcons.forEach((i) => {
        const icon = i.getAttribute('data-icon')
        i.innerHTML = icon
    })

    docDelete.forEach((d) => {
        const fileId = d.getAttribute('data-key')

        const fileHTML = document.getElementById(`document-${fileId}`)

        d.addEventListener('click', async (e) => {
            console.log('clicked')
            fileHTML.remove()

            let res = await fetch(`/api/v1/hubs/${hubId}/file/${fileId}?from=documents`, {
                method: 'DELETE',
            })
            res = await res.json()
            console.log(res.message)
        })

    })
}, 1000)

