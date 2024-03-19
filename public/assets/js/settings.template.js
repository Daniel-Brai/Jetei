htmx.defineExtension('load-templates', {
  transformResponse: function (text, xhr, elt) {
    var nunjucksTemplate = htmx.closest(elt, '[nunjucks-template]');
    if (nunjucksTemplate) {
      var data = JSON.parse(text);
      var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
      var template = htmx.find('#' + templateName);
      template.innerHTML = `
<form class="mb-24 px-4 sm:px-8">
    <div class="space-y-12">
      <div class="border-b border-white pb-12">
        <h2 class="text-xl font-semibold leading-7">Profile</h2>
        <p class="mt-1 text-sm leading-6">
          This information will be displayed publicly so be careful what you
          share.
        </p>

        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label
              for="name"
              class="block text-sm font-medium leading-6"
              >Name</label
            >
            <div class="mt-2">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="text"
                    id="name"
                    name="name"
                    minlength="2"
                    value="{{ data.profile.name }}"
                />
            </div>
          </div>

          <div class="col-span-full">
            <label
              for="bio"
              class="block text-sm font-medium leading-6"
              >Bio</label
            >
            <div class="mt-2">
                <textarea
                    id="bio"
                    name="bio"
                    style="resize: none; overflow: hidden;"
                    class="border flex transition-all w-full rounded-md bg-transparent px-3 py-6 text-[15.5px] shadow-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value="{{ data.profile.bio }}"
                    autofocus
                    >
                </textarea>
            </div>
            <p class="mt-3 text-sm leading-6 text-gray-600">
              Write a few sentences about yourself.
            </p>
          </div>

          <div class="col-span-full">
            <div
              class="block text-sm font-medium leading-6"
              >Photo</div
            >
            <div class="mt-2 flex items-center gap-x-3">
              {% if data.profile.avatar %}
                <img src="{{ data.profile.avatar }}" class="h-12 w-12" />
              {% else %}
              <svg
                class="h-12 w-12 text-gray-300"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  clip-rule="evenodd"
                />
              </svg>
              {% endif %}
              <div class="flex text-sm leading-6 text-white">
                  <label
                    for="avatar"
                    class="relative cursor-pointer rounded-md btn-outline font-semibold focus-within:outline-none py-2 px-2"
                  >
                    <span>Upload a photo</span>
                    <input
                      id="avatar"
                      name="avatar"
                      type="file"
                      class="sr-only"
                    />
                  </label>
                </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-b border-white pb-12">
        <h2 class="text-base font-semibold leading-7">
          Personal Information
        </h2>
        <p class="mt-1 text-sm leading-6">
          Use a permanent address where you can receive mail.
        </p>

        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label
              for="email"
              class="block text-sm font-medium leading-6"
              >Email address</label
            >
            <div class="mt-2">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    id="email"
                    name="email"
                    minlength="2"
                    value="{{ data.email }}"
                />
            </div>
          </div>
        </div>
      </div>

       <div class="mt-6 border-b border-white pb-12">
        <h2 class="text-base font-semibold leading-7">
          Change Account Password
        </h2>
        <p class="mt-1 text-sm leading-6">
          Update your password by filling the form below
        </p>  

        <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label
              for="new_password"
              class="block text-sm font-medium leading-6"
              >Password</label
            >
            <div class="mt-2">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="password"
                    id="new_password"
                    name="new_password"
                    minlength="8"
                />
            </div>
          </div>
          <div class="sm:col-span-4">
            <label
              for="new_password"
              class="block text-sm font-medium leading-6"
              >Password</label
            >
            <div class="mt-2">
                <input
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-white file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="password"
                    id="new_password_confirmation"
                    name="new_password_confirmation"
                    minlength="8"
                />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end gap-x-6">
        <button
            id="cancel-btn"
            type="button"
            name="cancel"
            class="btn-ghost btn-base-size text-sm rounded-md flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            data-loading-disable
            >
            Cancel
        </button>
        <button
            id="save-btn"
            type="button"
            name="save"
            class="btn-base-variant btn-base-size text-sm rounded-md flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            data-loading-disable
            >
            Save
        </button>
      </div>
    </div>
  </form> 
            
            `
      if (template) {
        return nunjucks.renderString(template.innerHTML, data);
      } else {
        return nunjucks.render(templateName, data);
      }
    }
  },
});


console.log("Done")

