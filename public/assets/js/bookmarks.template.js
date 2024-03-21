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
<div id="hubs-bookmarks-container" class="flex w-full flex-col space-y-6 mb-10">
    <div class="flex flex-col space-y-2 text-left">
        <div class="text-2xl md:text-[32px] font-semibold tracking-tight flex items-center w-full">
            Your Bookmarks
        </div>
        <p class="text-[15px] text-muted-foreground max-w-[600px]">
            Seamlessly Collect and Catalog Valuable Insights
        </p>
    </div>

    <div class="flex flex-col space-y-3 mb-10">
        <div class="flex items-center justify-between mb-4">
            <p class="text-xl font-semibold md:text-[30px] tracking-tight">Your Recent Bookmarks</p>
            <div
                class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <a href="/workspace/bookmarks/new">
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
                        <p class="text-sm">Create a bookmark</p>
                    </div>
                </a>
            </div>
        </div>
        <div class="space-y-8 mb-4">
            {% for bookmark in data %}
                <a class="cursor-pointer" href="{{ bookmark.url }}" title="{{ bookmark.name }}">
                    <div class="flex items-center space-x-2 btn-ghost py-3 px-3 rounded-md overflow-hidden">
                        <div class="mr-3">
                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                        </div>
                        <div class="space-y-1 w-full">
                            <div class="w-full flex items-center justify-between text-sm font-medium leading-none">
                                {% if bookmark.name %}
                                    <span class="bookmark-name">{{ bookmark.name }}</span>
                                {% else %}
                                    No name yet
                                {% endif %}
                                <div class="updated-at hidden ml-auto text-xs font-medium">{{ bookmark.updatedAt }}</div>
                            </div>
                            <div class="bookmark-text text-xs text-muted-foreground">
                                {% if bookmark.content %}
                                    {{ bookmark.content }}
                                {% else %}
                                    No content yet!
                                {% endif %}
                            </div>
                        </div>
                    </div>
                </a>
            {% endfor %}
            {% if data|length == 0 %}
            <div class="py-3 {% if data|length == 0 %}mt-4{% else %}mt-6{% endif %} btn-outline rounded-md">
                <div class="flex items-center justify-center space-x-4 py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-sm font-medium text-center">
                    You don't have any bookmarks yet!
                    </p>
                </div>
            </div>
            {% endif %}
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
    dates.forEach((d) => {
        d.textContent = `${formatDistanceToNow(d.textContent)}`
        d.classList.remove('hidden')
    })
}, 1000)

