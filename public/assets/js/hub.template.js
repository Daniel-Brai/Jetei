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
        <div class="flex w-full flex-col space-y-6 sm:w-[600px] mb-10">
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
    const dates = document.querySelectorAll('.updated-at')
    const note_texts = document.querySelectorAll('.note-text')
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
}, 100)
